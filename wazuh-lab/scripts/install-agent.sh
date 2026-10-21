#!/usr/bin/env bash
# =============================================================================
#  Wazuh SIEM Lab — agent install and enrollment helper
#  Run ON THE TEST ENDPOINT as root (or with sudo).
#
#      sudo ./install-agent.sh --manager 192.168.56.10
#      sudo ./install-agent.sh -m 192.168.56.10 -n test-endpoint -g default
#
#  Does what section 7 of the README describes, with checks at each step so
#  failures are explicit rather than silent.
# =============================================================================
set -uo pipefail

MANAGER_IP="${WAZUH_MANAGER:-}"
AGENT_NAME="${WAZUH_AGENT_NAME:-$(hostname -s)}"
AGENT_GROUP="${WAZUH_AGENT_GROUP:-default}"

C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'
C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_CYN=$'\033[36m'

step()  { echo; echo "${C_CYN}▸ $1${C_RESET}"; }
ok()    { echo "  ${C_GRN}✔${C_RESET} $*"; }
info()  { echo "  ${C_DIM}·${C_RESET} $*"; }
warn()  { echo "  ${C_YEL}!${C_RESET} $*"; }
die()   { echo "  ${C_RED}✘ $*${C_RESET}" >&2; exit 1; }

usage() {
  cat <<EOF
Usage: sudo $0 --manager <WAZUH_SERVER_IP> [options]

  -m, --manager <ip>     Wazuh manager address        (required)
  -n, --name <name>      agent name in the dashboard  (default: $(hostname -s))
  -g, --group <group>    agent group                  (default: default)
  -h, --help             show this help

Version compatibility: the agent must not be newer than the manager.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--manager) MANAGER_IP="${2:-}"; shift 2 ;;
    -n|--name)    AGENT_NAME="${2:-}"; shift 2 ;;
    -g|--group)   AGENT_GROUP="${2:-}"; shift 2 ;;
    -h|--help)    usage; exit 0 ;;
    *) die "Unknown argument: $1 (try --help)" ;;
  esac
done

[[ $EUID -eq 0 ]] || die "Run as root: sudo $0 --manager <ip>"
[[ -n "$MANAGER_IP" ]] || { usage; die "Manager IP is required"; }

echo
echo "${C_BOLD}Wazuh agent installer${C_RESET}"
info "manager: $MANAGER_IP"
info "agent:   $AGENT_NAME"
info "group:   $AGENT_GROUP"
info "host:    $(hostname) / $(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")"

# ---------------------------------------------------------------- reachability

step "1. Checking connectivity to the manager"
if ping -c 2 -W 2 "$MANAGER_IP" >/dev/null 2>&1; then
  ok "ICMP reachable"
else
  warn "no ICMP reply — this is normal if the manager blocks ping; continuing"
fi

if timeout 4 bash -c "cat < /dev/null > /dev/tcp/$MANAGER_IP/1514" 2>/dev/null; then
  ok "TCP 1514 (agent enrollment) reachable"
elif timeout 4 bash -c "cat < /dev/null > /dev/tcp/$MANAGER_IP/1515" 2>/dev/null; then
  ok "TCP 1515 (enrollment service) reachable"
else
  warn "TCP 1514/1515 not reachable — enrollment will fail"
  warn "on the manager: check 'ss -ltn | grep 151' and any firewall rules"
fi

# ------------------------------------------------------------------ prereqs

step "2. Installing prerequisites"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq || warn "apt-get update reported errors"
apt-get install -y -qq curl gnupg apt-transport-https openssh-server >/dev/null
ok "curl, gnupg, apt-transport-https, openssh-server present"

systemctl enable --now ssh >/dev/null 2>&1 || systemctl enable --now sshd >/dev/null 2>&1 || true
ok "sshd enabled"

# --------------------------------------------------------------------- repo

step "3. Adding the Wazuh APT repository"

if [[ ! -f /usr/share/keyrings/wazuh.gpg ]]; then
  curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH \
    | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import >/dev/null 2>&1 \
    || die "could not import the Wazuh GPG key (is outbound HTTPS allowed?)"
  chmod 644 /usr/share/keyrings/wazuh.gpg
  ok "GPG key imported"
else
  ok "GPG key already present"
fi

echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" \
  > /etc/apt/sources.list.d/wazuh.list
ok "repository configured"

apt-get update -qq || die "apt-get update failed after adding the repo"

# -------------------------------------------------------------------- install

step "4. Installing wazuh-agent and enrolling"
if command -v /var/ossec/bin/wazuh-control >/dev/null 2>&1 || [[ -x /var/ossec/bin/wazuh-control ]]; then
  ok "wazuh-agent already installed — reconfiguring"
  if [[ -f /var/ossec/etc/ossec.conf ]]; then
    cp -a /var/ossec/etc/ossec.conf "/var/ossec/etc/ossec.conf.bak.$(date +%s)"
    sed -i "s|<address>.*</address>|<address>$MANAGER_IP</address>|" /var/ossec/etc/ossec.conf
    ok "manager address rewritten"
  fi
else
  info "this downloads ~10 MB"
  if ! WAZUH_MANAGER="$MANAGER_IP" WAZUH_AGENT_NAME="$AGENT_NAME" WAZUH_AGENT_GROUP="$AGENT_GROUP" \
       apt-get install -y wazuh-agent >/dev/null 2>&1; then
    die "wazuh-agent installation failed — run 'apt-get install wazuh-agent' manually to see the error"
  fi
  ok "wazuh-agent installed and registered as '$AGENT_NAME'"
fi

# --------------------------------------------------------------------- start

step "5. Starting the agent"
systemctl daemon-reload
systemctl enable wazuh-agent >/dev/null 2>&1
systemctl restart wazuh-agent
sleep 3

if systemctl is-active --quiet wazuh-agent; then
  ok "wazuh-agent is active"
else
  warn "agent is not active — recent log:"
  tail -20 /var/ossec/logs/ossec.log | sed 's/^/     /'
fi

# ------------------------------------------------------------------- version

step "6. Verifying the connection"
info "waiting up to 20 s for the first heartbeat"
for i in $(seq 1 10); do
  if grep -qiE 'connected to the server|connection to server.*established|agent is connected' /var/ossec/logs/ossec.log 2>/dev/null; then
    ok "agent connected to $MANAGER_IP"
    break
  fi
  sleep 2
  [[ $i -eq 10 ]] && warn "no explicit 'connected' message yet — verify from the manager"
done

installed_ver=$(dpkg-query -W -f='${Version}' wazuh-agent 2>/dev/null || echo 'unknown')
info "installed agent version: $installed_ver"

# Hold the package so a routine upgrade doesn't outrun the manager
apt-mark hold wazuh-agent >/dev/null 2>&1 && ok "package held (prevents version drift)"

# ------------------------------------------------------------------ next steps

echo
echo "${C_CYN}────────────────────────────────────────────────────────────────${C_RESET}"
echo "${C_BOLD} Next steps${C_RESET}"
echo "${C_CYN}────────────────────────────────────────────────────────────────${C_RESET}"
echo "  On the manager, confirm enrollment:"
echo "     sudo /var/ossec/bin/agent_control -l"
echo
echo "  In the dashboard:"
echo "     https://$MANAGER_IP  →  Agents management  (should show 1 active)"
echo
echo "  Then add FIM to /var/ossec/etc/ossec.conf on this host:"
echo "     see config/syscheck-agent-block.xml"
echo "     sudo systemctl restart wazuh-agent"
echo
echo "  Generate events:"
echo "     sudo ./simulate-detections.sh all"
echo
echo "  Agent log: tail -f /var/ossec/logs/ossec.log"
echo
