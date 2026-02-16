import { useEffect, useState } from "react";

export default function MenuDetail({ id, onBack }) {
  const [menu, setMenu] = useState(null);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setStatus("No menu selected");
        return;
      }

      setStatus("Loading...");
      try {
        const res = await fetch(`http://localhost:3001/menus/${id}`);
        const data = await res.json().catch(() => null);

        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        if (!data?.menu) throw new Error("Unexpected response: missing menu");

        if (!cancelled) {
          setMenu(data.menu);
          setStatus("");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setStatus(`Error loading menu: ${err.message}`);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} type="button">
        ← Back
      </button>

      {status ? <p>{status}</p> : null}

      {menu ? (
        <>
          <h2 style={{ marginBottom: 6 }}>{menu.name}</h2>
          <div style={{ opacity: 0.7, marginBottom: 10 }}>
            id: {menu.id} • created: {menu.created_at}
          </div>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {menu.menu_text || "(no menu_text)"}
          </pre>
        </>
      ) : null}
    </div>
  );
}
