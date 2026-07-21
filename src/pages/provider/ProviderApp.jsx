import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import * as providerApi from "../../lib/providerApi.js";
import { formatMoney } from "../../components/payments/paymentHelpers.js";

function Shell({ title, children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          background: "#0f172a",
          color: "#fff",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Menuply Provider
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{title}</div>
        </div>
        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/provider" style={{ color: "#bbf7d0", fontWeight: 700 }}>
            Dashboard
          </Link>
          <Link to="/provider/listings" style={{ color: "#bbf7d0", fontWeight: 700 }}>
            Listings
          </Link>
          <Link to="/provider/projects" style={{ color: "#bbf7d0", fontWeight: 700 }}>
            Projects
          </Link>
          <Link to="/account" style={{ color: "#e2e8f0", fontWeight: 600 }}>
            Account
          </Link>
        </nav>
      </header>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: 20 }}>{children}</main>
    </div>
  );
}

function fieldStyle() {
  return {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    boxSizing: "border-box",
  };
}

function ProviderGate({ children }) {
  const { consumer, loading } = useConsumer();
  const location = useLocation();
  const redirectTo = `${location.pathname}${location.search || ""}`;

  if (loading) {
    return (
      <Shell title="Loading…">
        <p>Checking consumer session…</p>
      </Shell>
    );
  }

  if (!consumer) {
    return <Navigate to="/account/login" replace state={{ redirectTo }} />;
  }

  return children;
}

function ApplyForm({ onApplied }) {
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    location: "",
    portfolio_urls: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await providerApi.applyAsProvider({
        display_name: form.display_name,
        bio: form.bio,
        location: form.location,
        portfolio_urls: form.portfolio_urls
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      onApplied(result.provider);
    } catch (err) {
      setError(err.message || "Unable to apply.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Apply as Menu Designer</h2>
      <p style={{ margin: 0, color: "#64748b" }}>
        Uses your consumer account. CRM must approve before you can publish listings.
      </p>
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      <label>
        Display name
        <input
          required
          style={fieldStyle()}
          value={form.display_name}
          onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
        />
      </label>
      <label>
        Bio
        <textarea
          style={{ ...fieldStyle(), minHeight: 80 }}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
        />
      </label>
      <label>
        Location
        <input
          style={fieldStyle()}
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
      </label>
      <label>
        Portfolio URLs (one per line)
        <textarea
          style={{ ...fieldStyle(), minHeight: 80 }}
          value={form.portfolio_urls}
          onChange={(e) => setForm((f) => ({ ...f, portfolio_urls: e.target.value }))}
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        style={{
          minHeight: 44,
          border: "none",
          borderRadius: 12,
          background: "#166534",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {saving ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

function DashboardHome() {
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await providerApi.getProviderMe();
      setProvider(result.provider || null);
    } catch (err) {
      setError(err.message || "Unable to load provider profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <Shell title="Provider">
        <p>Loading…</p>
      </Shell>
    );
  }

  if (!provider) {
    return (
      <Shell title="Become a provider">
        {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
        <ApplyForm onApplied={setProvider} />
      </Shell>
    );
  }

  const approved = provider.approval_status === "approved" && provider.active;

  return (
    <Shell title={provider.display_name}>
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div>
          <strong>Status:</strong> {provider.approval_status}
          {provider.active ? " · active" : " · inactive"}
        </div>
        <div style={{ marginTop: 8, color: "#64748b" }}>{provider.bio || "No bio yet."}</div>
        {!approved ? (
          <p style={{ marginTop: 12, color: "#b54708" }}>
            Wait for CRM approval before creating sellable listings.
          </p>
        ) : (
          <p style={{ marginTop: 12, color: "#166534" }}>
            You can manage fixed-price Menuply Menu Design listings and deliver projects.
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/provider/listings" style={{ fontWeight: 800, color: "#166534" }}>
          Manage listings →
        </Link>
        <Link to="/provider/projects" style={{ fontWeight: 800, color: "#166534" }}>
          View projects →
        </Link>
      </div>
    </Shell>
  );
}

function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    fixed_price_cents: "",
    turnaround_days: 7,
    revision_count: 1,
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const result = await providerApi.getProviderListings();
      setListings(result.listings || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load listings.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createListing(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await providerApi.createProviderListing({
        ...form,
        fixed_price_cents: Number(form.fixed_price_cents),
        turnaround_days: Number(form.turnaround_days),
        revision_count: Number(form.revision_count),
      });
      setForm({
        title: "",
        short_description: "",
        fixed_price_cents: "",
        turnaround_days: 7,
        revision_count: 1,
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to create listing.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(listing) {
    try {
      await providerApi.updateProviderListing(listing.id, { active: !listing.active });
      await load();
    } catch (err) {
      setError(err.message || "Unable to update listing.");
    }
  }

  return (
    <Shell title="Listings">
      {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}
      <form
        onSubmit={createListing}
        style={{ background: "#fff", borderRadius: 16, padding: 20, display: "grid", gap: 10, marginBottom: 20 }}
      >
        <h2 style={{ margin: 0 }}>New fixed-price listing</h2>
        <input
          required
          placeholder="Title"
          style={fieldStyle()}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <textarea
          placeholder="Short description"
          style={{ ...fieldStyle(), minHeight: 70 }}
          value={form.short_description}
          onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
        />
        <input
          required
          type="number"
          min="1"
          placeholder="Fixed price (cents)"
          style={fieldStyle()}
          value={form.fixed_price_cents}
          onChange={(e) => setForm((f) => ({ ...f, fixed_price_cents: e.target.value }))}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            type="number"
            min="1"
            placeholder="Turnaround days"
            style={fieldStyle()}
            value={form.turnaround_days}
            onChange={(e) => setForm((f) => ({ ...f, turnaround_days: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            placeholder="Revisions"
            style={fieldStyle()}
            value={form.revision_count}
            onChange={(e) => setForm((f) => ({ ...f, revision_count: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            minHeight: 44,
            border: "none",
            borderRadius: 12,
            background: "#166534",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          {saving ? "Saving…" : "Create listing (starts inactive)"}
        </button>
      </form>

      <div style={{ display: "grid", gap: 12 }}>
        {listings.map((listing) => (
          <div key={listing.id} style={{ background: "#fff", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 800 }}>{listing.title}</div>
            <div style={{ color: "#64748b" }}>{listing.short_description}</div>
            <div style={{ marginTop: 8 }}>
              {formatMoney(listing.fixed_price_cents)} · {listing.turnaround_days} days ·{" "}
              {listing.revision_count} revisions · {listing.active ? "Active" : "Inactive"}
            </div>
            <button type="button" onClick={() => toggleActive(listing)} style={{ marginTop: 10 }}>
              {listing.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    providerApi
      .getProviderProjects()
      .then((result) => setProjects(result.projects || []))
      .catch((err) => setError(err.message || "Unable to load projects."));
  }, []);

  return (
    <Shell title="Projects">
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      <div style={{ display: "grid", gap: 12 }}>
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/provider/projects/${project.id}`}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 16,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontWeight: 800 }}>{project.title_snapshot}</div>
            <div style={{ color: "#64748b" }}>
              {project.restaurant_name || `Restaurant #${project.restaurant_id}`} · {project.status} ·{" "}
              {formatMoney(project.price_snapshot_cents)}
            </div>
          </Link>
        ))}
        {!projects.length ? <p style={{ color: "#64748b" }}>No paid projects yet.</p> : null}
      </div>
    </Shell>
  );
}

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    providerApi
      .getProviderProject(id)
      .then((result) => {
        setProject(result.project);
        setDeliveryUrl(result.project?.delivery_file_url || "");
      })
      .catch((err) => setError(err.message || "Unable to load project."));
  }, [id]);

  async function deliver(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await providerApi.deliverProviderProject(id, deliveryUrl);
      setProject(result.project);
    } catch (err) {
      setError(err.message || "Unable to attach delivery.");
    } finally {
      setSaving(false);
    }
  }

  if (!project && !error) {
    return (
      <Shell title="Project">
        <p>Loading…</p>
      </Shell>
    );
  }

  return (
    <Shell title={project?.title_snapshot || "Project"}>
      <button type="button" onClick={() => navigate("/provider/projects")} style={{ marginBottom: 12 }}>
        ← Back
      </button>
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      {project ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, display: "grid", gap: 10 }}>
          <div>
            <strong>Status:</strong> {project.status}
          </div>
          <div>
            <strong>Restaurant:</strong> {project.restaurant_name || project.restaurant_id}
          </div>
          <div>
            <strong>Price:</strong> {formatMoney(project.price_snapshot_cents)}
          </div>
          <div>
            <strong>Brief:</strong> {project.project_brief || "—"}
          </div>
          <div>
            <strong>Source menu id:</strong> {project.source_menu_id || "—"}
          </div>
          <div>
            <strong>Logo:</strong> {project.restaurant_logo_url || "—"}
          </div>
          <div>
            <strong>Asset refs:</strong>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f8fafc", padding: 10 }}>
              {JSON.stringify(project.asset_refs_json || {}, null, 2)}
            </pre>
          </div>
          <form onSubmit={deliver} style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <label>
              Delivery file URL
              <input
                required
                style={fieldStyle()}
                value={deliveryUrl}
                onChange={(e) => setDeliveryUrl(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              style={{
                minHeight: 44,
                border: "none",
                borderRadius: 12,
                background: "#166534",
                color: "#fff",
                fontWeight: 800,
              }}
            >
              {saving ? "Saving…" : "Mark delivered"}
            </button>
          </form>
        </div>
      ) : null}
    </Shell>
  );
}

export default function ProviderApp() {
  return (
    <ProviderGate>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="*" element={<Navigate to="/provider" replace />} />
      </Routes>
    </ProviderGate>
  );
}
