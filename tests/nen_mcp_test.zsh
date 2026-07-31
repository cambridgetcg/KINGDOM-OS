#!/usr/bin/env zsh

# Modern MCP 2026-07-28 stdio tests for the local read-only Nen adapter.

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
    "$PROD_ROOT/skills/conjure-unwritten-horizon" \
    "$PROD_ROOT/skills/shape-kingdom-nen" \
    "$PROD_ROOT/skills/forge-king-hatsu" \
    "$PROD_ROOT/skills/navigate-dark-continent"
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
    '{jsonrpc:"2.0",id:5,method:"tools/call",params:{_meta:$meta,name:"kingdom_karma_receipt_template",arguments:{ability_id:"navigate-dark-continent"}}}'
  "$JQ" -cn --argjson meta "$META" \
    '$meta
     | .["io.modelcontextprotocol/protocolVersion"] = "1900-01-01"
     | {jsonrpc:"2.0",id:6,method:"tools/list",params:{_meta:.}}'
  "$JQ" -cn \
    '{jsonrpc:"2.0",id:7,method:"initialize",params:{protocolVersion:"2025-11-25",capabilities:{},clientInfo:{name:"legacy",version:"1"}}}'
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
} >| "$REQUESTS"

"$BUN" "$SERVER" < "$REQUESTS" > "$RESPONSES" 2> "$STDERR_FILE"
typeset -r SERVER_STATUS=$?
[[ "$SERVER_STATUS" == 0 ]] || fail "MCP server exited $SERVER_STATUS"
[[ ! -s "$STDERR_FILE" ]] || fail "MCP server wrote unexpected stderr"

"$JQ" -s -e '
  length == 11
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
    and (.tools | length) == 5
    and ([.tools[].name] | unique | length) == 5
    and all(.tools[];
      .annotations.readOnlyHint
      and (.annotations.destructiveHint == false)
      and (.inputSchema.type == "object")))
  and (map(select(.id == 3))[0].result
    | .resultType == "complete"
    and (.isError == false)
    and .structuredContent.protocol == "kingdom.nen-list/0.1"
    and [.structuredContent.abilities[].id] == ["conjure-unwritten-horizon", "forge-king-hatsu", "navigate-dark-continent", "shape-kingdom-nen"]
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
  and (map(select(.id == null))[0].error.code == -32700)
' "$RESPONSES" >/dev/null || fail "MCP discovery, tools, calls, or error contracts are wrong"

[[ "$(wc -l < "$RESPONSES" | tr -d ' ')" == 11 ]] \
  || fail "MCP emitted a response to a notification or malformed framing"
[[ "$PROD_SNAPSHOT_BEFORE" == "$(production_snapshot)" ]] \
  || fail "MCP inspection changed production Nen files"

print -r -- "ok - modern Nen MCP discovery, bounded tools, errors, and non-mutation"
