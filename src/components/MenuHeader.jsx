// menubloc-frontend/src/components/MenuHeader.jsx
import React from "react";
import { Link } from "react-router-dom";

function nameOf(r) {
  return String(r?.restaurant_name || r?.name || r?.title || r?.display_name || "Restaurant");
}

function subOf(r) {
  const cuisine = String(r?.cuisine || "").trim();
  const city = String(r?.city || "").trim();
  const state = String(r?.state || "").trim();
  const loc = [city, state].filter(Boolean).join(", ");
  return [cuisine, loc].filter(Boolean).join(" • ");
}

function heroOf(r) {
  return String(r?.hero_image_url || r?.heroImageUrl || "").trim();
}

function slugOf(r) {
  return String(r?.slug || r?.restaurant_slug || r?.public_slug || "").trim();
}

export default function MenuHeader({ restaurant }) {
  const r = restaurant || {};
  const slug = slugOf(r);

  const hero = heroOf(r);
  const title = nameOf(r);
  const sub = subOf(r);

  return (
    <div style={{ width: "100%", background: "transparent" }}>
      {hero ? (
        <div
          style={{
            height: 180,
            backgroundImage: `url(${hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.65)",
          }}
        />
      ) : null}

      <div style={{ padding: "16px 12px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: 28, fontWeight: 900 }}>
          {slug ? (
            <Link to={`/r/${slug}`} style={{ color: "inherit", textDecoration: "none" }} title="View public restaurant page">
              {title}
            </Link>
          ) : (
            title
          )}
        </div>

        {sub ? <div style={{ marginTop: 6, opacity: 0.75 }}>{sub}</div> : null}
      </div>
    </div>
  );
}