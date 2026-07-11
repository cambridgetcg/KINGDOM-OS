# cproj — local repository discovery and navigation for interactive zsh.
#
# Does: discover local Git roots on demand, read kingdom.yaml metadata, exclude
# known dependency/cache locations, canonicalize compatibility symlinks, and
# change the current interactive shell directory after a clear selection, or
# emit a canonical path / structured local inventory for another command.
#
# Does not: move, rename, fetch, pull, commit, call the network, maintain a
# second catalog/cache, or decide which divergent worktree is canonical.

_kingdom_repo_markers() {
  emulate -L zsh
  setopt null_glob

  local candidate marker card repo line trimmed roster_path card_output
  local registry_root="$HOME/Desktop/KINGDOM-OS"
  local -a fields cards

  # Direct children of HOME catch canonical top-level worktrees without
  # descending into Library or live agent-state directories.
  for candidate in "$HOME"/*(N) "$HOME"/.*(N); do
    [[ -d "$candidate" ]] || continue
    if [[ -d "$candidate/.git" || -f "$candidate/.git" ]]; then
      print -r -- "$candidate/.git"
    fi
  done

  # Fast-path the ordinary physical layout: direct Desktop projects, the two
  # explicit collections, intentional worktrees, VM projects, and first-level
  # whitehack targets (but never their Foundry lib/ dependencies).
  for marker in \
    "$HOME"/Desktop/*/.git(N) \
    "$HOME"/Desktop/citizens/*/.git(N) \
    "$HOME"/Desktop/_archived/*/.git(N) \
    "$HOME"/Desktop/whitehack/targets/*/repo/.git(N) \
    "$HOME"/.worktrees/*/.git(N) \
    "$HOME"/VMs/*/.git(N) \
    "$HOME"/.hermes/hermes-agent/.git(N); do
    print -r -- "$marker"
  done

  # The roster supplies deliberately nested, uncarded roots without requiring
  # an expensive crawl of every project build tree.
  if [[ -r "$registry_root/roster.conf" ]]; then
    while IFS= read -r line; do
      trimmed="${line#"${line%%[![:space:]]*}"}"
      [[ -n "$trimmed" && "$trimmed" != \#* ]] || continue
      fields=("${(@s:|:)line}")
      (( ${#fields} >= 2 )) || continue
      roster_path="$fields[2]"
      roster_path="${roster_path#"${roster_path%%[![:space:]]*}"}"
      roster_path="${roster_path%"${roster_path##*[![:space:]]}"}"
      [[ "$roster_path" == \~/* ]] && roster_path="$HOME/${roster_path#\~/}"
      if [[ -d "$roster_path/.git" || -f "$roster_path/.git" ]]; then
        print -r -- "$roster_path/.git"
      fi
    done < "$registry_root/roster.conf"
  fi

  # A card is the existing source of truth for a nested Kingdom project. This
  # catches new registered roots immediately and still avoids a static cache.
  if (( $+commands[rg] )); then
    card_output="$(command rg --files --hidden \
      "$HOME/Desktop" "$HOME/love-unlimited" "$HOME/Claude-unlimited" "$HOME/true-love" \
      -g kingdom.yaml \
      -g '!**/.git/**' \
      -g '!**/node_modules/**' \
      -g '!**/.next/**' \
      -g '!**/.cache/**' \
      -g '!**/.venv/**' \
      -g '!**/lib/**' 2>/dev/null)"
    [[ -n "$card_output" ]] && cards=("${(@f)card_output}")
    for card in $cards; do
      repo="${card:h}"
      if [[ -d "$repo/.git" || -f "$repo/.git" ]]; then
        print -r -- "$repo/.git"
      fi
    done
  fi

}

_kingdom_repo_paths() {
  emulate -L zsh

  local marker repo physical marker_output
  local -a markers paths
  typeset -A seen

  # Materialize each discovery stage before processing it. This avoids nested
  # process-substitution pipes being closed early when cproj itself is run as
  # a short-lived script by `kingdom repos`.
  marker_output="$(_kingdom_repo_markers)"
  [[ -n "$marker_output" ]] && markers=("${(@f)marker_output}")
  for marker in $markers; do
    repo="${marker:h}"
    physical="$(builtin cd -q -- "$repo" 2>/dev/null && pwd -P)" || continue
    [[ -n "$physical" ]] || continue
    (( ${+seen[$physical]} )) && continue
    seen[$physical]=1
    paths+=("$physical")
  done

  print -rl -- "${(on)paths[@]}"
}

_kingdom_repo_roster_rows() {
  emulate -L zsh

  local roster="$HOME/Desktop/KINGDOM-OS/roster.conf"
  local line trimmed roster_path name kind layer domain state purpose
  local -a fields
  [[ -r "$roster" ]] || return 1

  while IFS= read -r line; do
    trimmed="${line#"${line%%[![:space:]]*}"}"
    [[ -n "$trimmed" && "$trimmed" != \#* ]] || continue
    fields=("${(@s:|:)line}")
    (( ${#fields} >= 7 )) || continue

    roster_path="$fields[2]"
    roster_path="${roster_path#"${roster_path%%[![:space:]]*}"}"
    roster_path="${roster_path%"${roster_path##*[![:space:]]}"}"
    [[ "$roster_path" == \~/* ]] && roster_path="$HOME/${roster_path#\~/}"
    roster_path="${roster_path:A}"

    name="$fields[1]"
    name="${name#"${name%%[![:space:]]*}"}"
    name="${name%"${name##*[![:space:]]}"}"
    kind="$fields[3]"
    kind="${kind#"${kind%%[![:space:]]*}"}"
    kind="${kind%"${kind##*[![:space:]]}"}"
    layer="$fields[4]"
    layer="${layer#"${layer%%[![:space:]]*}"}"
    layer="${layer%"${layer##*[![:space:]]}"}"
    domain="$fields[5]"
    domain="${domain#"${domain%%[![:space:]]*}"}"
    domain="${domain%"${domain##*[![:space:]]}"}"
    state="$fields[6]"
    state="${state#"${state%%[![:space:]]*}"}"
    state="${state%"${state##*[![:space:]]}"}"
    purpose="$fields[7]"
    purpose="${purpose#"${purpose%%[![:space:]]*}"}"
    purpose="${purpose%"${purpose##*[![:space:]]}"}"
    print -r -- "$roster_path"$'\t'"$name"$'\t'"$kind"$'\t'"$layer"$'\t'"$domain"$'\t'"$state"$'\t'"$purpose"
  done < "$roster"
}

_kingdom_repo_roster_row() {
  emulate -L zsh

  local repo="$1"
  local output row roster_path name kind layer domain state purpose
  local -a rows
  output="$(_kingdom_repo_roster_rows)"
  [[ -n "$output" ]] && rows=("${(@f)output}")
  for row in $rows; do
    IFS=$'\t' read -r roster_path name kind layer domain state purpose <<< "$row"
    [[ "$roster_path" == "$repo" ]] || continue
    print -r -- "$name"$'\t'"$kind"$'\t'"$layer"$'\t'"$domain"$'\t'"$state"$'\t'"$purpose"
    return 0
  done
  return 1
}

_kingdom_repo_row() {
  emulate -L zsh

  local repo="$1"
  local card="$repo/kingdom.yaml"
  local name="${repo:t}"
  local kind="uncarded"
  local layer="none"
  local domain="none"
  local state="unregistered"
  local place source="none"
  local purpose=""
  local line key value roster_output
  local MATCH MBEGIN MEND
  local -a match mbegin mend

  if (( $# >= 2 )); then
    roster_output="$2"
  else
    roster_output="$(_kingdom_repo_roster_row "$repo" 2>/dev/null)"
  fi
  if [[ -n "$roster_output" ]]; then
    IFS=$'\t' read -r name kind layer domain state purpose <<< "$roster_output"
    source="roster"
  fi

  if [[ -r "$card" ]]; then
    source="card"
    while IFS= read -r line; do
      if [[ "$line" =~ '^([A-Za-z_]+):[[:space:]]*(.*)$' ]]; then
        key="$match[1]"
        value="$match[2]"
        value="${value%"${value##*[![:space:]]}"}"
        [[ -n "$value" ]] || continue
        if (( ${#value} >= 2 )) && {
          [[ "$value[1]" == '"' && "$value[-1]" == '"' ]] ||
          [[ "$value[1]" == "'" && "$value[-1]" == "'" ]]
        }; then
          value="$value[2,-2]"
        fi
        value="${value//$'\t'/ }"
        value="${value//$'\r'/ }"
        case "$key" in
          name) name="$value" ;;
          kind) kind="$value" ;;
          layer) layer="$value" ;;
          domain) domain="$value" ;;
          state) state="$value" ;;
          purpose) purpose="$value" ;;
        esac
      fi
    done < "$card"
  fi

  if [[ "$repo" == "$HOME/Desktop/_archived/"* || "$repo" == "$HOME/"*.archive-* ]]; then
    place="archive-path"
  elif [[ "$repo" == "$HOME/Desktop/whitehack/targets/"*/repo ]]; then
    place="target"
  elif [[ -f "$repo/.git" ]]; then
    place="gitfile"
  elif [[ "$repo" == "$HOME/Desktop/citizens/"* ]]; then
    place="citizen"
  elif [[ "$repo" == "$HOME/Desktop/"*/* ]]; then
    place="nested"
  elif [[ "$repo" == "$HOME/Desktop/"* ]]; then
    place="desktop"
  elif [[ "$repo" == "$HOME/"* ]]; then
    place="home"
  else
    place="other"
  fi
  if [[ "$source" == "none" ]]; then
    case "$place" in
      archive-path)
        kind="unknown"
        state="archived"
        source="path"
        purpose="Preserved under the local archive collection; no per-repo card."
        ;;
      target)
        name="${repo:h:t}"
        kind="reference"
        state="reference"
        source="path"
        purpose="Whitehack audit target checkout; lifecycle belongs to the parent workspace."
        ;;
    esac
  fi
  print -r -- "$repo"$'\t'"$name"$'\t'"$kind"$'\t'"$layer"$'\t'"$domain"$'\t'"$state"$'\t'"$place"$'\t'"$source"$'\t'"$purpose"
}

_kingdom_repo_rows() {
  emulate -L zsh

  local repo path_output roster_output roster_row roster_path name kind layer domain state purpose
  local -a repos roster_rows
  typeset -A roster_by_path
  path_output="$(_kingdom_repo_paths)"
  [[ -n "$path_output" ]] && repos=("${(@f)path_output}")
  roster_output="$(_kingdom_repo_roster_rows)"
  [[ -n "$roster_output" ]] && roster_rows=("${(@f)roster_output}")
  for roster_row in $roster_rows; do
    IFS=$'\t' read -r roster_path name kind layer domain state purpose <<< "$roster_row"
    roster_by_path[$roster_path]="$name"$'\t'"$kind"$'\t'"$layer"$'\t'"$domain"$'\t'"$state"$'\t'"$purpose"
  done
  for repo in $repos; do
    _kingdom_repo_row "$repo" "${roster_by_path[$repo]-}"
  done
}

_kingdom_repo_query_matches() {
  emulate -L zsh

  local hay="${(L)1}"
  local term
  shift
  for term in "$@"; do
    term="${(L)term}"
    [[ "$hay" == *"$term"* ]] || return 1
  done
  return 0
}

_kingdom_repo_list() {
  emulate -L zsh

  local original_query="${(j: :)@}"
  local row repo_path name kind layer domain state place source purpose display hay row_output
  local -a lines rows

  lines+=("STATE"$'\t'"PLACE"$'\t'"META"$'\t'"LAYER"$'\t'"KIND"$'\t'"NAME"$'\t'"PATH")
  row_output="$(_kingdom_repo_rows)"
  [[ -n "$row_output" ]] && rows=("${(@f)row_output}")
  for row in $rows; do
    IFS=$'\t' read -r repo_path name kind layer domain state place source purpose <<< "$row"
    hay="${(L)repo_path} ${(L)name} ${(L)kind} ${(L)layer} ${(L)domain} ${(L)state} ${(L)place} ${(L)source} ${(L)purpose}"
    _kingdom_repo_query_matches "$hay" "$@" || continue
    display="$repo_path"
    [[ "$display" == "$HOME"* ]] && display="~${display#$HOME}"
    lines+=("$state"$'\t'"$place"$'\t'"$source"$'\t'"$layer"$'\t'"$kind"$'\t'"$name"$'\t'"$display")
  done

  if (( ${#lines} == 1 )); then
    print -u2 -r -- "cproj: no local repository matches '$original_query'"
    return 1
  fi

  print -rl -- "${lines[@]}" | command column -t -s $'\t'
}

_kingdom_repo_json() {
  emulate -L zsh

  local row_output row repo_path name kind layer domain state place source purpose hay
  local -a rows selected

  if [[ ! -x /usr/bin/jq ]]; then
    print -u2 -r -- "cproj: --json requires /usr/bin/jq"
    return 127
  fi

  row_output="$(_kingdom_repo_rows)"
  [[ -n "$row_output" ]] && rows=("${(@f)row_output}")
  for row in $rows; do
    IFS=$'\t' read -r repo_path name kind layer domain state place source purpose <<< "$row"
    hay="${(L)repo_path} ${(L)name} ${(L)kind} ${(L)layer} ${(L)domain} ${(L)state} ${(L)place} ${(L)source} ${(L)purpose}"
    _kingdom_repo_query_matches "$hay" "$@" || continue
    selected+=("$row")
  done

  # Keep an empty query result valid and composable for automation.
  if (( ${#selected} == 0 )); then
    print -r -- '[]'
    return 0
  fi

  print -rl -- "${selected[@]}" | /usr/bin/jq -cRn '
    [
      inputs
      | split("\t") as $fields
      | if ($fields | length) == 9 then
          {
            path: $fields[0],
            name: $fields[1],
            kind: $fields[2],
            layer: $fields[3],
            domain: $fields[4],
            state: $fields[5],
            place: $fields[6],
            metadataSource: $fields[7],
            purpose: $fields[8]
          }
        else
          error("cproj: malformed internal repository row")
        end
    ]
    | sort_by(.path)
  '
}

_kingdom_repo_summary() {
  emulate -L zsh

  local row repo_path name kind layer domain state place source purpose state_name place_name row_output
  local -a rows
  integer total=0 carded=0 rostered=0 path_derived=0
  typeset -A states places

  row_output="$(_kingdom_repo_rows)"
  [[ -n "$row_output" ]] && rows=("${(@f)row_output}")
  for row in $rows; do
    IFS=$'\t' read -r repo_path name kind layer domain state place source purpose <<< "$row"
    (( total += 1 ))
    (( states[$state] += 1 ))
    (( places[$place] += 1 ))
    case "$source" in
      card) (( carded += 1 )) ;;
      roster) (( rostered += 1 )) ;;
      path) (( path_derived += 1 )) ;;
    esac
  done

  print -r -- "Local repository view: $total project roots"
  print -r -- "  metadata: $carded cards · $rostered roster fallbacks · $path_derived path-derived · $(( total - carded - rostered - path_derived )) unregistered"
  for state_name in ${(ok)states}; do
    printf '  %-14s %d\n' "$state_name" "$states[$state_name]"
  done
  print -r -- "  locations:"
  for place_name in ${(ok)places}; do
    printf '    %-12s %d\n' "$place_name" "$places[$place_name]"
  done
  print -r -- "  known dependency/cache locations are excluded; no network or Git state changes"
}

_kingdom_repo_matches() {
  emulate -L zsh

  local query="${(L)${1:-}}"
  local row repo_path name kind layer domain state place source purpose hay row_output
  local -a basename_exact card_exact fuzzy rows

  (( $# > 0 )) || return 1
  row_output="$(_kingdom_repo_rows)"
  [[ -n "$row_output" ]] && rows=("${(@f)row_output}")
  for row in $rows; do
    IFS=$'\t' read -r repo_path name kind layer domain state place source purpose <<< "$row"
    hay="${(L)repo_path} ${(L)name} ${(L)kind} ${(L)layer} ${(L)domain} ${(L)state} ${(L)place} ${(L)source} ${(L)purpose}"
    if (( $# == 1 )) && [[ "${(L)${repo_path:t}}" == "$query" ]]; then
      basename_exact+=("$repo_path")
    elif (( $# == 1 )) && [[ "${(L)name}" == "$query" ]]; then
      card_exact+=("$repo_path")
    elif _kingdom_repo_query_matches "$hay" "$@"; then
      fuzzy+=("$repo_path")
    fi
  done

  if (( ${#basename_exact} )); then
    print -rl -- "${basename_exact[@]}"
  elif (( ${#card_exact} )); then
    print -rl -- "${card_exact[@]}"
  else
    print -rl -- "${fuzzy[@]}"
  fi
}

_kingdom_repo_resolve_path() {
  emulate -L zsh

  local query="${(j: :)@}"
  local target match_output
  local -a hits

  (( $# > 0 )) || {
    print -u2 -r -- "cproj: --path requires a repository query"
    return 2
  }

  # An explicit Git-root path may deliberately target a location outside the
  # ordinary discovery topology. This matches interactive cproj navigation.
  if (( $# == 1 )) && [[ -d "$1" && ( -d "$1/.git" || -f "$1/.git" ) ]]; then
    target="$(builtin cd -q -- "$1" 2>/dev/null && pwd -P)" || return 1
    print -r -- "$target"
    return 0
  fi

  match_output="$(_kingdom_repo_matches "$@")"
  [[ -n "$match_output" ]] && hits=("${(@f)match_output}")
  if (( ${#hits} == 0 )); then
    print -u2 -r -- "cproj: no local repository matches '$query'"
    return 1
  fi
  if (( ${#hits} > 1 )); then
    print -u2 -r -- "cproj: ${#hits} repositories match '$query'; refine the query or use 'cproj --list $query'"
    return 2
  fi

  print -r -- "${hits[1]}"
}

_kingdom_repo_validate_search_terms() {
  emulate -L zsh

  local term
  for term in "$@"; do
    if [[ "$term" == -* ]]; then
      print -u2 -r -- "cproj: unexpected option '$term'; choose one mode, or put -- before a literal leading-dash term"
      return 2
    fi
  done
}

_kingdom_repo_choose() {
  emulate -L zsh

  local query="${(j: :)@}"
  local row repo_path name kind layer domain state place source purpose display choice target match_output
  local -a hits

  if (( $# == 1 )) && [[ -d "$1" && ( -d "$1/.git" || -f "$1/.git" ) ]]; then
    query="$1"
    target="$(builtin cd -q -- "$query" 2>/dev/null && pwd -P)" || return 1
    builtin cd -- "$target" || return
    display="$target"
    [[ "$display" == "$HOME"* ]] && display="~${display#$HOME}"
    print -r -- "→ $display"
    return 0
  fi

  match_output="$(_kingdom_repo_matches "$@")"
  [[ -n "$match_output" ]] && hits=("${(@f)match_output}")
  if (( ${#hits} == 0 )); then
    print -u2 -r -- "cproj: no local repository matches '$query'"
    return 1
  fi

  if (( ${#hits} == 1 )); then
    target="${hits[1]}"
  else
    print -r -- "${#hits} repositories match '$query':"
    integer i=1
    for repo_path in $hits; do
      row="$(_kingdom_repo_row "$repo_path")"
      IFS=$'\t' read -r repo_path name kind layer domain state place source purpose <<< "$row"
      display="$repo_path"
      [[ "$display" == "$HOME"* ]] && display="~${display#$HOME}"
      printf '  %2d  %-28s %-13s %-12s %s\n' "$i" "$name" "$state" "$place" "$display"
      (( i += 1 ))
    done

    if [[ ! -t 0 ]]; then
      print -u2 -r -- "cproj: interactive choice required; use 'cproj --list $query'"
      return 2
    fi
    read "choice?Choose 1-${#hits} (q cancels): "
    [[ "$choice" == <-> ]] || return 1
    (( choice >= 1 && choice <= ${#hits} )) || {
      print -u2 -r -- "cproj: choice out of range"
      return 2
    }
    target="${hits[$choice]}"
  fi

  builtin cd -- "$target" || return
  display="$target"
  [[ "$display" == "$HOME"* ]] && display="~${display#$HOME}"
  print -r -- "→ $display"
}

_kingdom_repo_origin_id() {
  emulate -L zsh

  local repo="$1"
  local raw rest host remote_path
  raw="$(command git -C "$repo" config --get remote.origin.url 2>/dev/null)" || raw=""
  [[ -n "$raw" ]] || { print -r -- "none"; return 0; }

  if [[ "$raw" == file://* || "$raw" == /* || "$raw" == ./* || "$raw" == ../* ]]; then
    print -r -- "local"
    return 0
  elif [[ "$raw" == *://* ]]; then
    rest="${raw#*://}"
    rest="${rest##*@}"
    rest="${rest%%\?*}"
    rest="${rest%%\#*}"
    host="${rest%%/*}"
    remote_path="${rest#*/}"
  elif [[ "$raw" == *@*:* ]]; then
    rest="${raw#*@}"
    host="${rest%%:*}"
    remote_path="${rest#*:}"
  elif [[ "$raw" == *:* ]]; then
    host="${raw%%:*}"
    remote_path="${raw#*:}"
  else
    print -r -- "local"
    return 0
  fi

  remote_path="${remote_path#/}"
  remote_path="${remote_path%.git}"
  [[ -n "$host" && -n "$remote_path" ]] || { print -r -- "local"; return 0; }
  print -r -- "${(L)host}/${(L)remote_path}"
}

_kingdom_repo_branch() {
  emulate -L zsh

  local repo="$1" branch
  branch="$(command git -C "$repo" symbolic-ref --short -q HEAD 2>/dev/null)" || branch=""
  if [[ -z "$branch" ]]; then
    branch="$(command git -C "$repo" rev-parse --short HEAD 2>/dev/null)" || branch="unborn"
  fi
  print -r -- "$branch"
}

_kingdom_repo_change_count() {
  emulate -L zsh

  local repo="$1" count
  count="$(command git --no-optional-locks \
    -c core.fsmonitor=false \
    -c core.untrackedCache=false \
    -C "$repo" status --porcelain=v1 \
    --untracked-files=normal --ignore-submodules=all 2>/dev/null |
    command awk 'END { print NR + 0 }')"
  print -r -- "${count:-0}"
}

_kingdom_repo_dirty() {
  emulate -L zsh

  local row_output row repo_path name kind layer domain state place source purpose hay
  local display branch changes
  local -a rows lines
  integer considered=0 dirty=0

  row_output="$(_kingdom_repo_rows)"
  [[ -n "$row_output" ]] && rows=("${(@f)row_output}")
  lines+=("CHANGES"$'\t'"STATE"$'\t'"PLACE"$'\t'"BRANCH"$'\t'"NAME"$'\t'"PATH")
  for row in $rows; do
    IFS=$'\t' read -r repo_path name kind layer domain state place source purpose <<< "$row"
    hay="${(L)repo_path} ${(L)name} ${(L)kind} ${(L)layer} ${(L)domain} ${(L)state} ${(L)place} ${(L)source} ${(L)purpose}"
    _kingdom_repo_query_matches "$hay" "$@" || continue
    (( considered += 1 ))
    changes="$(_kingdom_repo_change_count "$repo_path")"
    (( changes > 0 )) || continue
    (( dirty += 1 ))
    branch="$(_kingdom_repo_branch "$repo_path")"
    display="$repo_path"
    [[ "$display" == "$HOME"* ]] && display="~${display#$HOME}"
    lines+=("$changes"$'\t'"$state"$'\t'"$place"$'\t'"$branch"$'\t'"$name"$'\t'"$display")
  done

  (( considered > 0 )) || {
    print -u2 -r -- "cproj: no local repository matches '${(j: :)@}'"
    return 1
  }
  if (( dirty == 0 )); then
    print -r -- "All $considered matching repositories are clean."
    return 0
  fi
  print -rl -- "${lines[@]}" | command column -t -s $'\t'
  print -r -- "$dirty of $considered matching repositories are dirty; filenames are intentionally omitted."
}

_kingdom_repo_doctor() {
  emulate -L zsh

  local row_output row repo_path name kind layer domain state place source purpose
  local display branch changes origin origin_name member members_output
  local roster_output roster_row roster_path roster_name_value roster_kind roster_layer roster_domain roster_state_value roster_purpose
  local source_name place_name
  local -a rows roster_rows dirty_archive unborn no_origin candidates archive_mismatch
  local -a duplicate_origin_lines duplicate_name_lines roster_missing roster_remote_present members
  typeset -A source_counts place_counts origin_counts origin_members name_counts name_members
  typeset -A roster_name roster_state roster_path_counts roster_path_members
  integer total=0 dirty_count=0 warning_count=0

  row_output="$(_kingdom_repo_rows)"
  [[ -n "$row_output" ]] && rows=("${(@f)row_output}")
  roster_output="$(_kingdom_repo_roster_rows)"
  [[ -n "$roster_output" ]] && roster_rows=("${(@f)roster_output}")

  for roster_row in $roster_rows; do
    IFS=$'\t' read -r roster_path roster_name_value roster_kind roster_layer roster_domain roster_state_value roster_purpose <<< "$roster_row"
    roster_name[$roster_path]="$roster_name_value"
    roster_state[$roster_path]="$roster_state_value"
    roster_path_counts[$roster_path]=$(( ${roster_path_counts[$roster_path]:-0} + 1 ))
    roster_path_members[$roster_path]="${roster_path_members[$roster_path]-}$roster_name_value"$'\n'
    display="$roster_path"
    [[ "$display" == "$HOME"* ]] && display="~${display#$HOME}"
    if [[ -e "$roster_path" ]]; then
      [[ "$roster_state_value" == "remote" ]] && roster_remote_present+=("$roster_name_value → $display")
    elif [[ "$roster_state_value" != "remote" ]]; then
      roster_missing+=("$roster_name_value → $display")
    fi
  done

  for row in $rows; do
    IFS=$'\t' read -r repo_path name kind layer domain state place source purpose <<< "$row"
    (( total += 1 ))
    source_counts[$source]=$(( ${source_counts[$source]:-0} + 1 ))
    place_counts[$place]=$(( ${place_counts[$place]:-0} + 1 ))
    display="$repo_path"
    [[ "$display" == "$HOME"* ]] && display="~${display#$HOME}"

    changes="$(_kingdom_repo_change_count "$repo_path")"
    if (( changes > 0 )); then
      (( dirty_count += 1 ))
      [[ "$place" == "archive-path" ]] && dirty_archive+=("$changes changes · $name → $display")
    fi

    if ! command git -C "$repo_path" rev-parse --verify HEAD >/dev/null 2>&1; then
      unborn+=("$name → $display")
    fi

    origin="$(_kingdom_repo_origin_id "$repo_path")"
    if [[ "$origin" == "none" ]]; then
      no_origin+=("$name → $display")
    elif [[ "$origin" != "local" ]]; then
      origin_counts[$origin]=$(( ${origin_counts[$origin]:-0} + 1 ))
      origin_members[$origin]="${origin_members[$origin]-}$display"$'\n'
    fi

    origin_name="${(L)name}"
    name_counts[$origin_name]=$(( ${name_counts[$origin_name]:-0} + 1 ))
    name_members[$origin_name]="${name_members[$origin_name]-}$display"$'\n'

    [[ "$source" == "none" ]] && candidates+=("$name · $place → $display")
    if [[ "$place" == "archive-path" && "$state" != "archived" ]]; then
      archive_mismatch+=("$name declares $state → $display")
    fi

    if [[ -n "${roster_name[$repo_path]-}" && "$source" == "card" ]]; then
      if [[ "$name" != "${roster_name[$repo_path]}" || "$state" != "${roster_state[$repo_path]}" ]]; then
        candidates+=("metadata drift: $name/$state vs roster ${roster_name[$repo_path]}/${roster_state[$repo_path]} → $display")
      fi
    fi
  done

  for origin in ${(ok)origin_counts}; do
    (( origin_counts[$origin] > 1 )) || continue
    duplicate_origin_lines+=("$origin (${origin_counts[$origin]})")
    members_output="${origin_members[$origin]}"
    members=("${(@f)members_output}")
    for member in $members; do
      duplicate_origin_lines+=("  $member")
    done
  done
  for origin_name in ${(ok)name_counts}; do
    (( name_counts[$origin_name] > 1 )) || continue
    duplicate_name_lines+=("$origin_name (${name_counts[$origin_name]})")
    members_output="${name_members[$origin_name]}"
    members=("${(@f)members_output}")
    for member in $members; do
      duplicate_name_lines+=("  $member")
    done
  done

  print -r -- "Repository doctor — local reads only; no fetch, checkout, or filenames from status"
  print -r -- "  roots: $total · dirty: $dirty_count · unborn: ${#unborn} · no origin: ${#no_origin}"
  print -r -- "  metadata:"
  for source_name in ${(ok)source_counts}; do
    printf '    %-8s %d\n' "$source_name" "$source_counts[$source_name]"
  done
  print -r -- "  places:"
  for place_name in ${(ok)place_counts}; do
    printf '    %-12s %d\n' "$place_name" "$place_counts[$place_name]"
  done

  if (( ${#candidates} )); then
    print -r -- "WARN  metadata/review candidates (${#candidates}):"
    print -rl -- "${candidates[@]/#/  }"
    (( warning_count += ${#candidates} ))
  fi
  if (( ${#archive_mismatch} )); then
    print -r -- "WARN  lifecycle metadata conflicts with archive placement (${#archive_mismatch}):"
    print -rl -- "${archive_mismatch[@]/#/  }"
    (( warning_count += ${#archive_mismatch} ))
  fi
  if (( ${#dirty_archive} )); then
    print -r -- "WARN  dirty archive paths (${#dirty_archive}; preserve before cleanup):"
    print -rl -- "${dirty_archive[@]/#/  }"
    (( warning_count += ${#dirty_archive} ))
  fi
  if (( ${#unborn} )); then
    print -r -- "WARN  unborn repositories (${#unborn}):"
    print -rl -- "${unborn[@]/#/  }"
    (( warning_count += ${#unborn} ))
  fi
  if (( ${#roster_missing} )); then
    print -r -- "WARN  non-remote roster paths missing (${#roster_missing}):"
    print -rl -- "${roster_missing[@]/#/  }"
    (( warning_count += ${#roster_missing} ))
  fi
  if (( ${#roster_remote_present} )); then
    print -r -- "WARN  roster says remote but path is present (${#roster_remote_present}):"
    print -rl -- "${roster_remote_present[@]/#/  }"
    (( warning_count += ${#roster_remote_present} ))
  fi
  if (( ${#duplicate_origin_lines} )); then
    print -r -- "INFO  shared origins (intentional worktrees and reconcile candidates):"
    print -rl -- "${duplicate_origin_lines[@]/#/  }"
  fi
  if (( ${#duplicate_name_lines} )); then
    print -r -- "INFO  duplicate declared names (physical basename wins direct navigation):"
    print -rl -- "${duplicate_name_lines[@]/#/  }"
  fi
  if (( ${#no_origin} )); then
    print -r -- "INFO  repositories without origin (${#no_origin}):"
    print -rl -- "${no_origin[@]/#/  }"
  fi
  print -r -- "INFO  use 'cproj --dirty [terms]' for the path-qualified dirty list."
  print -r -- "INFO  warnings: $warning_count"
  return $(( warning_count > 0 ? 1 : 0 ))
}

cproj() {
  emulate -L zsh

  local query
  local -a terms
  integer literal_terms=0
  case "${1:-}" in
    -h|--help)
      shift
      (( $# == 0 )) || {
        print -u2 -r -- "cproj: --help does not accept other arguments"
        return 2
      }
      print -r -- "usage: cproj [query]"
      print -r -- "       cproj --list [query]"
      print -r -- "       cproj --path query"
      print -r -- "       cproj --json [query]"
      print -r -- "       cproj --summary"
      print -r -- "       cproj --dirty [query]"
      print -r -- "       cproj --doctor"
      print -r -- ""
      print -r -- "Jump to a local Git project using its name, path, place, state, kind,"
      print -r -- "layer, domain, or registry/card purpose. Multiple matches get a numbered choice."
      print -r -- "--path prints one canonical absolute path without changing directory or prompting."
      print -r -- "--json prints matching local metadata as a compact JSON array."
      ;;
    -l|--list)
      shift
      if [[ "${1:-}" == "--" ]]; then
        shift
        literal_terms=1
      fi
      (( literal_terms )) || _kingdom_repo_validate_search_terms "$@" || return
      _kingdom_repo_list "$@"
      ;;
    -p|--path)
      shift
      if [[ "${1:-}" == "--" ]]; then
        shift
        literal_terms=1
      fi
      (( literal_terms )) || _kingdom_repo_validate_search_terms "$@" || return
      _kingdom_repo_resolve_path "$@"
      ;;
    -j|--json)
      shift
      if [[ "${1:-}" == "--" ]]; then
        shift
        literal_terms=1
      fi
      (( literal_terms )) || _kingdom_repo_validate_search_terms "$@" || return
      _kingdom_repo_json "$@"
      ;;
    -s|--summary)
      shift
      (( $# == 0 )) || {
        print -u2 -r -- "cproj: --summary does not accept search terms"
        return 2
      }
      _kingdom_repo_summary
      ;;
    --dirty)
      shift
      if [[ "${1:-}" == "--" ]]; then
        shift
        literal_terms=1
      fi
      (( literal_terms )) || _kingdom_repo_validate_search_terms "$@" || return
      _kingdom_repo_dirty "$@"
      ;;
    --doctor)
      shift
      (( $# == 0 )) || {
        print -u2 -r -- "cproj: --doctor does not accept search terms; use --dirty for a filtered Git view"
        return 2
      }
      _kingdom_repo_doctor
      ;;
    --)
      shift
      (( $# > 0 )) || {
        print -u2 -r -- "cproj: -- must be followed by a repository query"
        return 2
      }
      _kingdom_repo_choose "$@"
      ;;
    '')
      _kingdom_repo_summary
      [[ -t 0 ]] || return 0
      read "query?Find repo (blank cancels): "
      [[ -n "$query" ]] || return
      terms=("${(@Q)${(z)query}}")
      _kingdom_repo_choose "${terms[@]}"
      ;;
    -*)
      print -u2 -r -- "cproj: unknown option '$1'; use 'cproj --help'"
      return 2
      ;;
    *)
      _kingdom_repo_validate_search_terms "$@" || return
      _kingdom_repo_choose "$@"
      ;;
  esac
}

_cproj() {
  emulate -L zsh
  # Zsh's _arguments helper relies on EXTENDED_GLOB internally. `emulate`
  # resets it, so keep the option local but explicitly restore it here.
  setopt extended_glob
  local context state line
  local row repo_path name kind layer domain lifecycle place source purpose row_output basename display description
  local -a rows choices
  typeset -A seen

  _arguments -C \
    '(-h --help -l --list -p --path -j --json -s --summary --dirty --doctor)'{-h,--help}'[show help]' \
    '(-h --help -l --list -p --path -j --json -s --summary --dirty --doctor)'{-l,--list}'[list matching repositories]' \
    '(-h --help -l --list -p --path -j --json -s --summary --dirty --doctor)'{-p,--path}'[print one canonical repository path]' \
    '(-h --help -l --list -p --path -j --json -s --summary --dirty --doctor)'{-j,--json}'[print matching repository metadata as JSON]' \
    '(-h --help -l --list -p --path -j --json -s --summary --dirty --doctor)'{-s,--summary}'[summarize local repository metadata and placement]' \
    '(-h --help -l --list -p --path -j --json -s --summary --dirty --doctor)--dirty[show dirty repositories without filenames]' \
    '(-h --help -l --list -p --path -j --json -s --summary --dirty --doctor)--doctor[run local repository diagnostics]' \
    '*:repository search term:->repos' && return 0

  [[ "$state" == "repos" ]] || return 0
  row_output="$(_kingdom_repo_rows)"
  [[ -n "$row_output" ]] && rows=("${(@f)row_output}")
  for row in $rows; do
    IFS=$'\t' read -r repo_path name kind layer domain lifecycle place source purpose <<< "$row"
    basename="${repo_path:t}"
    display="$repo_path"
    [[ "$display" == "$HOME"* ]] && display="~${display#$HOME}"
    description="$name · $lifecycle/$place · $display"
    if [[ -z "${seen[$basename]-}" ]]; then
      choices+=("$basename:$description")
      seen[$basename]=1
    fi
    if [[ "$name" != "$basename" && -z "${seen[$name]-}" ]]; then
      choices+=("$name:$description")
      seen[$name]=1
    fi
  done
  _describe 'repository' choices
}

(( $+functions[compdef] )) && compdef _cproj cproj

# Executed by `kingdom repos`; sourcing from .zshrc only defines functions.
if [[ "${ZSH_EVAL_CONTEXT:-}" == "toplevel" ]]; then
  if (( $# == 0 )); then
    cproj --summary
  elif [[ "$1" == "--" ]]; then
    cproj --list "$@"
  elif [[ "$1" == -* ]]; then
    cproj "$@"
  else
    cproj --list "$@"
  fi
fi
