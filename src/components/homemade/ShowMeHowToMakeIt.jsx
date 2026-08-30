import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHomemadeByMenuItem } from "../../lib/homemadeDishApi.js";
import { captureEvent } from "../../services/posthog.js";

/**
 * Restaurant menu-item detail — discover homemade versions via canonical food.
 */
export default function ShowMeHowToMakeIt({ menuItemId, menuItemName }) {
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!menuItemId) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchHomemadeByMenuItem(menuItemId)
      .then((res) => {
        if (!cancelled) setDishes(res.dishes || []);
      })
      .catch(() => {
        if (!cancelled) setDishes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [menuItemId]);

  if (loading) return null;

  const count = dishes.length;
  const createHref = `/my-menuply/homemade/create?source_menu_item_id=${encodeURIComponent(menuItemId)}&name=${encodeURIComponent(menuItemName || "")}`;

  function handleOpen() {
    setExpanded(true);
    captureEvent("show_me_how_to_make_clicked", {
      menu_item_id: menuItemId,
      homemade_count: count,
    });
  }

  if (!expanded) {
    return (
      <section style={{ marginTop: 20, padding: "14px 16px", borderRadius: 14, background: "#f0fdf4", border: "1px solid #bbf7d0" }} data-testid="show-me-how-to-make">
        <button
          type="button"
          onClick={handleOpen}
          style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", border: "none", background: "transparent", cursor: "pointer", padding: 0, textAlign: "left" }}
        >
          <span style={{ fontWeight: 700, color: "#14532d" }}>Show Me How to Make It →</span>
          <span style={{ fontSize: 13, color: "#15803d" }}>
            {count > 0 ? `${count} Homemade version${count === 1 ? "" : "s"}` : "Be the first"}
          </span>
        </button>
      </section>
    );
  }

  return (
    <section style={{ marginTop: 20, padding: "16px", borderRadius: 14, background: "#f0fdf4", border: "1px solid #bbf7d0" }} data-testid="show-me-how-expanded">
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#14532d" }}>Homemade versions</h3>
      {count === 0 ? (
        <div>
          <p style={{ margin: "0 0 12px", color: "#334155" }}>
            <strong>No homemade versions yet.</strong>
            <br />
            Be the first to show us how to make it.
          </p>
          <Link to={createHref} style={{ color: "#15803d", fontWeight: 700 }}>
            Create your version →
          </Link>
        </div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
          {dishes.map((d) => (
            <li key={d.id} style={{ marginBottom: 10 }}>
              <Link to={d.href || `/homemade-dishes/${d.id}`} style={{ color: "#0f172a", fontWeight: 600 }}>
                {d.name}
              </Link>
              <span style={{ color: "#64748b", fontSize: 13 }}> · by {d.creator_display_name || "Diner"}</span>
            </li>
          ))}
        </ul>
      )}
      <Link to={createHref} style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
        + Add your homemade version
      </Link>
    </section>
  );
}
