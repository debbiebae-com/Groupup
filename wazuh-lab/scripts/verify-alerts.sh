#!/usr/bin/env bash
# =============================================================================
#  Wazuh SIEM Lab : alert verification
#  Run ON THE WAZUH SERVER (manager) to prove detections landed.
#
#      sudo ./verify-alerts.sh
#      sudo ./verify-alerts.sh --agent test-endpoint --since 24
#      sudo ./verify-alerts.sh --json /tmp/my-alerts.json     # offline testing
#
#  Parses /var/ossec/logs/alerts/alerts.json (one JSON document per line) with
#  python3, so it reads real fields rather than re-parsing the plain-text log:
#
#      rule.id, rule.level, rule.description, agent.name, data.srcip
#
#  Produces the evidence table for your report: per-rule counts, the required
#  detection checklist, top source addresses, and the raw alert tail.
# =============================================================================
set -uo pipefail

ALERTS_JSON="${ALERTS_JSON:-/var/ossec/logs/alerts/alerts.json}"
ALERTS_LOG="${ALERTS_LOG:-/var/ossec/logs/alerts/alerts.log}"
AGENT_NAME="${AGENT_NAME:-test-endpoint}"
SINCE_HOURS="${SINCE_HOURS:-0}"     # 0 = no time filter

C_RESET=$'\033[0m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'
C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_CYN=$'\033[36m'

usage() {
  cat <<'EOF'
Wazuh SIEM Lab : alert verification

Usage: sudo ./verify-alerts.sh [options]

  -a, --agent <name>   agent to report on (default: test-endpoint)
  -s, --since <hours>  only count alerts from the last N hours (default: all)
  -j, --json <path>    alerts JSON file (default: /var/ossec/logs/alerts/alerts.json)
      --log <path>     plain-text alerts file used for the raw tail
  -h, --help           show this help

Offline testing (no manager needed):
  ./verify-alerts.sh --json sample-alerts.json --agent test-endpoint
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -a|--agent) AGENT_NAME="${2:-}"; shift 2 ;;
    -s|--since) SINCE_HOURS="${2:-0}"; shift 2 ;;
    -j|--json)  ALERTS_JSON="${2:-}"; shift 2 ;;
    --log)      ALERTS_LOG="${2:-}"; shift 2 ;;
    -h|--help)  usage; exit 0 ;;
    *) echo "Unknown argument: $1 (try --help)" >&2; exit 2 ;;
  esac
done

heading() {
  echo
  echo "${C_CYN}----------------------------------------------------------------${C_RESET}"
  echo "${C_BOLD} $1${C_RESET}"
  echo "${C_CYN}----------------------------------------------------------------${C_RESET}"
}

echo
echo "${C_BOLD}Wazuh SIEM Lab : alert verification${C_RESET}"
echo "${C_DIM}manager: $(hostname)   |   $(date -u '+%Y-%m-%dT%H:%M:%SZ')   |   agent: $AGENT_NAME${C_RESET}"
echo "${C_DIM}source:  $ALERTS_JSON${C_RESET}"

# ---------------------------------------------------------------- services
# Only meaningful on the manager itself; skipped for offline runs.
if [[ -d /var/ossec ]] && command -v systemctl >/dev/null 2>&1; then
  heading "1. Service health"
  for svc in wazuh-manager wazuh-indexer wazuh-dashboard; do
    state=$(systemctl is-active "$svc" 2>/dev/null || echo "unknown")
    if [[ "$state" == "active" ]]; then
      printf '  %sOK%s   %-18s %s\n' "$C_GRN" "$C_RESET" "$svc" "$state"
    else
      printf '  %s!!%s   %-18s %s\n' "$C_RED" "$C_RESET" "$svc" "$state"
    fi
  done
fi

# ------------------------------------------------------------------ agents
if [[ -x /var/ossec/bin/agent_control ]]; then
  heading "2. Enrolled agents"
  /var/ossec/bin/agent_control -l 2>/dev/null | sed 's/^/  /'
fi

# ------------------------------------------------------------------ parse
if [[ ! -r "$ALERTS_JSON" ]]; then
  echo
  echo "  ${C_RED}Cannot read $ALERTS_JSON${C_RESET}"
  echo "  ${C_DIM}Alerts are written by wazuh-manager. Check the path, or pass --json FILE.${C_RESET}"
  exit 1
fi

command -v python3 >/dev/null 2>&1 || {
  echo "  ${C_RED}python3 not found${C_RESET}"; exit 1
}

heading "3. Detections by rule"
echo

python3 - "$ALERTS_JSON" "$AGENT_NAME" "$SINCE_HOURS" <<'PY'
import json, sys
from collections import Counter
from datetime import datetime, timedelta, timezone

path, agent_filter, since_hours = sys.argv[1], sys.argv[2], float(sys.argv[3] or 0)
cutoff = datetime.now(timezone.utc) - timedelta(hours=since_hours) if since_hours else None

counts = Counter()
levels = {}
agents = Counter()      # every agent seen in the file
ips = Counter()
total = 0
parsed = 0
unparsed = 0

with open(path, "r", encoding="utf-8", errors="replace") as fh:
    for line in fh:
        line = line.strip()
        if not line:
            continue
        try:
            doc = json.loads(line)
        except json.JSONDecodeError:
            unparsed += 1
            continue

        rule = doc.get("rule", {}) or {}
        agent = (doc.get("agent", {}) or {}).get("name", "unknown")
        parsed += 1
        agents[agent] += 1

        if cutoff:
            ts = doc.get("timestamp", "")
            try:
                when = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                if when < cutoff:
                    continue
            except Exception:
                pass

        if agent_filter and agent != agent_filter:
            continue

        rid = str(rule.get("id", "?"))
        lvl = rule.get("level", "?")
        desc = rule.get("description", "").strip()
        counts[(rid, str(lvl), desc)] += 1
        levels[rid] = lvl
        total += 1

        data = doc.get("data", {}) or {}
        src = data.get("srcip") or data.get("src_ip")
        if src:
            ips[str(src)] += 1

if total == 0:
    print(f"  (no alerts for agent '{agent_filter}' in this file)")
    others = [(n, name) for name, n in agents.items() if name != agent_filter]
    if others:
        print()
        print("  alerts do exist for other agents:")
        for n, name in sorted(others, reverse=True)[:5]:
            print(f"    {n:>5}  {name}")
    elif parsed == 0:
        print("  the alert file contains no parseable documents")
    if unparsed:
        print(f"  ({unparsed} unparseable line(s) skipped)")
    sys.exit(0)

print(f"  {'RULE':<8} {'LEVEL':<6} {'COUNT':<6} DESCRIPTION")
print(f"  {'='*8} {'='*6} {'='*6} {'='*52}")
for (rid, lvl, desc), n in sorted(counts.items(), key=lambda kv: (-int(kv[0][1]) if str(kv[0][1]).isdigit() else 0, -kv[1])):
    color = ""
    reset = ""
    if str(lvl).isdigit():
        if int(lvl) >= 12:
            color, reset = "\033[31m", "\033[0m"
        elif int(lvl) >= 10:
            color, reset = "\033[33m", "\033[0m"
    print(f"  {color}{rid:<8} {str(lvl):<6} {n:<6}{reset} {desc[:88]}")
print()
print(f"  total alerts for {agent_filter}: {total}")
if unparsed:
    print(f"  ({unparsed} unparseable line(s) skipped)")

# Hand the numbers to the shell via a temp summary file for the checklist.
with open("/tmp/.wazuh-lab-rulecounts", "w", encoding="utf-8") as out:
    for (rid, lvl, _), n in counts.items():
        out.write(f"{rid}\t{lvl}\t{n}\n")
with open("/tmp/.wazuh-lab-ips", "w", encoding="utf-8") as out:
    for ip, n in ips.most_common(10):
        out.write(f"{n}\t{ip}\n")
PY

# --------------------------------------------------------------- checklist
RULE_COUNTS="/tmp/.wazuh-lab-rulecounts"
count_rule() {
  # $1..$n = rule ids; prints the summed count
  local sum=0 rid n
  for rid in "$@"; do
    n=$(awk -F'\t' -v r="$rid" '$1==r {s+=$3} END {print s+0}' "$RULE_COUNTS" 2>/dev/null)
    sum=$((sum + n))
  done
  echo "$sum"
}

if [[ -f "$RULE_COUNTS" ]]; then
  heading "4. Required detections : checklist"
  check() {
    local label="$1"; shift
    local n
    n=$(count_rule "$@")
    if [[ "$n" -gt 0 ]]; then
      printf '  %sPASS%s  %-44s %s%d alert(s)%s\n' "$C_GRN" "$C_RESET" "$label" "$C_BOLD" "$n" "$C_RESET"
    else
      printf '  %sFAIL%s  %-44s %s0 : not detected yet%s\n' "$C_RED" "$C_RESET" "$label" "$C_DIM" "$C_RESET"
    fi
  }

  check "Failed SSH authentication"            5710 5711 5760
  check "SSH brute force"                      5712 5763 100100
  check "Successful SSH login (baseline)"      5715
  check "SSH success AFTER brute force"        100101
  check "File modified (FIM)"                  550 100120
  check "File added (FIM)"                     554
  check "File deleted (FIM)"                   553
  check "Sensitive system file modified"       100120
  check "Persistence artefact created"         100121
  check "Privilege escalation via sudo"        5402 100110
  check "Repeated failed sudo"                 100111 5404
  check "Privilege config modified"            100112
  check "Local account database modified"      100130
  check "SSH daemon config changed"            100131

  # ------------------------------------------------------------------ IPs
  if [[ -s /tmp/.wazuh-lab-ips ]]; then
    heading "5. Top source addresses (authentication events)"
    awk -F'\t' '{printf "  %5d  %s\n", $1, $2}' /tmp/.wazuh-lab-ips
  fi
  rm -f "$RULE_COUNTS" /tmp/.wazuh-lab-ips
fi

# -------------------------------------------------------------------- tail
heading "6. Most recent raw alerts"
if [[ -r "$ALERTS_LOG" ]]; then
  tail -30 "$ALERTS_LOG" | sed 's/^/  /'
elif [[ -r "$ALERTS_JSON" ]]; then
  tail -3 "$ALERTS_JSON" | sed 's/^/  /'
else
  echo "  ${C_DIM}(plain-text alert log not available)${C_RESET}"
fi

# --------------------------------------------------------------- next steps
heading "7. Next steps"
printf '  Dashboard : https://%s  (admin)\n' "$(hostname -I 2>/dev/null | awk '{print $1}')"
echo "  Filter    : agent.name:$AGENT_NAME and rule.level >= 7"
echo "  Charts    : docs/dashboard-filters.md section 6"
echo "  Report    : docs/lab-report-template.md section 5"
echo
