# Waiter Malformed Label Root Cause Audit

Date: 2026-06-18
Scope: audit only; no UI, routing, backend, search, ordering, or database changes.

## SECTION 1 - Observed behavior

The reported search results screenshot showed the Waiter refinement prompt rendering as a visible underline followed by a question mark:

```text
________?
```

The prior UI fix removed the second, larger Waiter icon and added a guard so invalid refinement labels do not render. This audit traces where the prompt receives its refinement options and what current live-data-derived options are produced for the requested search.

## SECTION 2 - Exact malformed value

The exact malformed label value could not be recovered from the current local backend payload, saved screenshot baselines, or current source state.

Current reproducible payload checked:

```text
GET http://localhost:3001/search?q=burgers&city=Los+Angeles&state=CA
```

Current result:

```json
{
  "rowCount": 8,
  "selectedOption": {
    "id": "commerce:under 16",
    "label": "Under $16",
    "type": "commerce",
    "commerceType": "price",
    "count": 4
  },
  "suspiciousOptions": []
}
```

So, for the current local payload, the malformed value is not empty, null, whitespace, malformed menu data, restaurant data, or a fallback rule. It is not currently reproduced. The current option would render as:

```text
Under $16?
```

The visible underline in the screenshot is still explainable by the pre-fix prompt behavior: `WaiterRefinementPrompt` rendered `option.label` directly inside a styled inline span with a `borderBottom`. A bad or non-renderable label could present as an underline plus `?` even if the label text itself had no useful glyphs.

## SECTION 3 - Code path

Active search-results path:

1. `src/components/search/WaiterRefinementPrompt.jsx`
   - The prompt renders `refinementOptions`.
   - Current line 15 filters invalid labels.
   - Current line 69 renders `option.label`.
   - Current lines 79-106 append `?` around the option words.
   - Before the prior fix, this component used `refinementOptions.slice(0, 3)` directly, so malformed labels reached the visible prompt.

2. `src/pages/GrubbidSearchResults.jsx`
   - `buildWaiterOptions(rows, q, waiterIntentContext)` builds the options.
   - Current lines 618-668 build Waiter inventory rows.
   - Current lines 641-647 read `row.waiter_attributes` into `preparation`, `ingredient`, `modifier`, and `category` sets.
   - Current lines 675-696 convert candidates into rendered option objects.
   - Current lines 778-787 create a candidate with `key`, `label`, and `predicateDescription`.
   - Current lines 790-826 build attribute candidates from `waiter_attributes`.
   - Current lines 868-894 build price candidates.
   - Current lines 956-1063 select the final option group.

3. `src/utils/searchRefinementEngine.js`
   - This file contains another refinement engine, including `buildInventoryRefinementOptions`.
   - It is not imported by `GrubbidSearchResults.jsx` in current source.
   - It is not the active source of the malformed search-results prompt.

## SECTION 4 - Data path

Actual query audited:

```text
/search?q=burgers&city=Los+Angeles&state=CA
```

Current local backend response returned 8 item rows. The selected current option is generated from commerce/price data, not from menu attributes or restaurant attributes.

Records involved in the current selected option:

| Menu item id | Menu item | Restaurant id | Restaurant | Source field | Source value |
| --- | --- | --- | --- | --- | --- |
| 37060 | Steakhouse Burger | 696 | Korean Bbq House | `price_minor_units` / commerce price | 15 |
| 13202 | Le Big Matt Burger | 678 | Emmy Squared Pizza | `price` / commerce price | null in `waiter_attributes.commerce.price`; item price normalized as 0 by audit reproduction because the item has no direct price |
| 13850 | Truffle Cheese Burger | 609 | Yard House | `price` / commerce price | 19.49 |
| 37058 | Hamburger | 696 | Korean Bbq House | `price` / commerce price | 12 |
| 13206 | Bodega Burger | 678 | Emmy Squared Pizza | `price` / commerce price | 17 |
| 13852 | Mediterranean Veggie Burger | 609 | Yard House | `price` / commerce price | 17.99 |
| 37059 | Cheeseburger | 696 | Korean Bbq House | `price` / commerce price | 12.75 |
| 13848 | Classic Cheeseburger | 609 | Yard House | `price` / commerce price | 17.99 |

Current selected refinement option:

```json
{
  "id": "commerce:under 16",
  "type": "commerce",
  "key": "under 16",
  "label": "Under $16",
  "predicateDescription": "Items under $16",
  "commerceType": "price",
  "count": 4
}
```

The current local dataset did not contain any candidate option whose label lacked an alphanumeric character.

## SECTION 5 - Root cause

Confirmed root cause from code:

The prompt trusted `option.label` as render-safe text. Before the prior fix, `WaiterRefinementPrompt` did not validate labels before rendering. Because the clickable option word has a visible underline style, an invalid label could display as a bare underline followed by the prompt question mark.

What is not confirmed from current evidence:

- The exact historical malformed label value.
- The exact historical option id.
- The exact historical restaurant/menu item row that produced it.

Why not confirmed:

- The current exact local search response for `burgers` near Los Angeles produces only a valid `Under $16` option.
- The current payload has no suspicious selected option labels.
- Stored search visual baselines capture a loading state, not the final Waiter prompt.
- A read-only production API fetch was attempted but the execution environment killed the command before output, both inside and outside sandbox approval.

Classification answers:

| Question | Finding |
| --- | --- |
| A. Was the label empty? | Not in current reproducible data. Historical value not recoverable. |
| B. Was the label null? | Not in current reproducible data. Candidate creation would usually fall back when `label` is null. |
| C. Was the label whitespace? | Possible from the pre-fix render contract, but not proven from current data. |
| D. Was the label malformed data? | Possible, but not present in the current exact payload. |
| E. Was the label generated from a menu attribute? | Not for the current exact payload. Current selected option is commerce price. |
| F. Was the label generated from a restaurant attribute? | Not for the current exact payload. |
| G. Was the label generated from a fallback rule? | Not for the current exact payload. |
| H. Was the label generated by a bug in string construction? | The confirmed bug is missing validation at the prompt boundary and candidate boundary, not a reproduced current string-construction error. |

## SECTION 6 - Recommended fix

Permanent fix should be upstream of the prompt:

1. Add a shared `isRenderableWaiterLabel(label)` guard near candidate construction in `GrubbidSearchResults.jsx`.
2. Apply it in `buildWaiterOptionRows` before scoring/sorting, not only in `WaiterRefinementPrompt`.
3. Treat labels with no alphanumeric characters as invalid.
4. Preserve the prompt-level guard as a final defensive boundary.
5. Add an audit/test fixture that feeds malformed labels such as `""`, `" "`, `"________"`, `"---"`, and `null` into candidate creation and confirms no option reaches `WaiterRefinementPrompt`.
6. If production data can be queried, run the same candidate audit against production for the exact URL and record the raw offending row before deleting or normalizing the upstream data.

Do not replace this with canned questions. The prompt should continue to be built only from live-data-derived refinement options.

## SECTION 7 - Whether similar malformed labels could exist elsewhere

Yes, similar labels could exist anywhere a candidate label is constructed from data and only filtered at the final component boundary.

Higher-risk places:

- `buildAttributeCandidates(...)` in `GrubbidSearchResults.jsx`, because it turns `waiter_attributes.categories`, `waiter_attributes.ingredients`, and `waiter_attributes.preparations` into option labels.
- `addCandidate(...)` in `GrubbidSearchResults.jsx`, because it accepts a `label` and only falls back when the label is falsy, not when it is whitespace or punctuation-only.
- `buildInventoryRefinementOptions(...)` in `src/utils/searchRefinementEngine.js`, if that legacy/shared engine is reused later.

Lower-risk places:

- Commerce labels such as `Under $16`, `Deals`, and `Nearby` are programmatically constructed and currently safe.
- Nutrition labels such as `Higher Protein` are programmatically constructed and currently safe.

Current audit conclusion:

The symptom was caused by the prompt rendering an unvalidated option label. The exact historical bad label and source row are not present in the current reproducible `burgers` near Los Angeles payload, so they cannot be named honestly from available evidence. The permanent fix should validate labels at candidate construction and keep the prompt guard as a last-resort defense.
