/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/FranchisesPage.jsx
 * Date: 2026-06-26
 * Purpose:
 *   Franchise headquarters and corporate brand contact page.
 *   Shows a searchable directory of franchise brands. Does NOT
 *   disclose location counts, claim status, data completeness,
 *   or internal franchise data depth. All submissions go to
 *   pending_review for manual follow-up.
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { BrandLogo } from "../components/BrandLogo.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const RELATIONSHIP_OPTIONS = [
  { value: "franchisor_corporate", label: "Franchisor / corporate representative" },
  { value: "master_franchisee", label: "Master franchisee" },
  { value: "area_developer", label: "Area developer" },
  { value: "other", label: "Other" },
];

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page, #f9fafb)",
    color: "var(--gb-color-ink, #101828)",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  hero: {
    background: "linear-gradient(135deg, #0f1720 0%, #1f4e3d 60%, #2d6a4f 100%)",
    color: "#fff",
    padding: "52px 24px 48px",
    textAlign: "center",
  },
  heroEyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
    padding: "7px 14px",
    borderRadius: 999,
    background: "rgba(110,231,183,0.15)",
    border: "1px solid rgba(110,231,183,0.3)",
    color: "#6EE7B7",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: "clamp(1.7rem, 3.8vw, 2.6rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    margin: "0 auto 16px",
    maxWidth: 640,
  },
  heroBody: {
    fontSize: 16,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.82)",
    maxWidth: 560,
    margin: "0 auto 10px",
  },
  heroNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    maxWidth: 500,
    margin: "12px auto 0",
    lineHeight: 1.6,
  },
  shell: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "36px 20px 80px",
  },
  searchRow: {
    display: "flex",
    gap: 12,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  searchInput: {
    flex: "1 1 260px",
    height: 46,
    borderRadius: 12,
    border: "1.5px solid #d0d5dd",
    padding: "0 14px",
    fontSize: 15,
    background: "#fff",
    color: "#101828",
    fontFamily: "inherit",
    outline: "none",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6B7280",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },
  card: {
    borderRadius: 18,
    border: "1.5px solid #e5e7eb",
    background: "#fff",
    padding: "20px 18px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardName: {
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: "#0B0F0C",
    lineHeight: 1.25,
  },
  cardWebsite: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 1.4,
  },
  contactBtn: {
    marginTop: "auto",
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid #1F4E3D",
    background: "#1F4E3D",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.12s",
  },
  paginationRow: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
    flexWrap: "wrap",
  },
  pageBtn: (active) => ({
    height: 38,
    minWidth: 38,
    borderRadius: 8,
    border: active ? "2px solid #1F4E3D" : "1px solid #e5e7eb",
    background: active ? "#1F4E3D" : "#fff",
    color: active ? "#fff" : "#374151",
    fontSize: 14,
    fontWeight: active ? 800 : 500,
    cursor: "pointer",
    padding: "0 12px",
    fontFamily: "inherit",
  }),
  divider: {
    height: 1,
    background: "#e5e7eb",
    margin: "48px 0",
  },
  contactSection: {
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: 24,
    padding: "36px 32px 32px",
    maxWidth: 640,
    margin: "0 auto",
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    marginBottom: 8,
    color: "#0B0F0C",
  },
  formSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 1.65,
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 6,
  },
  required: {
    color: "#c00",
    marginLeft: 2,
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
  },
  inputError: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1.5px solid #fca5a5",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
  },
  select: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
    appearance: "none",
  },
  selectError: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1.5px solid #fca5a5",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
    appearance: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    padding: "10px 12px",
    fontSize: 14,
    background: "#fff",
    color: "#0B0F0C",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
    resize: "vertical",
  },
  fieldError: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 5,
  },
  checkRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 2,
    accentColor: "#1F4E3D",
    flexShrink: 0,
  },
  checkLabel: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#374151",
  },
  submitBtn: (disabled) => ({
    width: "100%",
    height: 50,
    borderRadius: 12,
    border: 0,
    background: disabled ? "#f3f4f6" : "#1F4E3D",
    color: disabled ? "#9ca3af" : "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    marginTop: 8,
  }),
  errorBanner: {
    background: "#fff0f0",
    border: "1px solid #fca5a5",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 13,
    color: "#dc2626",
    fontWeight: 600,
  },
  successBanner: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: 18,
    padding: "32px 28px",
    textAlign: "center",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: "#16a34a",
    marginBottom: 10,
  },
  successBody: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.65,
  },
  notFoundNote: {
    padding: "24px 20px",
    borderRadius: 16,
    background: "rgba(31,78,61,0.05)",
    border: "1px dashed rgba(31,78,61,0.2)",
    marginBottom: 32,
    textAlign: "center",
  },
  notFoundText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.6,
  },
  textBtn: {
    background: "none",
    border: "none",
    color: "#1F4E3D",
    fontWeight: 800,
    cursor: "pointer",
    padding: 0,
    fontSize: "inherit",
    fontFamily: "inherit",
  },
  loadingText: {
    textAlign: "center",
    color: "#9ca3af",
    padding: "40px 0",
    fontSize: 15,
  },
  defaultPrompt: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    padding: "20px 0",
  },
};

function extractDomain(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function ContactForm({ preselected, onSuccess }) {
  const [form, setForm] = useState({
    brand_name: preselected?.name || "",
    chain_id: preselected?.id || "",
    claimant_name: "",
    claimant_title: "",
    claimant_email: "",
    claimant_phone: "",
    company_website: "",
    relationship_to_brand: "",
    notes: "",
    authorization_confirmed: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((f) => ({ ...f, [name]: "" }));
    setServerError("");
  }

  function validate() {
    const e = {};
    if (!form.brand_name.trim()) e.brand_name = "Brand name is required.";
    if (!form.claimant_name.trim()) e.claimant_name = "Your full name is required.";
    if (!form.claimant_title.trim()) e.claimant_title = "Your corporate title is required.";
    if (!form.claimant_email.trim()) e.claimant_email = "Company email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.claimant_email.trim())) e.claimant_email = "Enter a valid company email.";
    if (!form.relationship_to_brand) e.relationship_to_brand = "Please select your relationship to the brand.";
    if (!form.authorization_confirmed) e.authorization_confirmed = "You must confirm authorization.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/franchises/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain_id: form.chain_id || null,
          brand_name: form.brand_name.trim(),
          claimant_name: form.claimant_name.trim(),
          claimant_title: form.claimant_title.trim(),
          claimant_email: form.claimant_email.trim(),
          claimant_phone: form.claimant_phone.trim() || null,
          company_website: form.company_website.trim() || null,
          relationship_to_brand: form.relationship_to_brand,
          notes: form.notes.trim() || null,
          authorization_confirmed: true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={styles.successBanner}>
        <div style={styles.successTitle}>Message received</div>
        <p style={styles.successBody}>
          Thank you for reaching out. A Menuply team member will review your request and follow up at the email you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError ? <div style={styles.errorBanner}>{serverError}</div> : null}

      <div style={styles.field}>
        <label style={styles.label}>
          Franchise / brand name<span style={styles.required}>*</span>
        </label>
        <input
          name="brand_name"
          type="text"
          value={form.brand_name}
          onChange={handleChange}
          style={errors.brand_name ? styles.inputError : styles.input}
          placeholder="e.g. Shake Shack"
          readOnly={!!preselected}
        />
        {errors.brand_name ? <div style={styles.fieldError}>{errors.brand_name}</div> : null}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Full name<span style={styles.required}>*</span>
        </label>
        <input
          name="claimant_name"
          type="text"
          autoComplete="name"
          value={form.claimant_name}
          onChange={handleChange}
          style={errors.claimant_name ? styles.inputError : styles.input}
        />
        {errors.claimant_name ? <div style={styles.fieldError}>{errors.claimant_name}</div> : null}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Corporate title<span style={styles.required}>*</span>
        </label>
        <input
          name="claimant_title"
          type="text"
          value={form.claimant_title}
          onChange={handleChange}
          style={errors.claimant_title ? styles.inputError : styles.input}
          placeholder="e.g. VP of Marketing, Franchise Relations Manager"
        />
        {errors.claimant_title ? <div style={styles.fieldError}>{errors.claimant_title}</div> : null}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Company email<span style={styles.required}>*</span>
        </label>
        <input
          name="claimant_email"
          type="email"
          autoComplete="email"
          value={form.claimant_email}
          onChange={handleChange}
          style={errors.claimant_email ? styles.inputError : styles.input}
          placeholder="you@yourcompany.com"
        />
        {errors.claimant_email ? <div style={styles.fieldError}>{errors.claimant_email}</div> : null}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Phone</label>
        <input
          name="claimant_phone"
          type="tel"
          autoComplete="tel"
          value={form.claimant_phone}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Company website</label>
        <input
          name="company_website"
          type="url"
          value={form.company_website}
          onChange={handleChange}
          style={styles.input}
          placeholder="https://"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Your relationship to this brand<span style={styles.required}>*</span>
        </label>
        <select
          name="relationship_to_brand"
          value={form.relationship_to_brand}
          onChange={handleChange}
          style={errors.relationship_to_brand ? styles.selectError : styles.select}
        >
          <option value="">Select…</option>
          {RELATIONSHIP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {errors.relationship_to_brand ? <div style={styles.fieldError}>{errors.relationship_to_brand}</div> : null}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Message / notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          style={styles.textarea}
          placeholder="Anything you'd like us to know."
        />
      </div>

      <div style={styles.checkRow}>
        <input
          type="checkbox"
          name="authorization_confirmed"
          checked={form.authorization_confirmed}
          onChange={handleChange}
          style={styles.checkbox}
        />
        <span style={styles.checkLabel}>
          I confirm I am authorized to contact Menuply about this franchise or brand.
        </span>
      </div>
      {errors.authorization_confirmed ? (
        <div style={{ ...styles.fieldError, marginTop: -10, marginBottom: 12 }}>{errors.authorization_confirmed}</div>
      ) : null}

      <button type="submit" style={styles.submitBtn(submitting)} disabled={submitting}>
        {submitting ? "Sending…" : "Send Contact Request"}
      </button>
    </form>
  );
}

export default function FranchisesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [franchises, setFranchises] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 24 });
  const [loading, setLoading] = useState(true);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const contactRef = useRef(null);
  const debounceTimer = useRef(null);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 320);
  }

  const fetchFranchises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 24 });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`${API}/franchises?${params}`);
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        setFranchises(data.franchises || []);
        setPagination(data.pagination || { total: 0, limit: 24 });
      }
    } catch {
      /* silently degrade */
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchFranchises();
  }, [fetchFranchises]);

  function handleContactClick(franchise) {
    setSelectedFranchise(franchise);
    setShowNewRequest(false);
    setTimeout(() => contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function handleNewRequest() {
    setSelectedFranchise(null);
    setShowNewRequest(true);
    setTimeout(() => contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <BrandLogo height={42} radius={12} matchPageBackground={false} linkStyle={{ marginBottom: 16 }} />
        <div style={styles.heroEyebrow}>Franchise &amp; Corporate Brands</div>
        <h1 style={styles.heroTitle}>Franchise Headquarters and Corporate Brand Contacts</h1>
        <p style={styles.heroBody}>
          Menuply maintains franchise and restaurant information to help diners find accurate menus and restaurant details. If you represent a franchise headquarters or corporate brand, contact Menuply so we can keep your information accurate and route your request for manual review.
        </p>
        <p style={styles.heroNote}>
          Franchise location and pricing information is handled by market and shown to diners only when relevant to their selected location.
        </p>
      </div>

      <div style={styles.shell}>
        <div style={styles.searchRow}>
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search franchise brands…"
            style={styles.searchInput}
            aria-label="Search franchise brands"
          />
        </div>

        <div style={styles.sectionLabel}>
          {loading ? "Loading…" : `${pagination.total} brand${pagination.total === 1 ? "" : "s"} on Menuply`}
        </div>

        {loading ? (
          <div style={styles.loadingText}>Loading franchise directory…</div>
        ) : (
          <>
            <div style={styles.grid}>
              {franchises.map((f) => {
                const domain = extractDomain(f.website_url);
                return (
                  <div key={f.id} style={styles.card}>
                    <div style={styles.cardName}>{f.name}</div>
                    {domain ? (
                      <div style={styles.cardWebsite}>{domain}</div>
                    ) : null}
                    <button
                      type="button"
                      style={styles.contactBtn}
                      onClick={() => handleContactClick(f)}
                    >
                      Contact Menuply About This Franchise
                    </button>
                  </div>
                );
              })}
            </div>

            {franchises.length === 0 && !loading ? (
              <div style={styles.notFoundNote}>
                <p style={styles.notFoundText}>
                  No brands matched your search.{" "}
                  <button type="button" style={styles.textBtn} onClick={handleNewRequest}>
                    Contact Menuply about your brand.
                  </button>
                </p>
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div style={styles.paginationRow}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    style={styles.pageBtn(p === page)}
                    onClick={() => setPage(p)}
                    disabled={p === page}
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}

        <div style={styles.notFoundNote}>
          <p style={styles.notFoundText}>
            Don't see your brand?{" "}
            <button type="button" style={styles.textBtn} onClick={handleNewRequest}>
              Contact Menuply directly
            </button>{" "}
            and we'll route your request for manual review.
          </p>
        </div>

        <div style={styles.divider} />

        <div ref={contactRef} style={styles.contactSection}>
          {selectedFranchise ? (
            <>
              <div style={styles.formTitle}>Contact Menuply: {selectedFranchise.name}</div>
              <p style={styles.formSubtitle}>
                This contact request goes to Menuply for manual review. We'll follow up at the email you provide.
              </p>
              <ContactForm
                key={selectedFranchise.id}
                preselected={selectedFranchise}
              />
            </>
          ) : showNewRequest ? (
            <>
              <div style={styles.formTitle}>Contact Menuply About Your Brand</div>
              <p style={styles.formSubtitle}>
                If your brand isn't listed, send us a message and we'll route your request for manual review.
              </p>
              <ContactForm key="new" preselected={null} />
            </>
          ) : (
            <>
              <div style={styles.formTitle}>Contact Menuply About Your Franchise</div>
              <p style={styles.formSubtitle}>
                Select a brand above to send a message, or contact Menuply directly if your brand isn't listed. All requests are reviewed manually.
              </p>
              <div style={styles.defaultPrompt}>
                Select a brand above or{" "}
                <button type="button" style={styles.textBtn} onClick={handleNewRequest}>
                  contact Menuply directly
                </button>.
              </div>
            </>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
