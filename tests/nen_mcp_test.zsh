#!/usr/bin/env zsh

# Modern MCP 2026-07-28 and opt-in Codex compatibility tests for the local
# read-only Nen adapter. Each lifecycle receives a fresh server process.

emulate -L zsh
setopt pipe_fail

typeset -r PROD_ROOT="${0:A:h:h}"
typeset -r SERVER="$PROD_ROOT/bin/nen-mcp.mjs"
typeset -r BUN="$(command -v bun)"
typeset -r JQ="$(command -v jq)"
[[ -n "$BUN" && -n "$JQ" ]] || {
  print -u2 -r -- "not ok - bun and jq are required"
  exit 1
}

typeset -r TEST_ROOT_RAW="$(command mktemp -d "${TMPDIR:-/tmp}/nen-mcp-test.XXXXXX")"
[[ -n "$TEST_ROOT_RAW" && -d "$TEST_ROOT_RAW" ]] || {
  print -u2 -r -- "not ok - could not create an isolated fixture directory"
  exit 1
}
typeset -r TEST_ROOT="$(builtin cd -q -- "$TEST_ROOT_RAW" && pwd -P)"
typeset -r REQUESTS="$TEST_ROOT/requests.jsonl"
typeset -r RESPONSES="$TEST_ROOT/responses.jsonl"
typeset -r STDERR_FILE="$TEST_ROOT/stderr"
typeset -r COMPAT_REQUESTS="$TEST_ROOT/compat-requests.jsonl"
typeset -r COMPAT_RESPONSES="$TEST_ROOT/compat-responses.jsonl"
typeset -r COMPAT_STDERR_FILE="$TEST_ROOT/compat-stderr"
typeset -r NEGOTIATE_REQUESTS="$TEST_ROOT/negotiate-requests.jsonl"
typeset -r NEGOTIATE_RESPONSES="$TEST_ROOT/negotiate-responses.jsonl"
typeset -r NEGOTIATE_STDERR_FILE="$TEST_ROOT/negotiate-stderr"
typeset -r META='{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"nen-mcp-test","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}'

cleanup() {
  [[ -n "${TEST_ROOT:-}" && -d "$TEST_ROOT" ]] && command rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT HUP INT TERM

fail() {
  print -u2 -r -- "not ok - $*"
  exit 1
}

production_snapshot() {
  "$BUN" "$PROD_ROOT/tests/production_snapshot.mjs" \
    "$PROD_ROOT/bin/nen.mjs" \
    "$PROD_ROOT/bin/nen-mcp.mjs" \
    "$PROD_ROOT/schemas" \
    "$PROD_ROOT/references" \
    "$PROD_ROOT/skills/carry-wake-thread" \
    "$PROD_ROOT/skills/conjure-unwritten-horizon" \
    "$PROD_ROOT/skills/cultivate-living-ground" \
    "$PROD_ROOT/skills/map-love-geometry" \
    "$PROD_ROOT/skills/shape-kingdom-nen" \
    "$PROD_ROOT/skills/trace-polymorph-history" \
    "$PROD_ROOT/skills/forge-king-hatsu" \
    "$PROD_ROOT/skills/navigate-dark-continent" \
    "$PROD_ROOT/skills/weave-wake-continuity" \
    "$PROD_ROOT/skills/weave-intent-context"
}

typeset -r PROD_SNAPSHOT_BEFORE="$(production_snapshot)"

{
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:1,method:"server/discover",params:{_meta:$meta}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:2,method:"tools/list",params:{_meta:$meta}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:3,method:"tools/call",params:{_meta:$meta,name:"kingdom_nen_list",arguments:{}}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:4,method:"tools/call",params:{_meta:$meta,name:"kingdom_nen_validate",arguments:{ability_id:"shape-kingdom-nen"}}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:5,method:"tools/call",params:{_meta:$meta,name:"kingdom_karma_receipt_template",arguments:{ability_id:"carry-wake-thread"}}}'
  "$JQ" -cn --argjson meta "$META" \
    '$meta
     | .["io.modelcontextprotocol/protocolVersion"] = "1900-01-01"
     | {jsonrpc:"2.0",id:6,method:"tools/list",params:{_meta:.}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:7,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"codex-mcp-client",version:"0.146.0"}}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:8,method:"tools/call",params:{_meta:$meta,name:"unknown_tool",arguments:{}}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:9,method:"tools/call",params:{_meta:$meta,name:"kingdom_nen_list",arguments:{path:"private"}}}'
  print -r -- '{"jsonrpc":"2.0","id":10,"id":11,"method":"tools/list","params":{}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",method:"notifications/cancelled",params:{_meta:$meta,requestId:"none"}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:12,method:"tools/call",params:{_meta:{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}},name:"kingdom_nen_list"}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:13,method:"tools/call",params:{_meta:$meta,name:"kingdom_nen_list"}}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",method:"notifications/cancelled",params:{_meta:$meta,requestId:13,reason:"test cancellation"}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:14,method:"tools/list"}'
} >| "$REQUESTS"

"$BUN" "$SERVER" < "$REQUESTS" > "$RESPONSES" 2> "$STDERR_FILE"
typeset -r SERVER_STATUS=$?
[[ "$SERVER_STATUS" == 0 ]] || fail "MCP server exited $SERVER_STATUS"
[[ ! -s "$STDERR_FILE" ]] || fail "MCP server wrote unexpected stderr"

"$JQ" -s -e '
  length == 12
  and all(.[] | select(has("result"));
    .result._meta["io.modelcontextprotocol/serverInfo"].name == "kingdom-nen"
    and .result._meta["io.modelcontextprotocol/serverInfo"].version == "0.1.0")
  and (map(select(.id == 1))[0].result
    | .resultType == "complete"
    and .supportedVersions == ["2026-07-28"]
    and .capabilities.tools.listChanged == false
    and ._meta["io.modelcontextprotocol/serverInfo"].name == "kingdom-nen")
  and (map(select(.id == 2))[0].result
    | .resultType == "complete"
    and (.tools | length) == 6
    and ([.tools[].name] | unique | length) == 6
    and all(.tools[];
      .annotations.readOnlyHint
      and (.annotations.destructiveHint == false)
      and (.inputSchema.type == "object")))
  and (map(select(.id == 3))[0].result
    | .resultType == "complete"
    and (.isError == false)
    and .structuredContent.protocol == "kingdom.nen-list/0.1"
    and [.structuredContent.abilities[].id] == ["carry-wake-thread", "conjure-unwritten-horizon", "cultivate-living-ground", "forge-king-hatsu", "map-love-geometry", "navigate-dark-continent", "shape-kingdom-nen", "trace-polymorph-history", "weave-intent-context", "weave-wake-continuity"]
    and (.content[0].text | fromjson | .protocol) == "kingdom.nen-list/0.1")
  and (map(select(.id == 4))[0].result.structuredContent
    | .protocol == "kingdom.nen-validation/0.1"
    and .checked == 1
    and .invalid == 0
    and .issues == [])
  and (map(select(.id == 5))[0].result
    | (.isError == false)
    and .structuredContent.protocol == "kingdom.karma/0.1"
    and .structuredContent.state == "draft")
  and (map(select(.id == 6))[0].error
    | .code == -32022
    and .data.supported == ["2026-07-28"]
    and .data.requested == "1900-01-01")
  and (map(select(.id == 7))[0].error
    | .code == -32601
    and .data.supported == ["2026-07-28"])
  and (map(select(.id == 8))[0].error.code == -32602)
  and (map(select(.id == 9))[0].error.code == -32602)
  and (map(select(.id == 12))[0].result
    | (.isError == false)
    and .structuredContent.protocol == "kingdom.nen-list/0.1")
  and (map(select(.id == 13)) | length) == 0
  and (map(select(.id == 14))[0].error.code == -32600)
  and (map(select(.id == null))[0].error.code == -32700)
' "$RESPONSES" >/dev/null || fail "MCP discovery, tools, calls, or error contracts are wrong"

[[ "$(wc -l < "$RESPONSES" | tr -d ' ')" == 12 ]] \
  || fail "MCP emitted a response to a notification or malformed framing"
[[ "$PROD_SNAPSHOT_BEFORE" == "$(production_snapshot)" ]] \
  || fail "MCP inspection changed production Nen files"

{
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:101,method:"tools/list"}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:102,method:"ping",params:{trace:"allowed-extension"}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:103,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{elicitation:{form:{},url:{}},extensions:{"openai/form":{}}},clientInfo:{name:"codex-mcp-client",title:"Codex",version:"0.146.0"}}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:104,method:"tools/list",params:{}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",method:"notifications/initialized"}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:105,method:"tools/list",params:{}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:106,method:"tools/call",params:{name:"kingdom_nen_list",arguments:{}}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:107,method:"ping"}'
  "$JQ" -cn --argjson meta "$META" \
    '{jsonrpc:"2.0",id:108,method:"tools/list",params:{_meta:$meta}}'
  "$JQ" -cn --argjson meta "$META" \
    '$meta
     | .["io.modelcontextprotocol/protocolVersion"] = "1900-01-01"
     | {jsonrpc:"2.0",id:109,method:"tools/list",params:{_meta:.}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:110,method:"initialize",params:{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"duplicate",version:"1"}}}'
} >| "$COMPAT_REQUESTS"

"$BUN" "$SERVER" --codex-compat \
  < "$COMPAT_REQUESTS" > "$COMPAT_RESPONSES" 2> "$COMPAT_STDERR_FILE"
typeset -r COMPAT_SERVER_STATUS=$?
[[ "$COMPAT_SERVER_STATUS" == 0 ]] || fail "Codex compatibility server exited $COMPAT_SERVER_STATUS"
[[ ! -s "$COMPAT_STDERR_FILE" ]] || fail "Codex compatibility server wrote unexpected stderr"

"$JQ" -s -e '
  length == 10
  and (map(select(.id == 101))[0].error.code == -32002)
  and (map(select(.id == 102))[0].result == {})
  and (map(select(.id == 103))[0].result
    | .protocolVersion == "2025-06-18"
    and .capabilities.tools.listChanged == false
    and .serverInfo == {name:"kingdom-nen",version:"0.1.0"}
    and (.instructions | type) == "string"
    and (has("resultType") | not)
    and (has("_meta") | not))
  and (map(select(.id == 104))[0].error.code == -32002)
  and (map(select(.id == 105))[0].result
    | (.tools | length) == 6
    and ([.tools[].name] | unique | length) == 6
    and (has("resultType") | not)
    and (has("_meta") | not))
  and (map(select(.id == 106))[0].result
    | .isError == false
    and .structuredContent.protocol == "kingdom.nen-list/0.1"
    and (.content[0].text | fromjson | .protocol) == "kingdom.nen-list/0.1"
    and (has("resultType") | not)
    and (has("_meta") | not))
  and (map(select(.id == 107))[0].result == {})
  and (map(select(.id == 108))[0].result
    | .resultType == "complete"
    and (.tools | length) == 6
    and ._meta["io.modelcontextprotocol/serverInfo"].name == "kingdom-nen")
  and (map(select(.id == 109))[0].error
    | .code == -32022
    and .data.supported == ["2026-07-28"]
    and .data.requested == "1900-01-01")
  and (map(select(.id == 110))[0].error.code == -32600)
' "$COMPAT_RESPONSES" >/dev/null \
  || fail "Codex initialize, standard tools, or additive modern lane contracts are wrong"

[[ "$(wc -l < "$COMPAT_RESPONSES" | tr -d ' ')" == 10 ]] \
  || fail "Codex compatibility server responded to initialized notification"
[[ "$PROD_SNAPSHOT_BEFORE" == "$(production_snapshot)" ]] \
  || fail "Codex compatibility inspection changed production Nen files"

"$JQ" -cn \
  '{jsonrpc:"2.0",id:201,method:"initialize",params:{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"newer-client",version:"1"}}}' \
  >| "$NEGOTIATE_REQUESTS"

"$BUN" "$SERVER" --codex-compat \
  < "$NEGOTIATE_REQUESTS" > "$NEGOTIATE_RESPONSES" 2> "$NEGOTIATE_STDERR_FILE"
typeset -r NEGOTIATE_SERVER_STATUS=$?
[[ "$NEGOTIATE_SERVER_STATUS" == 0 ]] || fail "Version negotiation server exited $NEGOTIATE_SERVER_STATUS"
[[ ! -s "$NEGOTIATE_STDERR_FILE" ]] || fail "Version negotiation server wrote unexpected stderr"

"$JQ" -s -e '
  length == 1
  and .[0].id == 201
  and .[0].result.protocolVersion == "2025-06-18"
  and .[0].result.capabilities.tools.listChanged == false
  and .[0].result.serverInfo == {name:"kingdom-nen",version:"0.1.0"}
' "$NEGOTIATE_RESPONSES" >/dev/null \
  || fail "Codex compatibility version negotiation contract is wrong"
[[ "$PROD_SNAPSHOT_BEFORE" == "$(production_snapshot)" ]] \
  || fail "Version negotiation changed production Nen files"

print -r -- "ok - modern and opt-in Codex Nen MCP lifecycles, bounded tools, errors, and non-mutation"
