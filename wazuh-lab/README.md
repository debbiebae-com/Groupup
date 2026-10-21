# Wazuh SIEM Lab — VirtualBox Deployment & Detection Guide

> **Option 2 — Install Wazuh in VirtualBox.** A Wazuh virtual machine monitoring a separate
> test endpoint, configured to detect failed logins, suspicious SSH activity, file changes,
> and privilege escalation.

This directory contains everything you need to stand the lab up and demonstrate each required
detection: step-by-step instructions, ready-to-paste custom rules, FIM configuration, and
scripts that generate the security events on demand.

---

## 1. Architecture

```
┌──────────────────────────────┐
│  Computer / Test Endpoint    │   Ubuntu Server VM · 192.168.56.20
│  (separate virtual machine)  │
│                              │
│  sshd · sudo · auditd logs   │
│  /var/ossec/etc/ossec.conf   │
└──────────────┬───────────────┘
               │  Wazuh Agent (TCP 1514, encrypted)
               ▼
┌──────────────────────────────┐
│  Wazuh Server (OVA appliance)│   192.168.56.10
│                              │
│  wazuh-manager   :1514/1515  │
│  wazuh-indexer   :9200       │
│  wazuh-dashboard :443        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Security Event Analysis     │   decoders → rules → alerts
│  (analysisd on the manager)  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Wazuh Dashboard             │   https://192.168.56.10
│  Alerts · Charts · Reports   │
└──────────────────────────────┘
```

**Data path:** the agent tails endpoint logs → ships them to the manager over an encrypted
channel → `wazuh-analysisd` decodes each event, runs it through the ruleset → matching events
become alerts → alerts are indexed and rendered in the dashboard.

---

## 2. What you will detect

| # | Requirement | Technique (ATT&CK) | Built-in rules | Event source |
|---|---|---|---|---|
| 1 | Repeated failed login attempts | T1110 Brute Force | **5710** (invalid user, L5), **5760** (auth failed, L5), **5712** (brute force, L10) | `sshd` |
| 2 | Suspicious SSH authentication activity | T1110 / T1078 | **5712**, **5763** (L10), **5715** (success, L3), custom **100101** (success after brute force, L12) | `sshd`, `pam` |
| 3 | Changes to monitored files | T1565 / T1098 | **550** (modified, L7), **553** (deleted, L7), **554** (added, L5), custom **100120–100122**, **100131** | `syscheck` (FIM) |
| 4 | Potential privilege escalation | T1548.003 | **5402** (sudo to root, L3), custom **100110** (interactive root shell, L10) | `sudo`, `pam` |
| 5 | Other notable events | T1136 / T1562.001 | New local account (**100130**), SSH daemon change (**100131**), cron/systemd persistence (**100121**) | `syscheck` |

Rule levels: **0–6** informational, **7–11** elevated, **12–15** critical.

---

## 3. Host prerequisites

| Resource | Minimum | Comfortable |
|---|---|---|
| RAM | 8 GB | 16 GB |
| CPU | 4 cores, hardware virtualisation enabled in BIOS | 8 cores |
| Disk | 70 GB free | 120 GB free |
| Software | VirtualBox 7.x | VirtualBox 7.x + Extension Pack |

Allocation for this lab:

| VM | vCPU | RAM | Disk | Role |
|---|---|---|---|---|
| `wazuh-server` | 4 | 4 GB | 50 GB | OVA appliance (manager + indexer + dashboard) |
| `test-endpoint` | 2 | 2 GB | 20 GB | Ubuntu Server 24.04 LTS, monitored host |

Downloads:

- VirtualBox — <https://www.virtualbox.org/wiki/Downloads>
- Wazuh OVA — <https://documentation.wazuh.com/current/deployment-options/virtual-machine/virtual-machine.html>
  (direct pattern: `https://packages.wazuh.com/4.x/vm/wazuh-<VERSION>.ova`, e.g. `wazuh-4.14.9.ova`)
- Ubuntu Server 24.04 LTS ISO — <https://ubuntu.com/download/server>

> Download the OVA **file**, not a `.sha256`. It is roughly 1.5 GB.

---

## 4. Phase 1 — Create the host-only lab network

Both VMs need to reach each other, and your host needs to reach the dashboard, but nothing
should be exposed to your real LAN.

1. **VirtualBox → File → Host Network Manager** (or *Tools → Network*).
2. Click **Create** → a `vboxnet0` adapter appears.
3. Configure it:

   | Field | Value |
   |---|---|
   | IPv4 Address | `192.168.56.1` |
   | IPv4 Network Mask | `255.255.255.0` |
   | DHCP Server | **Disabled** (we assign static IPs) |

4. Apply. Your host is now `192.168.56.1`, the Wazuh VM will be `.10`, the endpoint `.20`.

Each VM gets **two** network adapters:

| Adapter | Attached to | Purpose |
|---|---|---|
| Adapter 1 | NAT | Internet access (package downloads) |
| Adapter 2 | Host-only Adapter → `vboxnet0` | Lab traffic between VMs and host |

---

## 5. Phase 2 — Import and configure the Wazuh server

### 5.1 Import the appliance

1. **File → Import Appliance →** select the downloaded `.ova`.
2. Before finishing, open **Appliance Settings** and set:
   - RAM: **4096 MB**
   - CPUs: **4**
   - Keep both disk images.
3. Click **Import**.

### 5.2 Critical display setting

VirtualBox can freeze the appliance window with the default graphics controller.

**Settings → Display → (switch to Expert mode) → Graphics Controller → `VMSVGA`.**

### 5.3 Network adapters

**Settings → Network:**

- **Adapter 1:** Attached to `NAT`
- **Adapter 2:** Attached to `Host-only Adapter`, Name `vboxnet0`

### 5.4 First boot

Start the VM and log in at the console:

```
username: wazuh-user
password: wazuh
```

> These are the published defaults. `root` SSH login is disabled; `wazuh-user` has sudo.
> Become root with `sudo -i`.

### 5.5 Assign a static IP

Find the interface name first:

```bash
ip -br a
```

The host-only interface is usually `eth1` (check which one has no address or a `192.168.56.x` address).
Configure it with NetworkManager's TUI:

```bash
sudo nmtui
```

**Edit a connection →** select the host-only interface → **IPv4 CONFIGURATION = Manual**:

| Field | Value |
|---|---|
| Addresses | `192.168.56.10/24` |
| Gateway | *(leave empty)* |
| DNS servers | *(leave empty)* |
| **Automatically connect** | **checked** |

Save, quit, then bring it up:

```bash
sudo nmcli connection up <CONNECTION_NAME>
ip -br a show eth1
```

Confirm your host can reach it: `ping 192.168.56.10`.

### 5.6 Verify the services

```bash
sudo systemctl status wazuh-manager --no-pager
sudo systemctl status wazuh-indexer --no-pager
sudo systemctl status wazuh-dashboard --no-pager
```

All three should be **active (running)**. The indexer and dashboard can take 2–5 minutes after
first boot. Ports:

```bash
sudo ss -ltnp | grep -E ':(443|9200|1514|1515|55000)\b'
```

### 5.7 Open the dashboard

> Dedicated walkthrough, including NAT-only port forwarding and a troubleshooting table:
> [`docs/access-dashboard.md`](docs/access-dashboard.md)

From your **host** browser:

```
URL:      https://192.168.56.10
username: admin
password: admin
```

Accept the self-signed certificate warning (**Advanced → Proceed**).

> If the page never loads, confirm the host-only adapter is attached and that you are using
> `https://` — plain HTTP will not work.

### 5.8 Secure the defaults (do this now)

```bash
passwd                                   # change wazuh-user's OS password
sudo bash /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh \
  -u admin -p '<NEW_STRONG_PASSWORD>'
```

Then in the dashboard: **Server management → Settings → API configuration** — confirm the
dashboard can still reach the API after the change.

---

## 6. Phase 3 — Build the test endpoint

1. **New →** Name `test-endpoint`, Type `Linux`, Version `Ubuntu (64-bit)`.
2. RAM **2048 MB**, CPUs **2**, disk **20 GB**.
3. Attach the Ubuntu Server ISO to the optical drive and install.
   - Hostname: `test-endpoint`
   - Create user `labuser` (give it a password you'll type repeatedly)
   - **Install OpenSSH server: yes** ← required for the SSH detections
4. After install, power off, then **Settings → Network**:
   - Adapter 1: `NAT`
   - Adapter 2: `Host-only Adapter` → `vboxnet0`
5. Boot and set a static IP:

```bash
sudo nmtui     # or: sudo nano /etc/netplan/50-cloud-init.yaml
```

| Field | Value |
|---|---|
| Address | `192.168.56.20/24` |
| Gateway | *(empty)* |

Apply and verify:

```bash
ip -br a
ping -c2 192.168.56.10
```

6. Install prerequisites:

```bash
sudo apt update && sudo apt install -y curl gnupg apt-transport-https openssh-server openssl
sudo systemctl enable --now ssh
```

---

## 7. Phase 4 — Deploy the Wazuh agent

Run these **on the test endpoint** (`192.168.56.20`).

### 7.1 Add the repository and key

```bash
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | \
  sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import
sudo chmod 644 /usr/share/keyrings/wazuh.gpg

echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | \
  sudo tee /etc/apt/sources.list.d/wazuh.list

sudo apt update
```

### 7.2 Install, registering with the manager

```bash
sudo WAZUH_MANAGER="192.168.56.10" \
     WAZUH_AGENT_NAME="test-endpoint" \
     apt install -y wazuh-agent

sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-agent
```

### 7.3 Prevent accidental version drift

An agent must never be newer than its manager:

```bash
sudo apt-mark hold wazuh-agent
```

### 7.4 Confirm enrollment on the server

Back on the **Wazuh server**:

```bash
sudo /var/ossec/bin/agent_control -l
```

Expected:

```
ID: 001, Name: test-endpoint, IP: any, Active
```

Dashboard equivalent: **Agents management → Summary** shows `1` active agent.

> **If the agent shows `Never connected`:** check `sudo systemctl status wazuh-agent`,
> `sudo tail -50 /var/ossec/logs/ossec.log`, and `sudo grep -r 192.168.56.10 /var/ossec/etc/`.
> The most common cause is a wrong manager IP or a firewall blocking TCP 1514.

---

## 8. Phase 5 — Configure the detections

### 8.1 File Integrity Monitoring (on the endpoint)

Edit `/var/ossec/etc/ossec.conf` and add the block from
[`config/syscheck-agent-block.xml`](config/syscheck-agent-block.xml):

```xml
<syscheck>
  <frequency>300</frequency>

  <directories check_all="yes" report_changes="yes" realtime="yes">/opt/lab-watch</directories>
  <directories check_all="yes" report_changes="yes" realtime="yes">/etc</directories>
  <directories check_all="yes" report_changes="yes" realtime="yes">/root</directories>

  <ignore>/etc/mtab</ignore>
  <ignore>/etc/random-seed</ignore>
  <ignore>/etc/adjtime</ignore>
  <ignore>/etc/resolv.conf</ignore>
  <ignore type="sregex">.log$|.tmp$|.swp$</ignore>

  <alert_new_files>yes</alert_new_files>
  <scan_on_start>yes</scan_on_start>
</syscheck>
```

Notes:

- `realtime="yes"` only works on **directories**, and the directory must exist before the agent starts.
- A **first scan only records a baseline** — no alerts. Changes are alerted after that.
- `report_changes="yes"` stores the actual diff, visible in the dashboard.

Create the watched directory and restart:

```bash
sudo mkdir -p /opt/lab-watch
sudo systemctl restart wazuh-agent
sudo tail -20 /var/ossec/logs/ossec.log
```

### 8.2 Custom rules (on the Wazuh server)

Copy [`rules/local_rules.xml`](rules/local_rules.xml) into place:

```bash
sudo cp local_rules.xml /var/ossec/etc/rules/local_rules.xml
sudo chown wazuh:wazuh /var/ossec/etc/rules/local_rules.xml
sudo /var/ossec/bin/wazuh-analysisd -t          # syntax check
sudo systemctl restart wazuh-manager
```

> **Never edit the default rule files** (`/var/ossec/ruleset/rules/`) — they are overwritten on
> upgrade. Always use `/var/ossec/etc/rules/local_rules.xml` and start custom IDs at `100000`.

Validate a rule fires before attacking anything:

```bash
sudo /var/ossec/bin/wazuh-logtest
```

Paste a sample line:

```
Feb 11 10:15:31 test-endpoint sshd[4242]: Failed password for invalid user admin from 192.168.56.10 port 51122 ssh2
```

You should see **rule 5710** match (phase 3). Paste it 8 times within 120 seconds and rule
**5712** fires instead — that is the built-in correlation doing its job.

### 8.3 Optional — active response

To auto-block a brute-forcing IP for 180 seconds, add
[`config/active-response-manager-block.xml`](config/active-response-manager-block.xml) to the
manager's `/var/ossec/etc/ossec.conf`, then `sudo systemctl restart wazuh-manager`.

> Only enable this in the lab. A false positive on a management IP will lock you out of the
> endpoint; use the VM console or revert the block with `iptables -F`.

---

## 9. Phase 6 — Generate the security events

Run the simulator **on the test endpoint**:

```bash
chmod +x simulate-detections.sh
sudo ./simulate-detections.sh
```

Or run individual scenarios:

```bash
sudo ./simulate-detections.sh ssh-bruteforce
sudo ./simulate-detections.sh fim
sudo ./simulate-detections.sh privesc
sudo ./simulate-detections.sh persistence
sudo ./simulate-detections.sh all
```

What each one does:

| Scenario | Action | Expected alert |
|---|---|---|
| `ssh-bruteforce` | 12 failed SSH logins with invalid usernames from `127.0.0.1` | 5710 ×12 → **5712** / custom **100100** |
| `ssh-suspicious` | Failed logins, then a **successful** login | **5715** → custom **100101** (level 12) |
| `fim` | Create/modify/delete files in `/opt/lab-watch` | **554**, **550**, **553** |
| `fim-critical` | Create `/etc/cron.d/lab-demo`, comment-bump `sshd_config`, delete the cron file | **554 → 100121**, **550 → 100120 + 100131**, **553 → 100122** |
| `privesc` | `sudo bash -c id` (interactive root shell) | **5402** → custom **100110** |
| `sudo-fail` | 4 failed `sudo` password attempts | sudo failure rules → custom **100111** |

The script needs `sshpass` (installed automatically if missing) and prints a timestamp before
each action so you can correlate with the dashboard.

### Simulating a remote attacker (more realistic)

From the **Wazuh server**, attack the endpoint across the lab network:

```bash
sudo apt install -y hydra
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://192.168.56.20 -t 4 -V
```

The alerts will then show `data.srcip: 192.168.56.10`, which is what a real analyst would pivot on.

---

## 10. Phase 7 — Investigate in the dashboard

Open <https://192.168.56.10> → **Threat Hunting → Events**.

Useful DQL / KQL filters (paste into the search bar):

| Goal | Query |
|---|---|
| All failed SSH auth | `rule.id:(5710 OR 5760 OR 5712 OR 5763)` |
| Invalid-user probing | `rule.id:5710` |
| Brute force confirmed | `rule.id:5712 OR rule.id:5763` |
| Successful SSH after failures | `rule.id:5715` |
| Root shell via sudo | `rule.id:5402` |
| Any FIM event | `rule.groups:syscheck` |
| Sensitive file touched | `rule.id:(550 OR 553 OR 554)` and `syscheck.path:*sudoers*` |
| This agent only | `agent.name:test-endpoint` |
| Critical only | `rule.level >= 12` |

Dashboards to open:

- **Modules → File Integrity Monitoring** — filter `agent.name:test-endpoint`; click an alert to
  see the **diff** (`report_changes`) and hashes.
- **Modules → MITRE ATT&CK** — T1110 (Brute Force) and T1548.003 (Sudo) light up.
- **Agents management → Security configuration assessment** — baseline posture of the endpoint.
- **Threat Hunting → Security events** — the main triage surface; add columns
  `rule.id`, `rule.level`, `agent.name`, `data.srcip`, `data.dstuser`, `full_log`.

### Build the charts required by the brief

1. **Threat Hunting → Visualize → Create visualization → Aggregation based.**
2. **Metric/area:** count of events, split by `rule.level`, time on X-axis.
3. **Bar chart:** top `data.srcip` values filtered to `rule.groups:authentication_failed`.
4. **Pie chart:** `rule.id` distribution on `agent.name:test-endpoint`.
5. **Save** each to a new dashboard called **SIEM Lab — Detection Overview**.
6. **Dashboard → Share → PDF/PNG** to export charts for the report.

### Reports

**Dashboard management → Reporting** can schedule a PDF of the whole dashboard.
For a one-off, use **Share → Generate PDF**.

Generate the evidence table straight from the manager:

```bash
chmod +x verify-alerts.sh
sudo ./verify-alerts.sh                                  # agent test-endpoint, all time
sudo ./verify-alerts.sh --agent test-endpoint --since 24 # last 24 hours
```

It parses `/var/ossec/logs/alerts/alerts.json` (one JSON document per line) and prints:

- per-rule counts with severity colouring,
- a **PASS/FAIL checklist** for every required detection,
- the top source IPs,
- the tail of the raw alert stream.

Useful options:

| Option | Purpose |
|---|---|
| `-a, --agent <name>` | report on a specific agent |
| `-s, --since <hours>` | restrict to a time window |
| `-j, --json <path>` | use a different alerts file |
| `--log <path>` | plain-text alerts file for the raw tail |
| `-h, --help` | usage |

```bash
# offline rehearsal / testing without a manager
./verify-alerts.sh --json /tmp/sample-alerts.json --agent test-endpoint
```

---

## 11. Verification checklist

Copy this into your report and tick it off with screenshots.

| # | Check | Command / location | Expected |
|---|---|---|---|
| 1 | Server components running | `systemctl status wazuh-{manager,indexer,dashboard}` | all **active** |
| 2 | Dashboard reachable | `https://192.168.56.10` | login page |
| 3 | Agent enrolled | `sudo /var/ossec/bin/agent_control -l` | `Active` |
| 4 | Agent sending events | Dashboard → Threat Hunting → Events | events for `agent.name:test-endpoint` |
| 5 | Failed logins detected | filter `rule.id:(5710 OR 5760)` | ≥ 10 alerts |
| 6 | Brute force detected | filter `rule.id:(5712 OR 5763)` | ≥ 1 alert, level 10 |
| 7 | SSH success after failures | filter `rule.id:5715` | 1 alert, correlated to 100101 |
| 8 | FIM modification | filter `rule.id:550` | 1 alert with diff |
| 9 | FIM creation / deletion | filters `rule.id:554` / `553` | ≥ 1 each |
| 10 | Privilege escalation | filter `rule.id:5402` + custom 100110 | ≥ 1 alert |
| 11 | Charts built | custom dashboard | 3+ visualisations |
| 12 | Report exported | PDF | contains the screenshots |

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| VM window freezes / black after boot | Graphics controller | `Settings → Display → VMSVGA` |
| `https://192.168.56.10` unreachable | Host-only adapter missing or wrong subnet | Re-check Adapter 2; `ip -br a` inside VM |
| Dashboard shows "Wazuh API not reachable" | `wazuh-manager` or API down | `systemctl restart wazuh-manager`; check port 55000 |
| Agent `Never connected` | Wrong manager IP, blocked 1514 | `grep 192.168.56.10 /var/ossec/etc/ossec.conf`; `sudo ufw allow 1514/tcp` |
| Agent `Disconnected`, no alerts | Agent service stopped | `systemctl enable --now wazuh-agent` |
| No FIM alerts for `/opt/lab-watch` | Directory missing at agent start, or first scan baseline | Create it, restart agent, make a change, wait ~20 s |
| FIM alerts very slow | No `realtime="yes"`, default 12 h scan | Add `realtime="yes"`, set `<frequency>300</frequency>` |
| Custom rule never fires | Bad XML or ID collision | `sudo /var/ossec/bin/wazuh-analysisd -t`; test with `wazuh-logtest` |
| `wazuh-logtest` doesn't match | Wrong decoder | Confirm the log line exists in `/var/log/auth.log` on the endpoint |
| Rule triggers but no alert in UI | Level below alert threshold | Raise `level` to 7+, or check `log_alert_level` in `ossec.conf` |
| Manager won't restart after edits | XML syntax error | `wazuh-analysisd -t` shows the exact line |
| Clock skew in dashboard | VM clock drift | `sudo timedatectl set-ntp true` |

Useful log locations:

| What | Where |
|---|---|
| Manager service log | `/var/ossec/logs/ossec.log` |
| Alerts (plain text) | `/var/ossec/logs/alerts/alerts.log` |
| Alerts (JSON, indexed) | `/var/ossec/logs/alerts/alerts.json` |
| Agent log | `/var/ossec/logs/ossec.log` (on the endpoint) |
| Dashboard log | `/var/log/wazuh-dashboard/opensearch_dashboards.log` |
| Indexer log | `/var/log/wazuh-indexer/wazuh-indexer.log` |

---

## 13. Hardening before you screenshot it

1. Change `wazuh-user`'s OS password **and** the `admin` dashboard password.
2. Keep adapters on `Host-only` + `NAT`; never bridge the lab to your real LAN.
3. Take a VirtualBox **snapshot** of both VMs now — cheap rollback after a bad rule edit.
4. Disable the Wazuh APT repo on the agent after install to prevent surprise upgrades:
   `sudo sed -i 's/^deb/#deb/' /etc/apt/sources.list.d/wazuh.list`
5. Note in your report that the OVA ships shared default credentials and is **not** a
   production deployment — it has no HA and no TLS hardening.

---

## 14. Teardown / rebuild

```bash
# Snapshot restore (fastest)
VBoxManage snapshot "wazuh-server" restore "clean-install"

# Full rebuild
VBoxManage unregistervm "wazuh-server" --delete
VBoxManage unregistervm "test-endpoint" --delete
```

---

## 15. Files in this kit

| File | Purpose |
|---|---|
| `README.md` | This guide |
| `rules/local_rules.xml` | Custom detection rules 100100–100131 (copy to `/var/ossec/etc/rules/`) |
| `config/syscheck-agent-block.xml` | FIM configuration for the agent |
| `config/active-response-manager-block.xml` | Optional auto-block of brute-force IPs |
| `scripts/simulate-detections.sh` | Generates every required security event on the endpoint |
| `scripts/verify-alerts.sh` | Parses alerts.json; per-rule counts, PASS/FAIL checklist, top IPs |
| `scripts/install-agent.sh` | One-shot agent install/enroll helper |
| `docs/access-dashboard.md` | How to reach the dashboard: URL, IP discovery, NAT port forwarding, troubleshooting |
| `docs/dashboard-filters.md` | Copy-paste dashboard queries |
| `docs/lab-report-template.md` | Report skeleton matching the assessment criteria |

---

## 16. Relationship to the AEGIS dashboard in this repo

`siem-dashboard/` is a **simulated** SIEM console (synthetic telemetry, no real host telemetry).
It demonstrates what a SOC analyst sees. This `wazuh-lab/` kit is the **real** deployment: it
collects genuine events from a genuine endpoint using Wazuh's agent, manager, and ruleset.

If you want the two connected later: ship `alerts.json` from the Wazuh manager into the AEGIS
API, or read directly from the Wazuh Indexer / Wazuh API (`:55000`).
