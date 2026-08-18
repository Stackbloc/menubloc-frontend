# LKG checkpoint — Pre My Menuply IA (2026-08-18)

Saved **before** My Menuply CPD. Live production was verified, then tagged. No My Menuply code was committed or deployed.

## Verified live

| Layer | Value |
|-------|--------|
| FE tip | `menubloc-frontend-2fw9x27jj-menuply.vercel.app` / `index-fjLns99U.js` |
| Tip-gate | **PASS** apex + www |
| FE feature commit in tip | `98687fd` |
| FE git tag SHA | `0450a53c42ae00c4e89d87a93b3094acb18bb71f` (`origin/main` docs lock) |
| BE health | `fb54f0b4656d77e4f94ba2ae8c28c880abb4c417` **MATCH** |
| Git tag | `menuply-last-known-good-2026-08-18` on FE + BE (pushed to origin) |

## Restore tip

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app venues.menuply.com
```

## Restore code

`git checkout menuply-last-known-good-2026-08-18` in `menubloc-frontend-main` and `menubloc-backend-main` (reset only with explicit Andre authorization).
