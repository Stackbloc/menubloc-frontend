#!/usr/bin/env bash
# Atomically lock the tip-gate script to a just-aliased production tip,
# then sync CURRENT tip into the EXISTING LKG docs/rules/mirrors (no second state store).
# See: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md
set -euo pipefail

ROOT_WORKSPACE="/Users/andrebarber/Desktop/menubloc"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GATE="${SCRIPT_DIR}/assert-menuply-production-tip.sh"
SYNC_GATES=(
  "${ROOT_WORKSPACE}/scripts/assert-menuply-production-tip.sh"
  "${ROOT_WORKSPACE}/menubloc-frontend-main/scripts/assert-menuply-production-tip.sh"
)

usage() {
  cat <<'EOF'
Usage:
  bash scripts/lock-menuply-production-tip.sh <DEPLOY_HOST> <BUNDLE.js> [options]

Args:
  DEPLOY_HOST   e.g. menubloc-frontend-fa0lpz0yi-menuply.vercel.app  (no https://)
  BUNDLE        e.g. index-BKIe5jXc.js

Options:
  --fe-commit <sha>   short FE commit (optional, for comment + LKG)
  --be-commit <sha>   short BE health SHA (optional, for comment)
  --note <text>       short feature label (optional, for comment)
  --skip-lkg-sync     update tip-gate only (emergency; CPD still incomplete)
  --check             verify tip-gate LOCKED_* match live menuply.com (no write)
  -h, --help

After lock: tip-gate must PASS on apex+www. CPD is incomplete until then.
EOF
}

CHECK_ONLY=0
SKIP_LKG=0
FE_COMMIT=""
BE_COMMIT=""
NOTE=""
DEPLOY=""
BUNDLE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --check) CHECK_ONLY=1; shift ;;
    --skip-lkg-sync) SKIP_LKG=1; shift ;;
    --fe-commit) FE_COMMIT="${2:-}"; shift 2 ;;
    --be-commit) BE_COMMIT="${2:-}"; shift 2 ;;
    --note) NOTE="${2:-}"; shift 2 ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      if [[ -z "$DEPLOY" ]]; then
        DEPLOY="$1"
      elif [[ -z "$BUNDLE" ]]; then
        BUNDLE="$1"
      else
        echo "Unexpected arg: $1" >&2
        exit 2
      fi
      shift
      ;;
  esac
done

DEPLOY="${DEPLOY#https://}"
DEPLOY="${DEPLOY%/}"

if [[ "$CHECK_ONLY" -eq 1 ]]; then
  locked_bundle=$(grep -E '^LOCKED_BUNDLE=' "$GATE" | head -1 | cut -d= -f2- | tr -d '"')
  locked_deploy=$(grep -E '^LOCKED_DEPLOY=' "$GATE" | head -1 | cut -d= -f2- | tr -d '"')
  live=$(curl -sSL -m 25 -H 'Cache-Control: no-cache' "https://menuply.com/?lockcheck=$(date +%s)" \
    | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1 || true)
  echo "locked_deploy=${locked_deploy}"
  echo "locked_bundle=${locked_bundle}"
  echo "live_bundle=${live}"
  if [[ -n "$live" && "$live" == "$locked_bundle" ]]; then
    echo "RESULT=PASS — tip-gate lock matches live menuply.com"
    exit 0
  fi
  echo "RESULT=STALE_LOCK — tip-gate lock does not match live menuply.com"
  echo "NEXT: bash scripts/lock-menuply-production-tip.sh <live-deploy> ${live:-<bundle>}"
  echo "CONTRACT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
  exit 3
fi

if [[ -z "$DEPLOY" || -z "$BUNDLE" ]]; then
  usage >&2
  exit 2
fi

if [[ "$DEPLOY" != menubloc-frontend-*-menuply.vercel.app ]]; then
  echo "FAIL: DEPLOY must look like menubloc-frontend-<id>-menuply.vercel.app (got: $DEPLOY)" >&2
  exit 2
fi
if [[ "$BUNDLE" != index-*.js ]]; then
  echo "FAIL: BUNDLE must look like index-….js (got: $BUNDLE)" >&2
  exit 2
fi
if [[ ! -f "$GATE" ]]; then
  echo "FAIL: missing tip-gate script at $GATE" >&2
  exit 2
fi

PREV_BUNDLE=$(grep -E '^LOCKED_BUNDLE=' "$GATE" | head -1 | cut -d= -f2- | tr -d '"')
PREV_DEPLOY=$(grep -E '^LOCKED_DEPLOY=' "$GATE" | head -1 | cut -d= -f2- | tr -d '"')

DATE_UTC=$(date -u +%Y-%m-%d)
COMMENT="# Locked tip ${DATE_UTC}: ${DEPLOY} / ${BUNDLE}"
extras=()
[[ -n "$FE_COMMIT" ]] && extras+=("FE ${FE_COMMIT}")
[[ -n "$BE_COMMIT" ]] && extras+=("BE ${BE_COMMIT}")
[[ -n "$NOTE" ]] && extras+=("$NOTE")
if [[ ${#extras[@]} -gt 0 ]]; then
  joined=$(IFS='; '; echo "${extras[*]}")
  COMMENT+=" (${joined})"
fi

tmp=$(mktemp)
awk -v c="$COMMENT" -v b="$BUNDLE" -v d="$DEPLOY" '
  BEGIN { done_c=0; done_b=0; done_d=0 }
  /^# Locked tip / && !done_c { print c; done_c=1; next }
  /^LOCKED_BUNDLE=/ && !done_b { print "LOCKED_BUNDLE=\"" b "\""; done_b=1; next }
  /^LOCKED_DEPLOY=/ && !done_d { print "LOCKED_DEPLOY=\"" d "\""; done_d=1; next }
  { print }
  END {
    if (!done_b || !done_d) {
      print "FAIL: could not find LOCKED_BUNDLE/LOCKED_DEPLOY lines" > "/dev/stderr"
      exit 1
    }
  }
' "$GATE" > "$tmp"

updated=0
for g in "${SYNC_GATES[@]}"; do
  if [[ -f "$g" ]]; then
    cp "$tmp" "$g"
    chmod +x "$g"
    echo "updated=${g}"
    updated=1
  fi
done
if [[ ! " ${SYNC_GATES[*]} " =~ " ${GATE} " ]]; then
  cp "$tmp" "$GATE"
  chmod +x "$GATE"
  echo "updated=${GATE}"
  updated=1
fi
rm -f "$tmp"
[[ "$updated" -eq 1 ]] || { echo "FAIL: no tip-gate files updated" >&2; exit 1; }

echo "LOCKED tip-gate script(s):"
echo "  deploy=${DEPLOY}"
echo "  bundle=${BUNDLE}"
echo "  previous_deploy=${PREV_DEPLOY:-}"
echo "  previous_bundle=${PREV_BUNDLE:-}"

if [[ "$SKIP_LKG" -eq 0 ]]; then
  ROOT_WORKSPACE="$ROOT_WORKSPACE" DEPLOY="$DEPLOY" BUNDLE="$BUNDLE" \
  PREV_DEPLOY="${PREV_DEPLOY:-}" PREV_BUNDLE="${PREV_BUNDLE:-}" \
  FE_COMMIT="$FE_COMMIT" BE_COMMIT="$BE_COMMIT" NOTE="$NOTE" DATE_UTC="$DATE_UTC" \
  python3 <<'PY'
import os, re, shutil

root = os.environ["ROOT_WORKSPACE"]
deploy = os.environ["DEPLOY"]
bundle = os.environ["BUNDLE"]
prev_d = os.environ.get("PREV_DEPLOY") or ""
prev_b = os.environ.get("PREV_BUNDLE") or ""
fe = os.environ.get("FE_COMMIT") or ""
be = os.environ.get("BE_COMMIT") or ""
note = os.environ.get("NOTE") or ""
date = os.environ.get("DATE_UTC") or ""

lkg = os.path.join(root, "docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md")
fe_path = os.path.join(root, "docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md")
rule_lkg = os.path.join(root, ".cursor/rules/production-deploy-and-lkg-contract.mdc")
mirrors = [
    os.path.join(root, "menubloc-frontend-main/docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md"),
    os.path.join(root, "menubloc-backend-main/docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md"),
]

def sub_first(text, pattern, repl, flags=0):
    return re.sub(pattern, repl, text, count=1, flags=flags)

def sync_lkg_body(text):
    # CURRENT FE tip fields (first occurrences = CURRENT section)
    text = sub_first(text, r"(\| Vercel deployment \| `)[^`]+(`)", rf"\1{deploy}\2")
    text = sub_first(text, r"(\| Live bundle \| `)[^`]+(`)", rf"\1{bundle}\2")
    if fe:
        text = sub_first(
            text,
            r"(\| Git commit \| `)[^`]+(`)",
            rf"\1{fe}\2 — {note}" if note else rf"\1{fe}\2",
        )
    # Restore-current-tip alias block: first four menubloc-frontend-* hosts
    def alias_repl(m):
        return m.group(1) + deploy + m.group(2)
    text = re.sub(
        r"(npx vercel alias set )menubloc-frontend-[a-z0-9]+-menuply\.vercel\.app( menuply\.com)",
        alias_repl,
        text,
        count=1,
    )
    text = re.sub(
        r"(npx vercel alias set )menubloc-frontend-[a-z0-9]+-menuply\.vercel\.app( www\.menuply\.com)",
        alias_repl,
        text,
        count=1,
    )
    text = re.sub(
        r"(npx vercel alias set )menubloc-frontend-[a-z0-9]+-menuply\.vercel\.app( crm\.menuply\.com)",
        alias_repl,
        text,
        count=1,
    )
    text = re.sub(
        r"(npx vercel alias set )menubloc-frontend-[a-z0-9]+-menuply\.vercel\.app( venues\.menuply\.com)",
        alias_repl,
        text,
        count=1,
    )
    # First Prior tip table = previous locked tip when tip moved
    if prev_d and prev_b and (prev_d != deploy or prev_b != bundle):
        m = re.search(r"### Prior tip —[^\n]*\n\n\| Field \| Value \|\n\|[-| ]+\|\n(?:\|[^\n]+\n)+", text)
        if m:
            block = m.group(0)
            block2 = re.sub(
                r"(\| Deployment \| `)[^`]+(`)",
                rf"\1{prev_d}\2",
                block,
                count=1,
            )
            block2 = re.sub(
                r"(\| Live bundle \| `)[^`]+(`)",
                rf"\1{prev_b}\2",
                block2,
                count=1,
            )
            text = text[: m.start()] + block2 + text[m.end() :]
    # Heading date
    text = sub_first(
        text,
        r"(## CURRENT LAST KNOWN GOOD \(live production — )[^)]+(\))",
        rf"\g<1>{date}\2",
    )
    return text

def sync_fe_path_contract(text):
    text = sub_first(text, r"(\| Deployment \| `)[^`]+(`)", rf"\1{deploy}\2")
    text = sub_first(text, r"(\| Live bundle \| `)[^`]+(`)", rf"\1{bundle}\2")
    for host_suf in ("menuply.com", "www.menuply.com", "crm.menuply.com", "venues.menuply.com"):
        text = re.sub(
            rf"(npx vercel alias set )menubloc-frontend-[a-z0-9]+-menuply\.vercel\.app( {re.escape(host_suf)})",
            rf"\g<1>{deploy}\2",
            text,
            count=1,
        )
    return text

def sync_rule_lkg(text):
    text = sub_first(
        text,
        r"(\| FE tip \| `)[^`]+(/ `)[^`]+(`)",
        rf"\1{deploy}\2{bundle}\3",
    )
    if fe:
        text = sub_first(
            text,
            r"(\| FE commit \| `)[^`]+(`[^\n]*)",
            rf"\1{fe}\2",
        )
    if be:
        text = sub_first(
            text,
            r"(\| BE commit / health \| `)[^`]+(`)",
            rf"\1{be}\2",
        )
    text = sub_first(
        text,
        r"(## CURRENT LKG \()[^)]+(\))",
        rf"\g<1>{date}" + (f" — {note}" if note else "") + r"\2",
    )
    return text

changed = []
if os.path.isfile(lkg):
    body = open(lkg, encoding="utf-8").read()
    new = sync_lkg_body(body)
    if new != body:
        open(lkg, "w", encoding="utf-8").write(new)
        changed.append(lkg)
    for mpath in mirrors:
        os.makedirs(os.path.dirname(mpath), exist_ok=True)
        shutil.copy2(lkg, mpath)
        changed.append(mpath)

if os.path.isfile(fe_path):
    body = open(fe_path, encoding="utf-8").read()
    new = sync_fe_path_contract(body)
    if new != body:
        open(fe_path, "w", encoding="utf-8").write(new)
        changed.append(fe_path)

if os.path.isfile(rule_lkg):
    body = open(rule_lkg, encoding="utf-8").read()
    new = sync_rule_lkg(body)
    if new != body:
        open(rule_lkg, "w", encoding="utf-8").write(new)
        changed.append(rule_lkg)

for p in changed:
    print(f"lkg_synced={p}")
print("lkg_sync=done")
PY
else
  echo "lkg_sync=skipped"
fi

echo
echo "NEXT:"
echo "  1) bash ${ROOT_WORKSPACE}/scripts/assert-menuply-production-tip.sh https://menuply.com"
echo "  2) bash ${ROOT_WORKSPACE}/scripts/assert-menuply-production-tip.sh https://www.menuply.com"
echo "  3) Both must print RESULT=PASS — otherwise CPD=INCOMPLETE"
echo "  4) Commit tip-gate + LKG docs in menubloc-frontend-main (docs-only — do NOT vercel --prod)"
echo
echo "CONTRACT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
echo "RESULT=LOCKED"
