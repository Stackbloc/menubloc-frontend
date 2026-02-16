import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

const CATEGORY_OPTIONS = [
  { value: "qsr", label: "QSR" },
  { value: "fast_casual", label: "Fast Casual" },
  { value: "casual_dining", label: "Casual Dining" },
  { value: "fine_dining", label: "Fine Dining" },
  { value: "cafe", label: "Cafe" },
  { value: "bar", label: "Bar" },
  { value: "food_truck", label: "Food Truck" },
  { value: "bakery", label: "Bakery" },
  { value: "catering", label: "Catering" },
  { value: "other", label: "Other" },
];

export default function RestaurantList({ onSelectRestaurant }) {
  const [status, setStatus] = useState("Loading...");
  const [error, setError] = useState(null);
  const [restaurants, setRestaurants] = useState([]);

  // form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateVal] = useState("");
  const [zip, setZip] = useState("");

  const canCreate = useMemo(() => {
    return name.trim().length > 0 && category.trim().length > 0;
  }, [name, category]);

  async function loadRestaurants() {
    try {
      setError(null);
      setStatus("Loading restaurants...");

      const res = await fetch(`${API_BASE}/restaurants`);
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);

      setRestaurants(Array.isArray(data) ? data : []);
      setStatus("Ready");
    } catch (e) {
      setError(e.message || String(e));
      setStatus("Error loading restaurants");
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function createRestaurant(e) {
    e.preventDefault();
    if (!canCreate) return;

    try {
      setError(null);
      setStatus("Creating restaurant...");

      const payload = {
        name: name.trim(),
        category: category.trim(),
        cuisine: cuisine.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
      };

      const res = await fetch(`${API_BASE}/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || `Create failed (${res.status})`);

      // reset form
      setName("");
      setCategory("");
      setCuisine("");
      setCity("");
      setStateVal("");
      setZip("");

      // refresh list
      await loadRestaurants();
      setStatus("Created ✅");
    } catch (e) {
      setError(e.message || String(e));
      setStatus("Create failed");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Restaurants</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        Create a restaurant profile first. Menus attach to the restaurant.
      </p>

      <div style={{ marginTop: 12, marginBottom: 12, fontFamily: "monospace" }}>
        <div>Status: {status}</div>
        {error ? <div style={{ color: "crimson" }}>Error: {error}</div> : null}
      </div>

      <form
        onSubmit={createRestaurant}
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Add Restaurant</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Restaurant name *"
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Category *</option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <input
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="Cuisine (e.g., Mexican, Thai)"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            <input value={state} onChange={(e) => setStateVal(e.target.value)} placeholder="State" />
            <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" />
          </div>

          <button type="submit" disabled={!canCreate} style={{ padding: 10 }}>
            Create Restaurant
          </button>
        </div>
      </form>

      <h2 style={{ marginTop: 0 }}>Restaurant Directory</h2>

      {restaurants.length === 0 ? (
        <div style={{ opacity: 0.8 }}>No restaurants yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {restaurants.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div style={{ opacity: 0.8, fontSize: 14 }}>
                  {r.category || "—"} · {r.cuisine || "—"} ·{" "}
                  {[r.city, r.state, r.zip].filter(Boolean).join(", ") || "—"}
                </div>
              </div>

              {typeof onSelectRestaurant === "function" ? (
                <button onClick={() => onSelectRestaurant(r)} style={{ padding: "8px 10px" }}>
                  Select
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
