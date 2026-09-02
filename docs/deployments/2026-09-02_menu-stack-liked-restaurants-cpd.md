# CPD — My Menu Stack liked-restaurant tier + diner instructions

**Date:** 2026-09-02  
**Agent:** Cursor  

## Shipped

### Frontend (`menubloc-frontend-main` @ `main`)

| Field | Value |
|-------|-------|
| Feature commits | `5d0251f6`, `981ea2dc` |
| Tip-lock docs | pending this commit |
| Deploy | `menubloc-frontend-mcb9r3ljm-menuply.vercel.app` |
| Bundle | `index-CtCjce13.js` |
| Tip-gate | PASS (apex + www) |

**Features:**
- My Menu Stack (`/feed/menus`) auto-includes menus for liked (followed) restaurants until unlike
- Saved pins and 48h recents unchanged — three tiers: saved → liked → recent
- Diner instruction on sample + personal stack explaining all three rules

### Backend

No BE changes — uses existing `GET /api/consumer/followed-restaurants`.

## Verification

- `node --test test/feedMenuLibraryContract.test.js` — 12 pass
- `bash scripts/cpd-fe.sh` → `RESULT=PASS`
- menuply.com bundle: `index-CtCjce13.js`
- Railway bundle refs: 62 · localhost: 10

## Human verify

1. Sign in → like a restaurant → open `/feed/menus` → menu appears with **Liked** badge
2. Unlike restaurant → menu leaves stack (unless saved or within 48h recent)
3. Instruction visible on empty stack and when stack has menus
4. Save (☆) and 48h recents still behave as before
