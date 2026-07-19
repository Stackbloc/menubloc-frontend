import React, { useMemo } from "react";

/**
 * Normalize menu rows for the Mode 2 live-menu rail.
 * Accepts either flat items or SharedMenuEditor-style sections.
 * Output: [{ section, name, price, description }] — menu text fields only.
 */
export function normalizeLiveMenuItems(input) {
  if (!input) return [];

  if (Array.isArray(input) && input.length && input[0]?.items) {
    const rows = [];
    for (const sec of input) {
      const sectionName = String(sec.name || sec.section || sec.title || "Menu").trim() || "Menu";
      for (const it of sec.items || []) {
        rows.push({
          section: sectionName,
          name: String(it.name || it.item_name || "").trim(),
          price: it.price != null && it.price !== "" ? it.price : null,
          description: String(it.description || "").trim(),
        });
      }
    }
    return rows.filter((r) => r.name);
  }

  if (!Array.isArray(input)) return [];

  return input
    .map((it) => ({
      section: String(it.section || it.section_name || "Menu").trim() || "Menu",
      name: String(it.name || it.item_name || "").trim(),
      price: it.price != null && it.price !== "" ? it.price : null,
      description: String(it.description || "").trim(),
    }))
    .filter((r) => r.name);
}

function formatPrice(price) {
  if (price == null || price === "") return "";
  const n = Number(price);
  if (!Number.isFinite(n)) return String(price);
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

/**
 * Plain live-menu reference for Mode 2 (post-publication editing).
 * Name / price / description only — no macros, coach UI, or chips.
 */
export default function LiveMenuReferencePanel({
  items = [],
  title = "Live menu",
  liveMenuHref = null,
  onClose = null,
  loading = false,
  error = "",
}) {
  const groups = useMemo(() => {
    const rows = normalizeLiveMenuItems(items);
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.section)) map.set(row.section, []);
      map.get(row.section).push(row);
    }
    return Array.from(map.entries());
  }, [items]);

  const total = groups.reduce((sum, [, rows]) => sum + rows.length, 0);

  return (
    <div className="ocr-source-evidence live-menu-reference">
      <div className="ocr-source-evidence__header">
        <span className="ocr-source-evidence__title">
          {title}
          {total > 0 ? ` (${total} item${total !== 1 ? "s" : ""})` : ""}
        </span>
        <div className="live-menu-reference__header-actions">
          {liveMenuHref ? (
            <a
              href={liveMenuHref}
              target="_blank"
              rel="noopener noreferrer"
              className="live-menu-reference__open-link"
            >
              Open full menu ↗
            </a>
          ) : null}
          {onClose ? (
            <button
              type="button"
              className="ocr-source-evidence__close"
              onClick={onClose}
              aria-label="Close live menu"
            >
              Close ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="live-menu-reference__body">
        {loading ? (
          <div className="live-menu-reference__empty">Loading live menu…</div>
        ) : error ? (
          <div className="live-menu-reference__empty live-menu-reference__empty--error">{error}</div>
        ) : groups.length === 0 ? (
          <div className="live-menu-reference__empty">
            No live dishes yet. Approve or add items, then switch back here.
          </div>
        ) : (
          groups.map(([section, rows]) => (
            <section key={section} className="live-menu-reference__section">
              <h3 className="live-menu-reference__section-title">{section}</h3>
              <ul className="live-menu-reference__list">
                {rows.map((row, idx) => (
                  <li key={`${section}-${row.name}-${idx}`} className="live-menu-reference__item">
                    <div className="live-menu-reference__item-row">
                      <span className="live-menu-reference__name">{row.name}</span>
                      {row.price != null && row.price !== "" ? (
                        <span className="live-menu-reference__price">{formatPrice(row.price)}</span>
                      ) : null}
                    </div>
                    {row.description ? (
                      <p className="live-menu-reference__desc">{row.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
