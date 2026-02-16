import { useEffect, useMemo, useState } from "react";

function titleFromSlug(slug) {
  if (!slug) return "Restaurant";
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function RestaurantPublicPage({ slug }) {
  const [status, setStatus] = useState("Loading...");
  const [restaurant, setRestaurant] = useState(null);
  const [menus, setMenus] = useState([]);

  const debugEnabled = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("debug") === "1";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!slug) {
      setStatus("Missing restaurant slug");
      setRestaurant(null);
      setMenus([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setStatus("Loading...");

        const res = await fetch(`http://localhost:3001/public/r/${slug}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.error || `Request failed (${res.status})`);
        }

        const r = data?.restaurant || null;

        let m = [];
        if (Array.isArray(data?.menus)) m = data.menus;
        else if (Array.isArray(data?.menu)) m = data.menu;
        else if (data?.menu && typeof data.menu === "object") m = [data.menu];

        // newest first (optional)
        m.sort((a, b) => {
          const da = new Date(a?.created_at || 0).getTime();
          const db = new Date(b?.created_at || 0).getTime();
          return db - da;
        });

        if (!cancelled) {
          setRestaurant(r);
          setMenus(m);
          setStatus("");
        }
      } catch (err) {
        console.error("PUBLIC PAGE ERROR:", err);
        if (!cancelled) {
          setStatus(err?.message || "Error loading public page");
          setRestaurant(null);
          setMenus([]);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const pageTitle = restaurant?.name || titleFromSlug(slug);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <button type="button" onClick={() => (window.location.href = "/")}>
        ← Back
      </button>

      <div style={{ marginTop: 10, opacity: 0.7 }}>
        Public page: <code>/r/{slug}</code>
      </div>

      {status ? (
        <p style={{ marginTop: 16 }}>{status}</p>
      ) : (
        <>
          <h1 style={{ marginTop: 16, marginBottom: 6 }}>{pageTitle}</h1>

          {restaurant?.slug ? (
            <div style={{ opacity: 0.7, marginBottom: 14 }}>
              slug: <code>{restaurant.slug}</code>
            </div>
          ) : null}

          <h2 style={{ marginTop: 18 }}>Menus</h2>

          {menus.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No menus found yet for this restaurant.</p>
          ) : (
            <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
              {menus.map((m) => {
                const key = m?.id ?? `${slug}-${m?.created_at ?? ""}-${m?.name ?? ""}`;
                const menuTitle = m?.name || (m?.id ? `Menu #${m.id}` : "Menu");

                return (
                  <div
                    key={key}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: 10,
                      padding: 14,
                      background: "white",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{menuTitle}</div>

                    {m?.created_at ? (
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        created: {formatDate(m.created_at)}
                      </div>
                    ) : null}

                    {m?.menu_text ? (
                      <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
                        {m.menu_text}
                      </pre>
                    ) : m?.menu_json ? (
                      <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
                        {JSON.stringify(m.menu_json, null, 2)}
                      </pre>
                    ) : (
                      <div style={{ marginTop: 10, opacity: 0.7 }}>
                        (no menu text)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {debugEnabled ? (
            <details style={{ marginTop: 18 }}>
              <summary>Debug</summary>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify({ slug, restaurant, menus }, null, 2)}
              </pre>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
