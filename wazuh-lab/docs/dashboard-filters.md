# Dashboard filters & queries — Wazuh SIEM Lab

Copy-paste reference for the Wazuh dashboard search bar (**Threat Hunting → Events**).
The default query language is **DQL** (the Wazuh fork of KQL). A Lucene/DSL toggle is also
available if you prefer raw queries.

---

## 1. Required detections

| What to prove | Query |
|---|---|
| All authentication failures | `rule.groups:authentication_failed` |
| Invalid-user SSH probes | `rule.id:5710` |
| Failed password (valid user) | `rule.id:(5711 OR 5760)` |
| Brute force confirmed | `rule.id:(5712 OR 5763 OR 100100)` |
| Success *after* brute force | `rule.id:(5715 OR 100101)` |
| Any FIM event | `rule.groups:syscheck` |
| File modified | `rule.id:550` |
| File deleted | `rule.id:553` |
| File added | `rule.id:554` |
| Sensitive file changed | `rule.id:(100120 OR 100121 OR 100122)` |
| Privilege escalation | `rule.id:(5402 OR 100110)` |
| Repeated failed sudo | `rule.id:100111` |
| Local account changed | `rule.id:100130` |
| SSH daemon config changed | `rule.id:100131` |

---

## 2. Scope to the lab endpoint

Prefix any query with the agent:

```
agent.name:test-endpoint and rule.level >= 7
```

Other useful scopes:

| Intent | Query |
|---|---|
| All agents | `rule.level >= 7` |
| Only the endpoint | `agent.name:test-endpoint` |
| Only the manager itself | `agent.id:000` |
| Exclude manager noise | `not agent.id:000` |

---

## 3. Severity bands

| Band | Query | Meaning |
|---|---|---|
| Elevated | `rule.level >= 7` | should be triaged |
| High | `rule.level >= 10` | likely real |
| Critical | `rule.level >= 12` | page someone |

---

## 4. Investigation pivots

After opening a single alert, pivot on its fields:

| Field | Query example | Use |
|---|---|---|
| `data.srcip` | `data.srcip:192.168.56.10` | everything from that attacker |
| `data.dstuser` | `data.dstuser:root` | accounts targeted |
| `syscheck.path` | `syscheck.path:*sudoers*` | changes to privileged config |
| `syscheck.path` | `syscheck.path:/opt/lab-watch/*` | lab directory activity |
| `data.command` | `data.command:*bash*` | sudo shell spawns |
| `full_log` | `full_log:*Failed password*` | raw text search |

**Pivot workflow:** alert → expand the document → click the value of `data.srcip` → *Filter for
value*. That's the equivalent of the AEGIS entity chips.

---

## 5. Timeline queries (whole attack chain)

Find the full brute-force-to-compromise story for one IP:

```
data.srcip:192.168.56.10 and rule.id:(5710 OR 5711 OR 5712 OR 5763 OR 5715 OR 100100 OR 100101)
```

Sort ascending on `timestamp` and the sequence reads left to right:

```
5710 ×12  →  5712  →  5715  →  100101  →  5402  →  100110
failures     brute    login     compromise   sudo     root shell
```

---

## 6. Charts to build

**Threat Hunting → Visualize → Create visualization → Aggregation based.**

| # | Chart | Metric | Bucket | Filter |
|---|---|---|---|---|
| 1 | Alert volume over time | Count | Date histogram on `timestamp`, 5 m | `rule.level >= 7` |
| 2 | Severity distribution | Count | Terms on `rule.level` | `agent.name:test-endpoint` |
| 3 | Top attacking IPs | Count | Terms on `data.srcip`, size 10 | `rule.groups:authentication_failed` |
| 4 | Rule hit table | Count | Terms on `rule.id` + `rule.description` | `agent.name:test-endpoint` |
| 5 | FIM activity | Count | Date histogram + split series on `syscheck.event` | `rule.groups:syscheck` |
| 6 | MITRE coverage | Count | Terms on `rule.mitre.id` | `rule.level >= 10` |

Save them into a dashboard named **SIEM Lab — Detection Overview**, then
**Share → Generate PDF** for the report.

---

## 7. Saved search shortcuts

Create these once via **Threat Hunting → Search → Save**:

| Name | Query |
|---|---|
| `LAB — Auth failures` | `agent.name:test-endpoint and rule.groups:authentication_failed` |
| `LAB — Brute force` | `rule.id:(5712 OR 5763 OR 100100)` |
| `LAB — Compromise indicators` | `rule.id:(100101 OR 100110 OR 100130)` |
| `LAB — FIM` | `rule.groups:syscheck` |
| `LAB — Critical only` | `rule.level >= 12` |

---

## 8. Raw DSL equivalents

If you switch the search bar to **DQL → DSL**, the body of an `POST /wazuh-alerts-*/_search`:

```json
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "agent.name": "test-endpoint" } },
        { "terms": { "rule.id": ["5710", "5711", "5712", "5763", "100100"] } },
        { "range": { "timestamp": { "gte": "now-24h" } } }
      ]
    }
  },
  "aggs": {
    "by_src_ip": {
      "terms": { "field": "data.srcip", "size": 15 }
    }
  },
  "size": 0
}
```

---

## 9. Wazuh API queries (optional)

The API on `:55000` is useful for scripting evidence collection.

```bash
# authenticate
TOKEN=$(curl -s -k -u wazuh:wazuh -X POST https://192.168.56.10:55000/security/user/authenticate \
        | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# list agents
curl -s -k -H "Authorization: Bearer $TOKEN" https://192.168.56.10:55000/agents | head

# alerts are indexed, not served by the manager API — query the indexer instead
curl -s -k -u admin:admin "https://192.168.56.10:9200/wazuh-alerts-*/_search?q=rule.level:>=10&size=5"
```

> Change the default `wazuh:wazuh` API password before exposing anything.
