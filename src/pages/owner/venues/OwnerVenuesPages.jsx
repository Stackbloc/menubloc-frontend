import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import OwnerLayout, { EmptyState, PageCard, SectionTitle, OWNER_COLORS } from "../OwnerLayout.jsx";
import {
  assignVenueClusters,
  createOwnerVenue,
  getOwnerVenue,
  inviteVenueOperator,
  listAvailableClustersForVenue,
  listOwnerVenues,
  updateOwnerVenue,
} from "../../../lib/venueApi.js";

export function OwnerVenuesListPage() {
  const [venues, setVenues] = useState([]);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    venue_name: "",
    status: "pending",
    license_fee: "",
    revenue_share_percentage: "",
  });
  const navigate = useNavigate();

  async function reload() {
    const data = await listOwnerVenues();
    setVenues(data.venues || []);
  }

  useEffect(() => {
    reload().catch((err) => setError(err.message || "Failed to load venues"));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const result = await createOwnerVenue({
        venue_name: form.venue_name,
        status: form.status,
        license_fee: form.license_fee === "" ? null : Number(form.license_fee),
        revenue_share_percentage:
          form.revenue_share_percentage === ""
            ? null
            : Number(form.revenue_share_percentage),
      });
      setShowCreate(false);
      navigate(`/owner/venues/${result.venue.id}`);
    } catch (err) {
      setError(err.message || "Create failed");
    }
  }

  return (
    <OwnerLayout
      title="Venues"
      actions={
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{
            border: "none",
            background: OWNER_COLORS.accent,
            color: "#fff",
            borderRadius: 10,
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Create Venue
        </button>
      }
    >
      <PageCard style={{ padding: 20 }}>
        <SectionTitle
          title="Venue merchants"
          subtitle="Create venues, assign clusters, and invite venue operators. Venues do not use restaurant onboarding."
        />
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

        {showCreate ? (
          <form
            onSubmit={handleCreate}
            style={{
              display: "grid",
              gap: 12,
              marginBottom: 20,
              padding: 16,
              border: `1px solid ${OWNER_COLORS.line}`,
              borderRadius: 14,
              background: "#fff",
            }}
          >
            <label>
              Venue name
              <input
                required
                value={form.venue_name}
                onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              >
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="suspended">suspended</option>
              </select>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                License fee
                <input
                  type="number"
                  step="0.01"
                  value={form.license_fee}
                  onChange={(e) => setForm((f) => ({ ...f, license_fee: e.target.value }))}
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                />
              </label>
              <label>
                Revenue share %
                <input
                  type="number"
                  step="0.01"
                  value={form.revenue_share_percentage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, revenue_share_percentage: e.target.value }))
                  }
                  style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={{ padding: "10px 14px", fontWeight: 700 }}>
                Create
              </button>
              <button type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {venues.length === 0 ? (
          <EmptyState>No venues yet. Create the first venue merchant.</EmptyState>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                <th style={{ padding: 8 }}>Name</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Clusters</th>
                <th style={{ padding: 8 }}>License</th>
                <th style={{ padding: 8 }}>Rev share %</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id} style={{ borderBottom: `1px solid ${OWNER_COLORS.line}` }}>
                  <td style={{ padding: 8 }}>
                    <Link to={`/owner/venues/${v.id}`}>{v.venue_name}</Link>
                  </td>
                  <td style={{ padding: 8 }}>{v.status}</td>
                  <td style={{ padding: 8 }}>{v.cluster_count ?? 0}</td>
                  <td style={{ padding: 8 }}>{v.license_fee ?? "—"}</td>
                  <td style={{ padding: 8 }}>{v.revenue_share_percentage ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
    </OwnerLayout>
  );
}

export function OwnerVenueDetailPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [available, setAvailable] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedClusterIds, setSelectedClusterIds] = useState([]);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "owner",
  });

  async function reload() {
    const data = await getOwnerVenue(id);
    setVenue(data.venue);
    setClusters(data.clusters || []);
    setMemberships(data.memberships || []);
    setSelectedClusterIds((data.clusters || []).map((c) => c.id));
    const avail = await listAvailableClustersForVenue(id);
    setAvailable(avail.clusters || []);
  }

  useEffect(() => {
    reload().catch((err) => setError(err.message || "Failed to load venue"));
  }, [id]);

  async function saveVenue(patch) {
    setError("");
    try {
      const result = await updateOwnerVenue(id, patch);
      setVenue(result.venue);
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  async function saveClusters() {
    setError("");
    try {
      const result = await assignVenueClusters(id, selectedClusterIds);
      setClusters(result.clusters || []);
    } catch (err) {
      setError(err.message || "Cluster assignment failed");
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    setError("");
    try {
      const result = await inviteVenueOperator(id, invite);
      setMemberships(result.memberships || []);
      setInvite({ email: "", password: "", full_name: "", role: "owner" });
    } catch (err) {
      setError(err.message || "Invite failed");
    }
  }

  if (!venue) {
    return (
      <OwnerLayout title="Venue">
        <PageCard style={{ padding: 20 }}>
          {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : <p>Loading…</p>}
        </PageCard>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout title={venue.venue_name}>
      <div style={{ display: "grid", gap: 16 }}>
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

        <PageCard style={{ padding: 20 }}>
          <SectionTitle title="Venue settings" />
          <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <label>
              Name
              <input
                value={venue.venue_name}
                onChange={(e) => setVenue((v) => ({ ...v, venue_name: e.target.value }))}
                onBlur={() => saveVenue({ venue_name: venue.venue_name })}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              Status
              <select
                value={venue.status}
                onChange={(e) => {
                  const status = e.target.value;
                  setVenue((v) => ({ ...v, status }));
                  saveVenue({ status });
                }}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              >
                <option value="pending">pending</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="suspended">suspended</option>
              </select>
            </label>
            <label>
              License fee
              <input
                type="number"
                value={venue.license_fee ?? ""}
                onChange={(e) =>
                  setVenue((v) => ({
                    ...v,
                    license_fee: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                onBlur={() => saveVenue({ license_fee: venue.license_fee })}
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label>
              Revenue share %
              <input
                type="number"
                value={venue.revenue_share_percentage ?? ""}
                onChange={(e) =>
                  setVenue((v) => ({
                    ...v,
                    revenue_share_percentage:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                onBlur={() =>
                  saveVenue({ revenue_share_percentage: venue.revenue_share_percentage })
                }
                style={{ display: "block", width: "100%", marginTop: 4, padding: 8 }}
              />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={venue.advertising_features_approved !== false}
                onChange={(e) => {
                  const advertising_features_approved = e.target.checked;
                  setVenue((v) => ({ ...v, advertising_features_approved }));
                  saveVenue({ advertising_features_approved });
                }}
              />
              Approve advertising features
            </label>
            <p style={{ color: OWNER_COLORS.muted, fontSize: 13, margin: 0 }}>
              Stripe connected: {venue.stripe_connected ? "yes" : "no"} · Billing:{" "}
              {venue.billing_status}
            </p>
          </div>
        </PageCard>

        <PageCard style={{ padding: 20 }}>
          <SectionTitle
            title="Assigned clusters"
            subtitle="A venue owns one or more clusters. Advertising inventory belongs to those clusters."
            action={
              <button type="button" onClick={saveClusters} style={{ padding: "8px 12px", fontWeight: 700 }}>
                Save assignments
              </button>
            }
          />
          <div style={{ display: "grid", gap: 8, maxHeight: 280, overflow: "auto" }}>
            {available.map((c) => {
              const checked = selectedClusterIds.includes(c.id);
              return (
                <label key={c.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelectedClusterIds((ids) =>
                        e.target.checked ? [...ids, c.id] : ids.filter((x) => x !== c.id)
                      );
                    }}
                  />
                  <span>
                    {c.name} <code style={{ fontSize: 12 }}>{c.slug}</code>
                    {c.city ? ` · ${c.city}, ${c.state}` : ""}
                  </span>
                </label>
              );
            })}
          </div>
          {clusters.length ? (
            <p style={{ marginTop: 12, color: OWNER_COLORS.muted, fontSize: 13 }}>
              Currently assigned: {clusters.map((c) => c.name).join(", ")}
            </p>
          ) : null}
        </PageCard>

        <PageCard style={{ padding: 20 }}>
          <SectionTitle title="Venue operators" subtitle="Invite operators who can sign in at /venue/login." />
          <form onSubmit={handleInvite} style={{ display: "grid", gap: 10, maxWidth: 480, marginBottom: 16 }}>
            <input
              required
              type="email"
              placeholder="Email"
              value={invite.email}
              onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))}
              style={{ padding: 8 }}
            />
            <input
              required
              type="password"
              placeholder="Temporary password"
              value={invite.password}
              onChange={(e) => setInvite((f) => ({ ...f, password: e.target.value }))}
              style={{ padding: 8 }}
            />
            <input
              placeholder="Full name"
              value={invite.full_name}
              onChange={(e) => setInvite((f) => ({ ...f, full_name: e.target.value }))}
              style={{ padding: 8 }}
            />
            <select
              value={invite.role}
              onChange={(e) => setInvite((f) => ({ ...f, role: e.target.value }))}
              style={{ padding: 8 }}
            >
              <option value="owner">owner</option>
              <option value="manager">manager</option>
              <option value="viewer">viewer</option>
            </select>
            <button type="submit" style={{ padding: "10px 14px", fontWeight: 700, width: "fit-content" }}>
              Invite operator
            </button>
          </form>
          {memberships.length === 0 ? (
            <EmptyState>No venue operators yet.</EmptyState>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {memberships.map((m) => (
                <li key={m.id}>
                  {m.email} · {m.role} · {m.status}
                </li>
              ))}
            </ul>
          )}
        </PageCard>
      </div>
    </OwnerLayout>
  );
}
