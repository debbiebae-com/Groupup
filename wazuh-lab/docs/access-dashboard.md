# How to open the Wazuh dashboard

You are here because you imported the Wazuh OVA and want to log in. This page covers every
network configuration, the exact URL, and what to do when the page will not load.

> **This is not the AEGIS dashboard.** The `siem-dashboard/` app in this repository is a
> simulation and has nothing to do with Wazuh. The Wazuh dashboard runs only on the VM you
> imported on your own computer.

---

## 1. The short version

```
URL:      https://<WAZUH_VM_IP>
username: admin
password: admin
```

Three things people get wrong:

1. **It is HTTPS, not HTTP.** `http://` will hang or return an error.
2. **The browser will warn about the certificate.** It is self-signed and expected.
   Click **Advanced → Proceed** (Chrome/Edge) or **Advanced → Accept the Risk** (Firefox).
3. **The IP is the VM's, not `localhost`** — unless you set up port forwarding (section 4).

---

## 2. Find the VM's IP address

Log in at the VirtualBox console window first (`wazuh-user` / `wazuh`), then run **one** of:

```bash
ip -br a
```

```bash
hostname -I
```

Example output:

```
eth0   UP   10.0.2.15/24          <- NAT adapter, not reachable from your host
eth1   UP   192.168.56.10/24      <- host-only adapter, THIS is the one you want
```

Use the **host-only** address: `https://192.168.56.10`.

> If `eth1` has no address, the static IP was not applied — re-run `sudo nmtui`
> (see README section 5.5), or fall back to port forwarding in section 4.

---

## 3. Reach it from your host

### 3a. Host-only adapter (recommended)

The VM has a second adapter attached to `Host-only Adapter → vboxnet0`.

| Check | Command on the host |
|---|---|
| Host-side interface has an address | `ip addr show vboxnet0` (Linux/macOS) or `ipconfig` (Windows) → look for `192.168.56.1` |
| VM answers | `ping 192.168.56.10` |
| Port 443 is open | `nc -vz 192.168.56.10 443` or `curl -kI https://192.168.56.10` |

Then open <https://192.168.56.10>.

### 3b. NAT only (no host-only adapter)

If you only gave the VM a NAT adapter, the VM sits behind VirtualBox's NAT and you cannot reach
it directly. Add a port-forward rule instead:

1. VM **powered off** is safest (though VirtualBox allows live edits).
2. **Settings → Network → Adapter 1 (NAT) → Advanced → Port Forwarding**.
3. Add a rule:

   | Field | Value |
   |---|---|
   | Name | `wazuh-web` |
   | Protocol | `TCP` |
   | Host IP | `127.0.0.1` |
   | Host Port | `8443` |
   | Guest IP | *(leave blank)* |
   | Guest Port | `443` |

4. Save, start the VM, then browse to:

   ```
   https://127.0.0.1:8443
   ```

Optional second rule if you want the API from your host (`55000 → 55000`) and agent enrollment
from other machines (`1514 → 1514`, `1515 → 1515`).

> Port forwarding only exposes what you explicitly map. That is what makes it safer than a
> bridged adapter: nothing else on your LAN can see the VM.

---

## 4. First login

1. Open the URL. Accept the certificate warning.
2. You land on the Wazuh login page (`/app/login`).
3. Sign in as `admin` / `admin`.
4. If the login is rejected, see section 6.

**The dashboard can take 2–5 minutes to become available after the first boot** while the
indexer initialises. A connection-refused error early on is usually just impatience.

---

## 5. What to look at first

| Goal | Navigate to |
|---|---|
| Confirm the agent is connected | **Agents management → Summary** (expect 1 active) |
| Raw security events | **Threat Hunting → Events** |
| File changes with diffs | **Modules → File Integrity Monitoring** |
| ATT&CK coverage | **Modules → MITRE ATT&CK** |
| Overview counts and charts | **Wazuh → Overview** (home) |
| Alert search by rule | Threat Hunting search bar: `rule.id:5710` |

Suggested first query after running the simulator:

```
agent.name:test-endpoint and rule.level >= 7
```

More queries: [dashboard-filters.md](dashboard-filters.md).

### Screenshots that make a good report

1. Agents management showing `test-endpoint` **Active**.
2. A `5710` alert expanded with `data.srcip` and `full_log` visible.
3. A `550` FIM alert showing the **diff** and before/after hashes.
4. A `5402` / `100110` privilege-escalation alert.
5. MITRE ATT&CK filtered to **T1110** (Brute Force).
6. Your custom **SIEM Lab — Detection Overview** dashboard.

---

## 6. Troubleshooting

Work down this list in order. Most failures are the first three rows.

| Symptom in the browser | Cause | Fix |
|---|---|---|
| `ERR_CONNECTION_REFUSED` | Services not up yet, or wrong IP | Wait 5 min; run the checks in section 6.1 |
| Page loads forever | Using `http://` | Switch to `https://` |
| `ERR_ADDRESS_UNREACHABLE` | Wrong adapter IP, or host-only adapter missing | Use the `192.168.56.x` address; check `vboxnet0` on the host |
| `ERR_CONNECTION_TIMED_OUT` | Host firewall blocking the host-only subnet | Allow `192.168.56.0/24`, or use port forwarding |
| Certificate warning | Self-signed cert — normal | Advanced → Proceed |
| Login page loads, credentials rejected | Password changed, or quickstart install | Section 6.2 |
| "Wazuh API not reachable" banner | `wazuh-manager` down | `sudo systemctl restart wazuh-manager` |
| Dashboard loads but shows no data | Indexer unhealthy | `curl -k -u admin:admin https://localhost:9200/_cluster/health?pretty` |
| Blank page after login | Browser cached a broken bundle | Hard reload (`Ctrl+Shift+R`) or private window |

### 6.1 Run these inside the VM

```bash
sudo systemctl status wazuh-manager wazuh-indexer wazuh-dashboard --no-pager
sudo ss -ltnp | grep -E ':(443|9200|55000)\b'
sudo tail -50 /var/log/wazuh-dashboard/opensearch_dashboards.log
```

Expected listeners:

| Port | Service |
|---|---|
| `443` | dashboard (the web UI) |
| `9200` | indexer |
| `55000` | manager API |

### 6.2 Recover a lost admin password

Default OVA credentials are `admin` / `admin`. If the password was changed and forgotten, set a
new one on the manager:

```bash
sudo bash /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh \
  -u admin -p 'NewStrongPassword123!'
```

If you built Wazuh with the **assistant** instead of the OVA, the generated password is in the
install bundle:

```bash
sudo tar -O -xvf wazuh-install-files.tar wazuh-install-files/wazuh-passwords.txt | grep -A1 "'admin'"
```

### 6.3 Confirm from the VM itself

If `curl` works locally but the browser cannot connect, the problem is networking, not Wazuh:

```bash
curl -kIs https://localhost | head -1      # expect: HTTP/1.1 302 Found
```

---

## 7. Hardening once you are in

1. Change the `admin` dashboard password (section 6.2).
2. Change the OS password for `wazuh-user`: `passwd`.
3. Keep the dashboard on host-only or forwarded-127.0.0.1 — never bridge it to a public network.
4. Snapshot both VMs so a bad rule edit costs you seconds, not a rebuild.

```bash
VBoxManage snapshot "wazuh-server" take "dashboard-working"
```

---

## 8. Quick reference

| Setup | URL | Notes |
|---|---|---|
| Host-only adapter | `https://192.168.56.10` | recommended |
| NAT + port forward | `https://127.0.0.1:8443` | forward host 8443 → guest 443 |
| From inside the VM | `https://localhost` | confirms the stack is healthy |
| Default login | `admin` / `admin` | change immediately |
| Console login | `wazuh-user` / `wazuh` | `sudo -i` for root |

---

## 9. If you cannot run VirtualBox at all

The dashboard needs a machine where the Wazuh stack can run. Alternatives, in order of fidelity
to "Option 2":

1. **Docker single-node** — `wazuh/wazuh-docker`, ~4 GB RAM, dashboard on
   `https://localhost:443` with generated credentials. Same rules and scripts apply.
2. **A cloud x86 VM** — install Wazuh with the assistant, expose 443 in the security group, and
   you get a public URL to screenshot.
3. **Wazuh Cloud trial** — no deployment, but you would be demonstrating configuration rather
   than installation.

The lab kit in this directory (rules, FIM config, scripts) works unchanged with all three.
