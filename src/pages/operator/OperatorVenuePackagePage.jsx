/**
 * Operator Events / Venue package shell (Phase 3).
 * Structure only — Event CRUD / ticketing / groups come in later phases.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const CARD = {
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e4e9f0",
  background: "#fff",
};

export default function OperatorVenuePackagePage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id || null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [pkg, setPkg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.getRestaurantCapabilities(rid);
      setEnabled(data?.venue_capability_enabled === true);
      setPkg(data?.venue_package || null);
    } catch (err) {
      setError(err?.message || "Could not load Venue package");
      setEnabled(false);
      setPkg(null);
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleVenue(next) {
    if (!rid || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await api.setRestaurantCapability(rid, "venue", { enabled: next });
      setEnabled(data?.venue_capability_enabled === true || data?.capability?.enabled === true);
      setPkg(data?.venue_package || null);
    } catch (err) {
      setError(err?.message || "Could not update Venue capability");
    } finally {
      setBusy(false);
    }
  }

  const modules = Array.isArray(pkg?.modules) ? pkg.modules : [];

  return (
    <OperatorLayout title="Events / Venue">
      <div data-testid="operator-venue-package" style={{ maxWidth: 720, display: "grid", gap: 16 }}>
        <div style={{ fontSize: 14, color: "#5b6675", lineHeight: 1.5 }}>
          Venue is a capability you attach to this business — it does not change whether you are a
          restaurant, bar, brewery, cafe, or nightclub. Enabling Venue unlocks the Events package
          shell. Ticket purchase and full event objects arrive in later phases.
        </div>

        {loading ? <div style={{ color: "#5b6675" }}>Loading…</div> : null}
        {error ? (
          <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
            {error}
          </div>
        ) : null}

        <div style={{ ...CARD, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Venue capability</div>
          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              data-testid="operator-venue-capability-toggle"
              checked={enabled}
              disabled={busy || !rid || loading}
              onChange={(e) => toggleVenue(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              Enable Venue capability for this location
              <span style={{ display: "block", fontWeight: 500, color: "#5b6675", marginTop: 4 }}>
                When on, the public profile can show Upcoming Events. Existing restaurants stay
                restaurants unless you enable this.
              </span>
            </span>
          </label>
        </div>

        {enabled ? (
          <div
            style={{ ...CARD, display: "grid", gap: 12 }}
            data-testid="operator-venue-package-modules"
          >
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              {pkg?.title || "Events / Venue"} package
            </div>
            <div style={{ fontSize: 13, color: "#5b6675", lineHeight: 1.45 }}>
              {pkg?.description ||
                "Create and manage events, ticketing configuration, event groups, and group offers."}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
              {modules.map((mod) => (
                <li key={mod.key} data-testid={`venue-module-${mod.key}`}>
                  <strong>{mod.title}</strong>
                  <span style={{ color: "#78716c", fontWeight: 600 }}> — shell</span>
                  {mod.description ? (
                    <div style={{ fontSize: 12, color: "#5b6675" }}>{mod.description}</div>
                  ) : null}
                </li>
              ))}
            </ul>
            <div
              style={{
                fontSize: 12,
                color: "#78716c",
                padding: "10px 12px",
                background: "#f8fafc",
                borderRadius: 8,
              }}
            >
              Creating events, ticketing, and group offers are not available in this phase. Structure
              only.
            </div>
          </div>
        ) : (
          <div style={{ ...CARD, fontSize: 13, color: "#5b6675" }}>
            Enable Venue capability to open the Events / Venue package modules.
          </div>
        )}

        <div style={{ fontSize: 13 }}>
          <Link to="/operator/profile-editor" style={{ color: "#166534", fontWeight: 700 }}>
            ← Back to Profile Editor
          </Link>
        </div>
      </div>
    </OperatorLayout>
  );
}
