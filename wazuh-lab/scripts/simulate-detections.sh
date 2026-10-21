#!/usr/bin/env bash
# =============================================================================
#  Wazuh SIEM Lab — detection event simulator
#  Run ON THE TEST ENDPOINT (192.168.56.20) as root.
#
#      sudo ./simulate-detections.sh            # interactive menu
#      sudo ./simulate-detections.sh all        # run everything
#      sudo ./simulate-detections.sh ssh-bruteforce
#      sudo ./simulate-detections.sh fy
#
#  Each action prints a UTC timestamp so you can correlate it with the
#  dashboard alert timeline.
# =============================================================================
set -uo pipefail

LAB_DIR="/opt/lab-watch"
AGENT_LOG="/var/ossec/logs/ossec.log"
SSH_TARGET="${SSH_TARGET:-127.0.0.1}"
SSH_USER="${SSH_USER:-labuser}"

C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'
C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_CYN=$'\033[36m'

# ----------------------------------------------------------------- utilities

require_root() {
  if [[ $EUID -ne 0 ]]; then
    echo "${C_RED}Run this as root: sudo $0 $*${C_RESET}" >&2
    exit 1
  fi
}

usage() {
  cat <<'EOF'
Wazuh SIEM Lab : detection event simulator

Usage: sudo ./simulate-detections.sh [scenario]

  ssh-bruteforce   repeated failed SSH logins        -> 5710 -> 5712 / 100100
  ssh-suspicious   success after failures            -> 5715 -> 100101
  fim              create / modify / delete files    -> 554 / 550 / 553
  fim-critical     sensitive paths + persistence     -> 100120-100122
  privesc          interactive root shell            -> 5402 -> 100110
  sudo-fail        repeated failed sudo              -> 100111
  persistence      account + config tampering        -> 100130 / 100112
  all              run every scenario
  menu             interactive menu (default)

Environment overrides:
  SSH_TARGET  (default 127.0.0.1)   SSH_USER (default labuser)
EOF
}

stamp() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }

banner() {
  echo
  echo "${C_CYN}================================================================${C_RESET}"
  echo "${C_BOLD}  $1${C_RESET}"
  echo "${C_DIM}  started $(stamp)   expected: $2${C_RESET}"
  echo "${C_CYN}================================================================${C_RESET}"
}

ok()   { echo "  ${C_GRN}✔${C_RESET} $*"; }
info() { echo "  ${C_DIM}·${C_RESET} $*"; }
warn() { echo "  ${C_YEL}!${C_RESET} $*"; }

ensure_agent() {
  if ! systemctl is-active --quiet wazuh-agent; then
    warn "wazuh-agent is not running — starting it"
    systemctl start wazuh-agent
    sleep 2
  fi
  ok "wazuh-agent active"
  info "manager: $(awk -F'>' '/<address>/{gsub(/<\/address/,"",$2); print $2; exit}' /var/ossec/etc/ossec.conf 2>/dev/null)"
}

ensure_sshpass() {
  if ! command -v sshpass >/dev/null 2>&1; then
    info "installing sshpass (needed to script failed logins)"
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq sshpass >/dev/null 2>&1 || {
      warn "could not install sshpass — run: sudo apt install sshpass"
      return 1
    }
  fi
  ok "sshpass available"
}

ensure_sshd() {
  if ! systemctl is-active --quiet ssh && ! systemctl is-active --quiet sshd; then
    warn "sshd is not running — starting it"
    systemctl start ssh 2>/dev/null || systemctl start sshd 2>/dev/null
    sleep 1
  fi
  if ! ss -ltn 2>/dev/null | grep -q ':22 '; then
    warn "nothing is listening on port 22; SSH detections will not fire"
  else
    ok "sshd listening on :22"
  fi
}

# ------------------------------------------------------------------ scenarios

scenario_ssh_bruteforce() {
  banner "1. SSH brute force — repeated failed logins" \
         "rules 5710 x12, then 5712 / custom 100100 (level 10)"
  ensure_agent; ensure_sshd; ensure_sshpass || return 1

  local users=(admin root ubuntu test oracle postgres admin root admin ubuntu root admin)
  local i=1
  for user in "${users[@]}"; do
    printf '  %s[%02d/%d]%s failed login attempt for %-8s ' "$C_DIM" "$i" "${#users[@]}" "$C_RESET" "$user"
    if sshpass -p 'WrongPassword!' ssh \
        -o PreferredAuthentications=password \
        -o PubkeyAuthentication=no \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o ConnectTimeout=4 \
        -o NumberOfPasswordPrompts=1 \
        "$user@$SSH_TARGET" 'exit' >/dev/null 2>&1; then
      echo "${C_YEL}UNEXPECTED SUCCESS${C_RESET}"
    else
      echo "${C_RED}denied${C_RESET}"
    fi
    i=$((i+1))
    sleep 1
  done

  ok "12 failures from $SSH_TARGET should now have produced 5710 and 5712/100100"
  info "Dashboard filter:  rule.id:(5710 OR 5712 OR 100100)"
}

scenario_ssh_suspicious() {
  banner "2. Suspicious SSH activity — success after failures" \
         "5715 (success) then custom 100101 (level 12)"
  ensure_agent; ensure_sshd; ensure_sshpass || return 1

  info "phase A — 8 failed attempts to prime the brute-force correlation"
  for i in $(seq 1 8); do
    sshpass -p 'WrongPassword!' ssh \
      -o PreferredAuthentications=password -o PubkeyAuthentication=no \
      -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
      -o ConnectTimeout=4 -o NumberOfPasswordPrompts=1 \
      "nobody$i@$SSH_TARGET" 'exit' >/dev/null 2>&1
    sleep 1
  done
  ok "failures sent"

  info "phase B — legitimate successful login within the correlation window"
  echo "${C_DIM}  You will be prompted for $SSH_USER's password once.${C_RESET}"
  if ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
         "$SSH_USER@$SSH_TARGET" 'echo "  authenticated as $(whoami) on $(hostname)"'; then
    ok "successful login recorded — 5715 and 100101 should fire"
  else
    warn "login failed; check the password for $SSH_USER"
  fi
  info "Dashboard filter:  rule.id:(5715 OR 100101)"
}

scenario_fim() {
  banner "3. File integrity monitoring — create, modify, delete" \
         "554 (added), 550 (modified), 553 (deleted)"
  ensure_agent
  mkdir -p "$LAB_DIR"

  local f="$LAB_DIR/lab-document.txt"

  echo "  ${C_DIM}·${C_RESET} creating $f"
  printf 'Sensitive lab content v1\nclassification: internal\n' > "$f"
  sleep 2

  echo "  ${C_DIM}·${C_RESET} modifying $f"
  printf 'classification: CONFIDENTIAL\nmodified by: $(whoami)\n' >> "$f"
  sleep 2

  local extra="$LAB_DIR/created-$(date +%s).txt"
  echo "  ${C_DIM}·${C_RESET} creating $extra"
  echo 'new artefact' > "$extra"
  sleep 2

  echo "  ${C_DIM}·${C_RESET} deleting $extra"
  rm -f "$extra"
  sleep 2

  ok "FIM events generated (wait ~5-20 s for the realtime watcher)"
  info "Dashboard filter:  rule.groups:syscheck   |   rule.id:(550 OR 553 OR 554)"
}

scenario_fim_critical() {
  banner "4. Critical file changes : sensitive paths and persistence" \
         "554/550/553 then custom 100120/100121/100122/100131 (level 7-10)"
  ensure_agent

  local cronfile="/etc/cron.d/lab-demo"
  local sshdconf="/etc/ssh/sshd_config"
  local sshd_bak="/root/.sshd_config.lab-bak"

  echo "  ${C_DIM}*${C_RESET} creating $cronfile (persistence artefact)"
  echo '# wazuh lab demo: harmless marker' > "$cronfile"
  sleep 2

  if [[ -w "$sshdconf" ]]; then
    echo "  ${C_DIM}*${C_RESET} appending a comment to sshd_config (sensitive file modification)"
    cp -a "$sshdconf" "$sshd_bak"
    echo '# wazuh-lab demo marker' >> "$sshdconf"
    sleep 3
    echo "  ${C_DIM}*${C_RESET} restoring sshd_config from the backup"
    cp -a "$sshd_bak" "$sshdconf"
    rm -f "$sshd_bak"
    sleep 2
  else
    warn "cannot write $sshdconf : skipping the sensitive-file test"
  fi

  echo "  ${C_DIM}*${C_RESET} deleting $cronfile (defence evasion)"
  rm -f "$cronfile"
  sleep 2

  ok "sensitive-path changes generated"
  info "Expected: 554 -> 100121, 550 -> 100120 + 100131, 553 -> 100122"
  info "Dashboard filter:  rule.id:(550 OR 553 OR 554 OR 100120 OR 100121 OR 100122 OR 100131)"
}

scenario_privesc() {
  banner "5. Privilege escalation — interactive root shell via sudo" \
         "5402 (sudo to root) then custom 100110 (level 10)"
  ensure_agent

  echo "  ${C_DIM}·${C_RESET} running: sudo bash -c 'id; echo shell-spawned'"
  if sudo bash -c 'id; echo shell-spawned'; then
    ok "root shell executed — 5402 and 100110 should fire"
  else
    warn "sudo failed; is $SUDO_USER in the sudo group?"
  fi

  sleep 1
  echo "  ${C_DIM}·${C_RESET} running: sudo -n true (non-interactive sudo)"
  sudo -n true 2>/dev/null && ok "sudo executed" || true

  info "Dashboard filter:  rule.id:(5402 OR 100110)   |   rule.groups:privilege_escalation"
}

scenario_sudo_fail() {
  banner "6. Failed sudo attempts" "custom 100111 (level 9)"
  ensure_agent

  local victim="${SUDO_USER:-labuser}"
  info "sending 4 wrong sudo passwords for $victim"
  for i in $(seq 1 4); do
    echo "${C_DIM}  attempt $i/4${C_RESET}"
    echo 'WrongPassword!' | timeout 10 su - "$victim" -c 'sudo -S id' >/dev/null 2>&1
    sleep 2
  done

  ok "failed sudo attempts sent"
  info "Dashboard filter:  rule.id:(100111 OR 5404 OR 5557)"
}

scenario_persistence() {
  banner "7. Other notable events — account and config tampering" \
         "custom 100130 (passwd change), 100121 (cron), 100112 (sudoers)"
  ensure_agent

  echo "  ${C_DIM}·${C_RESET} creating a temporary local account 'labintruder'"
  if id labintruder >/dev/null 2>&1; then
    info "account already exists — recreating"
    userdel -r labintruder >/dev/null 2>&1 || true
    sleep 1
  fi
  useradd -m -s /bin/bash labintruder 2>/dev/null && ok "account created (/etc/passwd changed)"
  sleep 3

  echo "  ${C_DIM}·${C_RESET} locking the demonstration account (second passwd change)"
  passwd -l labintruder >/dev/null 2>&1 && ok "account locked"
  sleep 2

  echo "  ${C_DIM}·${C_RESET} removing the demonstration account"
  userdel -r labintruder >/dev/null 2>&1 && ok "account removed"
  sleep 1

  echo "  ${C_DIM}·${C_RESET} touching /etc/sudoers modification time (no content change)"
  touch /etc/sudoers 2>/dev/null && ok "sudoers timestamp changed"
  sleep 2

  ok "account and config events generated"
  info "Dashboard filter:  rule.id:(100130 OR 100112 OR 550)"
}

scenario_all() {
  scenario_ssh_bruteforce
  sleep 3
  scenario_fim
  sleep 2
  scenario_fim_critical
  sleep 2
  scenario_privesc
  sleep 2
  scenario_sudo_fail
  sleep 2
  scenario_persistence
  echo
  echo "${C_CYN}================================================================${C_RESET}"
  echo "${C_BOLD}  All scenarios executed${C_RESET}"
  echo "  Open https://<WAZUH_SERVER_IP> → Threat Hunting → Events"
  echo "  Filter:  agent.name:test-endpoint and rule.level >= 7"
  echo "${C_CYN}================================================================${C_RESET}"
  echo
  echo "  Local evidence (last 15 alerts on this agent):"
  if [[ -r /var/ossec/logs/alerts/alerts.log ]]; then
    tail -15 /var/ossec/logs/alerts/alerts.log
  else
    info "alerts.log lives on the manager, not the agent — check the dashboard"
  fi
}

menu() {
  cat <<EOF

${C_BOLD}Wazuh SIEM Lab — detection simulator${C_RESET}
${C_DIM}host: $(hostname)  ·  agent: $(systemctl is-active wazuh-agent 2>/dev/null)${C_RESET}

  1) ssh-bruteforce     repeated failed SSH logins        → 5710 → 5712 / 100100
  2) ssh-suspicious     success after failures            → 5715 → 100101
  3) fim                create / modify / delete files    → 554 / 550 / 553
  4) fim-critical       sensitive paths + persistence     → 100120-100122
  5) privesc            interactive root shell            → 5402 → 100110
  6) sudo-fail          repeated failed sudo              → 100111
  7) persistence        account + config tampering        → 100130 / 100112
  8) all                run every scenario

  q) quit
EOF
  while true; do
    read -r -p "  select > " choice
    case "$choice" in
      1) scenario_ssh_bruteforce ;;
      2) scenario_ssh_suspicious ;;
      3) scenario_fim ;;
      4) scenario_fim_critical ;;
      5) scenario_privesc ;;
      6) scenario_sudo_fail ;;
      7) scenario_persistence ;;
      8) scenario_all ;;
      q|Q) exit 0 ;;
      *) warn "invalid selection" ;;
    esac
  done
}

# ---------------------------------------------------------------------- main

case "${1:-menu}" in
  -h|--help|help)
    usage
    exit 0
    ;;
esac

require_root "$@"

case "${1:-menu}" in
  ssh-bruteforce|brute) scenario_ssh_bruteforce ;;
  ssh-suspicious|suspicious) scenario_ssh_suspicious ;;
  fim) scenario_fim ;;
  fim-critical|critical) scenario_fim_critical ;;
  privesc|escalation) scenario_privesc ;;
  sudo-fail|sudo) scenario_sudo_fail ;;
  persistence|other) scenario_persistence ;;
  all) scenario_all ;;
  menu|"") menu ;;
  *) echo "Unknown scenario: $1 (try --help)" >&2; exit 2 ;;
esac
