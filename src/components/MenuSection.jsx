// menubloc-frontend/src/components/MenuSection.jsx
import React from "react";

function fmtPrice(x) {
  if (x === null || x === undefined || x === "") return "";
  const num = Number(x);
  if (Number.isFinite(num)) return `$${num.toFixed(2)}`;
  return String(x);
}

export default function MenuSection({ section }) {
  const title = section?.name || section?.title || "Section";
  const items = section?.items || [];

  return (
    <div className="menu-section">
      <h2 className="menu-section-title">{title}</h2>

      <div className="menu-items">
        {items.map((it) => {
          const name = it?.name || it?.title || "Item";
          const desc = it?.description || it?.desc || "";
          const price = fmtPrice(it?.price);
          const tags = Array.isArray(it?.tags) ? it.tags : [];

          return (
            <div className="menu-item" key={it?.id || `${title}-${name}`}>
              <div className="menu-item-main">
                <div className="menu-item-name">{name}</div>
                {desc ? <div className="menu-item-desc">{desc}</div> : null}

                {tags.length ? (
                  <div className="menu-item-tags">
                    {tags.slice(0, 4).map((t) => (
                      <span className="tag" key={`${name}-${t}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {price ? <div className="menu-item-price">{price}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}