# Translation is OFF (contract)

**Established:** 2026-11-01 (Andre) · **Status:** off in production · **Applies to:** backend, website, every agent

## The rule

Menuply shows English only. No language picker, no translated menus/restaurants/deals, no Language Bot.
Do **not** turn translation back on, re-add a language box, or wire a new translation provider unless Andre
asks for it in so many words. If a task seems to need translation, stop and ask.

## Why it was turned off

The Language Bot never had a working, paid-for translation service behind it, and nobody said so:

| Provider it used | What happened |
|---|---|
| Hugging Face Inference (`Helsinki-NLP/opus-mt-en-*`) | **Metered.** Ran on the account's small free monthly credit. Credit ran out → every call: "You have no remaining credits." |
| Hugging Face Inference (`facebook/nllb-200-distilled-600M`, "Meta/NLLB") | HF no longer serves it on `hf-inference` ("Model not supported by provider"). Also: **NLLB weights are CC-BY-NC — non-commercial**, so Menuply can't self-host it either. |
| MyMemory (fallback) | Free tier, small daily quota. Used up within minutes of each run (HTTP 429). |

Result: Oct 18 runs took prod down (provider env unset, 1.6M failed rows); Oct 25 / Oct 31 / Nov 1 runs aborted
after 10 straight failures. Andre believed "Meta's translation" was a free service — it is free *software*, but
someone has to pay to run it, and that was never set up or explained.

**Lesson for every agent:** when you wire any third-party service, say up front (1) whether it's metered and
who pays, (2) what the free limit is, (3) what the license allows for a commercial product. "It worked in a test"
is not the same as "it's set up."

## What "off" means in code

| Where | Switch |
|---|---|
| Backend `src/services/translation/translationLanguage.js` | `isTranslationEnabled()` reads `TRANSLATION_ENABLED` (unset = **off**). While off, `getRequestLanguage()` always returns `"en"` — `?lang=`, `X-Menuply-Language` and the browser's `Accept-Language` are ignored on every route (search, menus, menu items, deals, public menu, public restaurant). |
| Backend `src/services/ownerBots/botSchedule.js` | `BOT_KEYS` leaves out `language_bot` while off → no scheduled runs, no resumes, `/api/owner/bots/language_bot*` returns 404, Bots list has no Language Bot row. |
| Backend `src/routes/adminTranslations.js` | `POST /api/admin/translations/run-job` and `/refresh` return **410 `TRANSLATION_OFF`** while off. `GET /status` still works (history). |
| Website `src/context/LanguageContext.jsx` (+ `src/lib/analyticsClientHints.js`) | `SUPPORTED_LANGUAGES = ["en"]`. A visitor who had saved Spanish/Chinese is reset to English; no `lang` param or language header is sent. |
| Website footer (`SiteFooter.jsx`) and side menu (`grubbid/DiscoveryDrawer.jsx`) | Language boxes removed. |
| Website Owner → Bots | Language Bot card, nav link and page removed; `/owner/bots/language-bot` redirects to `/owner/bots`. |

**Kept on purpose (nothing deleted):** translation tables and rows already in the DB (`*_translations`,
`translation_job_runs`), the translation services/adapters, the UI-label i18n files, the multilingual OCR
ingestion code (reads non-English menus — unrelated to translating Menuply), and the Railway provider env vars.
Nothing reads them while the switch is off.

## If Andre asks to bring it back

1. Agree on a provider **and who pays** first. Options discussed 2026-11-01:
   - Self-host Helsinki-NLP Opus-MT (commercial-OK license, CPU, cost = the server) — quality a step below paid APIs.
   - Paid API (Google Cloud Translation, Claude Haiku) — better quality, per-character/token bill.
   - Either way, translate each distinct text once and reuse it across chain stores (same dish at dozens of stores).
2. Set `TRANSLATION_ENABLED=1` on Railway (staged edits need **Deploy**).
3. Website: restore `SUPPORTED_LANGUAGES = ["en", "es", "zh"]` in both files, put the two language boxes back
   (see git history of this change), and re-add Language Bot to `SCHEDULED_BOTS`, `OwnerLayout` nav and the `App.jsx` route.
4. Re-run `test/translationLanguage.test.js`, `test/adminTranslationsRoute.test.js`, and the owner-bots tests
   (they set `TRANSLATION_ENABLED=1` themselves).
