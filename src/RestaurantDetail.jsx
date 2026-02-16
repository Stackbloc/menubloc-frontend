import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3001";

export default function RestaurantDetail({ restaurant, onBack }) {
  const restaurantId = restaurant?.id;

  const [menus, setMenus] = useState([]);
  const [menuText, setMenuText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!restaurantId) return;

    let cancelled = false;

    async function loadMenus() {
      setStatus("Loading menus...");
      try {
        const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/menus`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        if (!cancelled) {
          setMenus(Array.isArray(data?.menus) ? data.menus : []);
          setStatus("");
        }
      } catch (err) {
        if (!cancelled) setStatus(`Error loading menus: ${err.message}`);
      }
    }

    loadMenus();

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  async function saveMenu() {
    const text = menuText.trim();

    if (!restaurantId) return setStatus("Missing restaurant id");
    if (!text) return setStatus("Paste menu text first");

    setStatus("Saving...");

    try {
      const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_text: text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setMenuText("");
      setStatus("Saved ✅");

      // refresh list
      const res2 = await fetch(`${API_BASE}/restaurants/${restaurantId}/menus`);
      const data2 = await res2.json().catch(() => ({}));
      setMenus(Array.isArray(data2?.menus) ? data2.menus : []);
    } catch (err) {
      setStatus(`Error saving: ${err.message}`);
    }
  }

  if (!restaurant) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={onBack}>← Back</button>
        <p style={{ marginTop: 10 }}>No restaurant selected.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <button onClick={onBack}>← Back</button>

      <h2 style={{ marginTop: 10, marginBottom: 6 }}>
        {restaurant.name}{" "}
        <span style={{ opacity: 0.7, fontSize: 16 }}>
          ({restaurant.cuisine})
        </span>
      </h2>

      <div style={{ opacity: 0.85, marginBottom: 18, lineHeight: 1.6 }}>
        {restaurant.address ? <div>📍 {restaurant.address}</div> : null}
        {restaurant.phone ? <div>📞 {restaurant.phone}</div> : null}
        {restaurant.website ? <div>🌐 {restaurant.website}</div> : null}
        {restaurant.manager_name ? (
          <div>👤 Manager: {restaurant.manager_name}</div>
        ) : null}
        <div style={{ opacity: 0.65 }}>Restaurant ID: {restaurantId}</div>
      </div>

      <h3>Add / Update Menu</h3>

      <textarea
        rows={8}
        value={menuText}
        onChange={(e) => setMenuText(e.target.value)}
        placeholder="Paste menu text here..."
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={saveMenu} type="button">
        Save Menu
      </button>

      {status ? <p style={{ marginTop: 10 }}>{status}</p> : null}

      <h3 style={{ marginTop: 26 }}>Menus</h3>

      {menus.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No menus yet for this restaurant.</p>
      ) : (
        menus.map((m) => (
          <div
            key={m.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
              whiteSpace: "pre-wrap",
            }}
          >
            <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 6 }}>
              Menu #{m.id}
            </div>
            {m.menu_text}
          </div>
        ))
      )}
    </div>
  );
}
