import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { createCommunityCluster, previewCommunityClusterCandidates } from "../lib/clusterApi.js";
import { toConsumerErrorMessage } from "../lib/api.js";

const INITIAL_FORM = {
  name: "",
  type: "university",
  city: "",
  state: "",
  anchor_location: "",
  lat: "",
  lng: "",
  radius_miles: "1.5",
  short_description: "",
};

export default function CommunityClusterCreatePage() {
  const navigate = useNavigate();
  const { isAuthenticated, consumer } = useConsumer();
  const [form, setForm] = useState(INITIAL_FORM);
  const [preview, setPreview] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () =>
      form.name &&
      form.type &&
      form.city &&
      form.state &&
      form.anchor_location &&
      form.lat &&
      form.lng &&
      form.radius_miles &&
      form.short_description,
    [form]
  );

  async function loadPreview() {
    setBusy(true);
    setError("");
    try {
      const json = await previewCommunityClusterCandidates({
        city: form.city,
        state: form.state,
        lat: Number(form.lat),
        lng: Number(form.lng),
        radius_miles: Number(form.radius_miles),
      });
      const rows = Array.isArray(json.candidates) ? json.candidates : [];
      setPreview(rows);
      setSelected(rows.map((row) => Number(row.restaurant_id)));
    } catch (err) {
      setError(toConsumerErrorMessage(err, "Could not preview nearby restaurants."));
    } finally {
      setBusy(false);
    }
  }

  function toggleRestaurant(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  }

  function moveRestaurant(id, direction) {
    setSelected((current) => {
      const idx = current.indexOf(id);
      if (idx < 0) return current;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= current.length) return current;
      const next = [...current];
      [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
      return next;
    });
  }

  async function publish() {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const json = await createCommunityCluster({
        ...form,
        state: String(form.state).toUpperCase(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        radius_miles: Number(form.radius_miles),
        restaurant_ids: selected,
      });
      const cluster = json?.cluster;
      if (!cluster?.slug) throw new Error("Cluster created but missing slug");
      navigate(`/clusters/${String(cluster.state || "").toLowerCase()}/${String(cluster.city || "").toLowerCase().replace(/\s+/g, "-")}/${cluster.slug}`);
    } catch (err) {
      setError(toConsumerErrorMessage(err, "Could not create community cluster."));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
        <h1 style={{ marginTop: 0 }}>Create Community Cluster</h1>
        <p>Please sign in to create a cluster.</p>
        <Link to="/account/login" state={{ redirectTo: "/clusters/community/new" }}>
          Go to login
        </Link>
        <BottomNav />
      </div>
    );
  }

  if (consumer?.email_verified !== true) {
    return (
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
        <h1 style={{ marginTop: 0 }}>Create Community Cluster</h1>
        <p>Verified users can publish Community Clusters.</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.75rem" }}>Create Community Cluster</h1>
      <p style={{ margin: "0 0 1rem", color: "#6b7280" }}>
        Publish quickly. Verify carefully. Remove abuse immediately.
      </p>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: "0.65rem", marginBottom: "1rem" }}>
        {Object.keys(INITIAL_FORM).map((key) => (
          <label key={key} style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 13, color: "#374151" }}>{key.replace(/_/g, " ")}</span>
            <input
              value={form[key]}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "0.55rem 0.6rem" }}
            />
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
        <button type="button" onClick={loadPreview} disabled={busy || !canSubmit}>
          Preview nearby CK restaurants
        </button>
        <button type="button" onClick={publish} disabled={busy || !canSubmit}>
          Publish as 🟡 Community Cluster
        </button>
      </div>

      {preview.length > 0 ? (
        <section style={{ display: "grid", gap: "0.5rem" }}>
          {preview.map((row) => {
            const id = Number(row.restaurant_id);
            const isSelected = selected.includes(id);
            return (
              <div
                key={id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "0.55rem 0.7rem",
                  background: isSelected ? "#f9fafb" : "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{row.restaurant_name}</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>{row.address_line1 || ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => toggleRestaurant(id)}>
                      {isSelected ? "Remove" : "Add"}
                    </button>
                    <button type="button" onClick={() => moveRestaurant(id, -1)} disabled={!isSelected}>
                      Up
                    </button>
                    <button type="button" onClick={() => moveRestaurant(id, 1)} disabled={!isSelected}>
                      Down
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
      <BottomNav />
    </div>
  );
}
