#!/usr/bin/env bash
# Atomically lock the tip-gate script to a just-aliased production tip.
# See: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md
set -euo pipefail

ROOT_WORKSPACE="/Users/andrebarber/Desktop/menubloc"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GATE="${SCRIPT_DIR}/assert-menuply-production-tip.sh"
# Keep workspace + FE versioned copies in sync whenever either is locked.
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
  --fe-commit <sha>   short FE commit (optional, for comment)
  --be-commit <sha>   short BE health SHA (optional, for comment)
  --note <text>       short feature label (optional, for comment)
  --check             verify tip-gate LOCKED_* match live menuply.com (no write)
  -h, --help

After this script updates the tip-gate locks, run tip-gate, then sync LKG docs/rules
to the SAME deploy + bundle (contract lists the seven files).
EOF
}

CHECK_ONLY=0
FE_COMMIT=""
BE_COMMIT=""
NOTE=""
DEPLOY=""
BUNDLE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --check) CHECK_ONLY=1; shift ;;
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
  # shellcheck disable=SC1090
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
  echo "RESULT=FAIL — tip-gate lock does not match live menuply.com"
  echo "NEXT: bash scripts/lock-menuply-production-tip.sh <live-deploy> ${live:-<bundle>}"
  echo "CONTRACT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
  exit 1
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
# Always write the invoked gate path even if outside SYNC_GATES
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
echo
echo "NEXT:"
echo "  1) bash ${ROOT_WORKSPACE}/scripts/assert-menuply-production-tip.sh https://menuply.com"
echo "  2) bash ${ROOT_WORKSPACE}/scripts/assert-menuply-production-tip.sh https://www.menuply.com"
echo "  3) Sync SAME deploy+bundle into:"
echo "     - .cursor/rules/production-deploy-and-lkg-contract.mdc"
echo "     - .cursor/rules/frontend-production-deploy-path-guardrail.mdc"
echo "     - docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md"
echo "     - docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md"
echo "     - menubloc-frontend-main/docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md"
echo "     - menubloc-backend-main/docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md"
echo "  4) Commit locks/docs in menubloc-frontend-main (scripts + docs) — do NOT vercel --prod for docs-only"
echo
echo "CONTRACT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
echo "RESULT=LOCKED"
