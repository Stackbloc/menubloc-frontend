# i18n blank homepage — rollback / isolation report

**Date:** 2026-05-27  
**Symptom:** Entire homepage blank (white screen), no UI.  
**First fatal runtime error (reproduced locally):**

```
useLanguage must be used within LanguageProvider
  at useLanguage (LanguageContext.jsx)
  at OrderCartToast (OrderCartToast.jsx)
```

## Root cause

`scripts/wire-i18n-hook.mjs` injected `useLanguage()` into `OrderCartToast.jsx`, but that component is **not** rendered under `LanguageProvider`.

`OrderCartProvider` mounts global UI as **siblings** of `{children}`:

```jsx
<OrderCartContext.Provider>{children}</OrderCartContext.Provider>
<OrderCartToast ... />
<ReplaceCartModal ... />
```

Previously, `App.jsx` nested providers as:

`OrderCartProvider` → `LanguageProvider` → `BrowserRouter`

So `OrderCartToast` and `ReplaceCartModal` sat **above** `LanguageProvider` while calling `useLanguage()` — React threw on first paint → blank `#root`.

`OrderCartToast` did not even use `t`; the hook was dead code from bulk injection.

## Fix (minimal)

1. **`App.jsx`** — wrap `OrderCartProvider` **inside** `LanguageProvider`:

   `CartProvider` → `LanguageProvider` → `OrderCartProvider` → `BrowserRouter`

2. **`OrderCartToast.jsx`** — remove unused `useLanguage` import/hook (defensive if provider order regresses).

## Why `npm run build` passed

- Vite/esbuild only validate syntax and static imports, not React context boundaries.
- No runtime smoke test ran before deploy.
- `useLanguage` fails only when the component **mounts** outside the provider; build does not execute the tree.

## Unsafe automated pattern

| Pattern | Risk |
|--------|------|
| Bulk `useLanguage()` injection without provider audit | Provider boundary violations |
| Injecting into components rendered from `*Provider` siblings | Same |
| Injecting when `t` already exists as a prop | Duplicate `t` (build failure in menu templates) |
| Wrong relative import for `src/*.jsx` root files | Module resolve failure at build |
| Auto-commit / auto-push after bulk edit | Production blank screen |

## Prevention (now enforced)

`scripts/wire-i18n-hook.mjs`:

1. Skips `context/` and `OrderCartToast.jsx`
2. Skips components that already destructure `t` from props
3. After changes: **lint → build → `scripts/smoke-homepage.mjs`**
4. Stops on first failure
5. Writes `docs/i18n-wire-audit.json`
6. **Does not** commit or push

## Verification checklist (before any i18n commit)

- [ ] `node scripts/smoke-homepage.mjs` (dev server on :5173 or pass URL)
- [ ] Homepage `/` shows discovery content (`ROOT_TEXT_LEN` > 0, no `pageerror`)
- [ ] `/search`, menu, checkout, operator login manually or scripted
- [ ] Language switch in footer/header
- [ ] `npm run build`

## Repo note

This workspace may contain both `menubloc-frontend/` (feature/i18n branch) and `menubloc-frontend-main/`. Apply the same `App.jsx` provider order fix in whichever tree you run or deploy.
