import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:3001";

export default function MenuList({ onGoUpload, onOpenMenu }) {
  const [menus, setMenus] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [status, setStatus] = useState("Loading...");

  const cuisineOptions = useMemo(() => ["all", ...cuisines], [cuisines]);

  useEffect(() => {
    async function loadCuisines() {
      try {
        const res = await fetch(`${API_BASE}/cuisines`);
        const data = await res.json();
        setCuisines(data.cuisines || []);
      } catch {
        setCuisines([]);
      }
    }
    loadCuisines();
  }, []);

  useEffect(() => {
    async function loadMenus() {
      setStatus("Loading...");
      try {
        const url =
          selectedCuisine === "all"
            ? `${API_BASE}/menus`
            : `${API_BASE}/menus?cuisine=${encodeURIComponent(selectedCuisine)}`;

        const res = await fetch(url);
        const data = await res.json();

        setMenus(data.menus || []);
        setStatus(data.menus?.length ? "" : "No menus found.");
      } catch (err) {
        setStatus("Error loading menus");
      }
    }
    loadMenus();
  }, [selectedCuisine]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Menus</h2>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onGoUpload}>Back to Upload</button>

        <select
          value={selectedCuisine}
          onChange={(e) => setSelectedCuisine(e.target.value)}
        >
          {cuisineOptions.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All cuisines" : c}
            </option>
          ))}
        </select>
      </div>

      {status && <p style={{ marginTop: 10 }}>{status}</p>}

      <ul style={{ marginTop: 12 }}>
        {menus.map((m) => (
          <li key={m.id} style={{ marginBottom: 14 }}>
            <button
              onClick={() => onOpenMenu?.(m.id)}
              style={{ fontWeight: 600 }}
            >
              #{m.id} — {m.name}
            </button>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {m.cuisine}
            </div>

            {m.menu_text && (
              <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
                {m.menu_text}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
