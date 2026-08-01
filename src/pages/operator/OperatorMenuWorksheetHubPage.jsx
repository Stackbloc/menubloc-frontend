/**
 * Menu Worksheet hub — pick a menu, then open the shared worksheet editor.
 * Route: /operator/menu-worksheet
 * Deep link / onboarding still uses:
 *   /operator/restaurants/:restaurantId/menus/:menuId/worksheet
 */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const BTN_PRIMARY = {
  border: "none",
  borderRadius: 10,
  background: "#1F4E3D",
  color: "#fff",
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
};

const BTN_SECONDARY = {
  border: "1px solid #e4e9f0",
  borderRadius: 10,
  background: "#fff",
  color: "#0f1720",
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function OperatorMenuWorksheetHubPage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rid) {
      setMenus([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .getMenus(rid)
      .then((data) => {
        if (cancelled) return;
        setMenus(Array.isArray(data?.menus) ? data.menus : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Unable to load menus.");
        setMenus([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rid]);

  const primaryMenu = useMemo(() => {
    if (!menus.length) return null;
    return menus.find((m) => m.is_primary || m.is_active) || menus[0];
  }, [menus]);

  function openWorksheet(menuId) {
    navigate(`/operator/restaurants/${rid}/menus/${menuId}/worksheet`);
  }

  if (!rid) {
    return (
      <OperatorLayout title="Menu Worksheet">
        <p style={{ color: "#64748b" }}>Select a restaurant to edit menu content.</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Menu Worksheet">
      <div style={{ maxWidth: 820, display: "grid", gap: 16 }} data-testid="menu-worksheet-hub">
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f1720" }}>Edit menu content</div>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
            Change dish names, sections, descriptions, and prices here. Use{" "}
            <strong>Save Worksheet</strong> to keep a draft, then <strong>Update Menuply Menu</strong>{" "}
            to publish live. Graphics live in{" "}
            <Link to="/operator/menulab" style={{ color: "#1F4E3D", fontWeight: 700 }}>
              Menu Lab
            </Link>
            .
          </p>
        </div>

        {error ? (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div style={{ color: "#64748b", fontSize: 14 }}>Loading menus…</div>
        ) : menus.length === 0 ? (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: "1px solid #e4e9f0",
              background: "#fff",
              color: "#64748b",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            No menus yet. Upload a PDF or photo from Menu Lab, then return here to edit content.
            <div style={{ marginTop: 12 }}>
              <Link to="/operator/menulab" style={{ ...BTN_PRIMARY, display: "inline-block", textDecoration: "none" }}>
                Open Menu Lab
              </Link>
            </div>
          </div>
        ) : (
          <>
            {primaryMenu ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e4e9f0",
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Primary menu
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1720", marginTop: 4 }}>
                    {primaryMenu.name || primaryMenu.title || `Menu ${primaryMenu.id}`}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    {[primaryMenu.status, primaryMenu.is_primary ? "Primary" : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button type="button" style={BTN_PRIMARY} onClick={() => openWorksheet(primaryMenu.id)}>
                  Open Menu Worksheet
                </button>
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 8 }}>
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e4e9f0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f1720" }}>
                      {menu.name || menu.title || `Menu ${menu.id}`}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {[
                        menu.status,
                        menu.is_primary ? "Primary" : null,
                        menu.is_active === false ? "Inactive" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Menu"}
                    </div>
                  </div>
                  <button type="button" style={BTN_SECONDARY} onClick={() => openWorksheet(menu.id)}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </OperatorLayout>
  );
}
