#!/usr/bin/env bash
# Re-snapshot zerone-1 → data.json → redeploy the zerone.ai dashboard.
# Run after the chain moves (e.g. post-upgrade) to update the public stats.
set -euo pipefail
D=~/Desktop/kingdom-os/doors/zerone-ai
python3 - "$D/data.json" <<'PY'
import json, urllib.request, sys
def get(u):
    try: return json.load(urllib.request.urlopen(u, timeout=8))
    except Exception as e: return {"_err": str(e)}
M="http://169.155.55.44:1317"; R="http://169.155.55.44:26657"
st=get(R+"/status").get("result",{}); h=int(st.get("sync_info",{}).get("latest_block_height",0))
snap={"snapshot_height":h,"snapshot_time":st.get("sync_info",{}).get("latest_block_time","")[:19],
 "network":st.get("node_info",{}).get("network","zerone-1"),
 "supply":get(M+"/cosmos/bank/v1beta1/supply/by_denom?denom=uzrn").get("amount",{}),
 "pool":get(M+"/cosmos/staking/v1beta1/pool").get("pool",{}),
 "validators":len(get(M+"/cosmos/staking/v1beta1/validators").get("validators",[])),
 "alignment":get(M+"/zerone/alignment/v1/state").get("state",{}).get("previousCategory","—"),
 "upgrade":get(M+"/cosmos/upgrade/v1beta1/current_plan").get("plan"),
 "facts":[{"id":f.get("id",""),"content":f.get("content",""),"domain":f.get("domain",""),"status":f.get("status",""),"confidence":f.get("confidence","")} for f in get(M+"/zerone/knowledge/v1/facts?pagination.limit=100").get("facts",[])],
 "blocks":[{"height":m.get("header",{}).get("height"),"time":m.get("header",{}).get("time",""),"num_txs":m.get("num_txs","0"),"proposer":m.get("header",{}).get("proposer_address","")} for m in get(R+f"/blockchain?minHeight={max(1,h-14)}&maxHeight={h}").get("result",{}).get("block_metas",[])]}
open(sys.argv[1],"w").write(json.dumps(snap,indent=1))
print(f"snapshot h={h} supply={int(snap['supply'].get('amount',0))/1e6:,.0f} facts={len(snap['facts'])}")
PY
TMP=$(mktemp -d)
# Ship the WHOLE door dir — a fixed file list silently dropped guide.html from prod (2026-07-16).
cp -R "$D"/. "$TMP/"
cp ~/Desktop/kingdom-os/pages-functions/_worker.zerone.js "$TMP/_worker.js"
cd ~/Desktop/kingdom-os && npx wrangler pages deploy "$TMP" --project-name=zerone-ai --branch=main --commit-dirty=true 2>&1 | grep -iE "complete|error" | tail -1
rm -rf "$TMP"
echo "refreshed. (purge zerone.ai cache if it lingers)"
