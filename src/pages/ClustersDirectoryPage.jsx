import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { createCommunityCluster, fetchClustersDirectory } from "../lib/clusterApi.js";
import { toConsumerErrorMessage } from "../lib/api.js";
import ClusterDirectoryCard, { CLUSTER_DIRECTORY_GRID_STYLE } from "../components/cluster/ClusterDirectoryCard.jsx";
import {
  CLUSTER_DESTINATION_TYPES,
  clusterDestinationCategoryLabel,
  stateDisplayName,
} from "../lib/clusterUrl.js";

const TYPE_ACCENTS = {
  university: { border: "#8b5cf6", bg: "#f5f3ff" },
  airport: { border: "#0ea5e9", bg: "#ecfeff" },
  downtown: { border: "#f97316", bg: "#fff7ed" },
  entertainment_complex: { border: "#ec4899", bg: "#fdf2f8" },
  tourist_destination: { border: "#16a34a", bg: "#f0fdf4" },
  stadium: { border: "#2563eb", bg: "#eff6ff" },
  convention_district: { border: "#14b8a6", bg: "#f0fdfa" },
  historic_district: { border: "#a16207", bg: "#fefce8" },
  waterfront: { border: "#0891b2", bg: "#ecfeff" },
  casino: { border: "#b91c1c", bg: "#fef2f2" },
  theme_park: { border: "#7c3aed", bg: "#f5f3ff" },
  business_district: { border: "#4b5563", bg: "#f9fafb" },
};

const INITIAL_FORM = {
  name: "",
  state: "",
  city: "",
  type: "university",
  anchor_location: "",
  lat: "",
  lng: "",
  radius_miles: "1.5",
  short_description: "",
};

const US_STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

export default function ClustersDirectoryPage() {
  const { isAuthenticated, consumer } = useConsumer();
  const [clusters, setClusters] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const json = await fetchClustersDirectory({ limit: 200 });
        setClusters(Array.isArray(json.clusters) ? json.clusters : []);
      } catch (err) {
        setError(toConsumerErrorMessage(err, "Could not load clusters."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sortedClusters = useMemo(
    () =>
      [...clusters].sort(
        (a, b) =>
          String(a.city || "").localeCompare(String(b.city || "")) ||
          String(a.name || "").localeCompare(String(b.name || ""))
      ),
    [clusters]
  );

  async function submitCluster(event) {
    event.preventDefault();
    if (!isAuthenticated) return;
    if (consumer?.email_verified !== true) return;
    setSubmitBusy(true);
    setError("");
    try {
      const json = await createCommunityCluster({
        ...form,
        state: String(form.state || "").trim().toUpperCase(),
        lat: form.lat === "" ? null : Number(form.lat),
        lng: form.lng === "" ? null : Number(form.lng),
        radius_miles: Number(form.radius_miles),
      });
      if (json?.cluster) {
        setPendingSubmissions((current) => [json.cluster, ...current]);
      }
      setForm(INITIAL_FORM);
    } catch (err) {
      const message = toConsumerErrorMessage(err, "Could not submit cluster request.");
      if (String(message).toLowerCase().includes("authentication required")) {
        setError("Your session expired. Please sign in again, then submit your cluster.");
      } else {
        setError(message);
      }
    } finally {
      setSubmitBusy(false);
    }
  }

  function clusterStatusLabel(cluster) {
    const status = String(cluster?.status || "").toLowerCase();
    if (status === "review" || status === "draft") return "🟠 Pending";
    const level = String(cluster?.verification_level || "").toLowerCase();
    if (level === "community") return "🟡 Community";
    return "🟢 Approved";
  }

  function renderClusterCard(cluster, isPending = false) {
    const type = String(cluster.type || "").toLowerCase();
    const accent = TYPE_ACCENTS[type] || { border: "#d1d5db", bg: "#f9fafb" };
    return (
      <ClusterDirectoryCard
        key={`${cluster.id || cluster.slug}-${isPending ? "pending" : "active"}`}
        cluster={cluster}
        accent={accent}
        statusLabel={clusterStatusLabel(cluster)}
        isPending={isPending}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "1.25rem 1rem 5rem",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <header
          style={{
            border: "1px solid #dbe7df",
            background: "#ffffff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
            marginBottom: "1rem",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          <BrandLogo height={36} radius={10} matchPageBackground={false} />
          <h1 style={{ margin: "0.75rem 0 0.4rem", fontSize: "1.7rem", lineHeight: 1.2 }}>
            Clusters
          </h1>
          <p style={{ margin: 0, color: "#475569", maxWidth: 760 }}>
            Clusters organize restaurants around the places people actually go—universities, downtowns,
            airports, entertainment districts, tourist destinations, and more. Know of a great location
            that belongs as a Cluster? Submit it!
          </p>
        </header>

        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

        <section
          style={{
            border: "1px solid #dbe7df",
            background: "#fff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Current Clusters</h2>
          <p style={{ margin: "0.4rem 0 0.9rem", color: "#64748b", fontSize: 14 }}>
            Cluster name/type and location are shown below.
          </p>
          {loading ? <p style={{ color: "#64748b" }}>Loading clusters…</p> : null}
          {!loading && sortedClusters.length === 0 ? (
            <p style={{ color: "#64748b" }}>No approved clusters yet.</p>
          ) : null}
          {!loading && sortedClusters.length > 0 ? (
            <div style={CLUSTER_DIRECTORY_GRID_STYLE}>
              {sortedClusters.map((cluster) => renderClusterCard(cluster, false))}
              {pendingSubmissions.map((cluster) => renderClusterCard(cluster, true))}
            </div>
          ) : null}
        </section>

        <section
          style={{
            border: "1px solid #dbe7df",
            background: "#fff",
            borderRadius: 18,
            padding: "1rem 1.1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Create a Cluster</h2>
          <p style={{ margin: "0.4rem 0 0.9rem", color: "#64748b", fontSize: 14 }}>
            New submissions are listed as <strong>Pending</strong> until approved.
          </p>

          {!isAuthenticated ? (
            <p style={{ margin: 0, color: "#475569" }}>
              <Link to="/account/login" state={{ redirectTo: "/clusters" }}>
                Sign in
              </Link>{" "}
              to submit a cluster.
            </p>
          ) : consumer?.email_verified !== true ? (
            <p style={{ margin: 0, color: "#475569" }}>
              Verify your email first to submit a cluster.
            </p>
          ) : (
            <form onSubmit={submitCluster} style={{ display: "grid", gap: "0.75rem" }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 13, color: "#334155" }}>Cluster name</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
                  style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                />
              </label>
              <div style={{ display: "grid", gap: "0.65rem", gridTemplateColumns: "140px minmax(0,1fr)" }}>
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 13, color: "#334155" }}>State</span>
                  <select
                    required
                    value={form.state}
                    onChange={(event) => setForm((c) => ({ ...c, state: event.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                  >
                    <option value="">Select</option>
                    {US_STATE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {stateDisplayName(code)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 13, color: "#334155" }}>City</span>
                  <input
                    required
                    value={form.city}
                    onChange={(event) => setForm((c) => ({ ...c, city: event.target.value }))}
                    placeholder="Los Angeles"
                    style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                  />
                </label>
              </div>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 13, color: "#334155" }}>Cluster type</span>
                <select
                  required
                  value={form.type}
                  onChange={(event) => setForm((c) => ({ ...c, type: event.target.value }))}
                  style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                >
                  {CLUSTER_DESTINATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {clusterDestinationCategoryLabel(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 13, color: "#334155" }}>Anchor location</span>
                <input
                  required
                  value={form.anchor_location}
                  onChange={(event) => setForm((c) => ({ ...c, anchor_location: event.target.value }))}
                  placeholder="Street address or landmark"
                  style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                />
              </label>
              <div style={{ display: "grid", gap: "0.65rem", gridTemplateColumns: "220px minmax(0,1fr)" }}>
                <label style={{ display: "grid", gap: 4, maxWidth: 220 }}>
                  <span style={{ fontSize: 13, color: "#334155" }}>Radius (mi)</span>
                  <input
                    required
                    type="number"
                    min="0.25"
                    max="25"
                    step="0.25"
                    value={form.radius_miles}
                    onChange={(event) => setForm((c) => ({ ...c, radius_miles: event.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                  />
                </label>
                <div style={{ display: "grid", gap: "0.65rem", gridTemplateColumns: "1fr 1fr" }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 13, color: "#334155" }}>Latitude (optional)</span>
                    <input
                      value={form.lat}
                      onChange={(event) => setForm((c) => ({ ...c, lat: event.target.value }))}
                      placeholder="34.0224"
                      style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 13, color: "#334155" }}>Longitude (optional)</span>
                    <input
                      value={form.lng}
                      onChange={(event) => setForm((c) => ({ ...c, lng: event.target.value }))}
                      placeholder="-118.2851"
                      style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                    />
                  </label>
                </div>
                <div style={{ gridColumn: "1 / -1", color: "#64748b", fontSize: 12 }}>
                  Anchor location is required. Latitude/longitude is optional.
                </div>
              </div>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 13, color: "#334155" }}>Short description</span>
                <textarea
                  required
                  rows={3}
                  value={form.short_description}
                  onChange={(event) => setForm((c) => ({ ...c, short_description: event.target.value }))}
                  style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: "0.55rem 0.6rem" }}
                />
              </label>
              <button
                type="submit"
                disabled={submitBusy}
                style={{
                  justifySelf: "start",
                  border: "none",
                  borderRadius: 10,
                  background: "#0f172a",
                  color: "#fff",
                  padding: "0.58rem 0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {submitBusy ? "Submitting..." : "Submit Cluster"}
              </button>
            </form>
          )}
        </section>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <p style={{ marginTop: "0.85rem", color: "#64748b", fontSize: 12 }}>
          Pending clusters are not public until approved.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
