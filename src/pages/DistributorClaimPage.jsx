import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import { fetchPublicDistributor } from "../lib/api.js";
import {
  createDistributorProfileClaim,
  getOperatorSession,
} from "../lib/operatorApi.js";
import { useOperator } from "../context/OperatorContext.jsx";

/**
 * Claim a controlled public distributor profile.
 * Uses existing operator auth + email verification — not a separate auth system.
 */
export default function DistributorClaimPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isEmailVerified, loading: authLoading } = useOperator();
  const [distributor, setDistributor] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [title, setTitle] = useState("");
  const [attestation, setAttestation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchPublicDistributor(slug)
      .then((data) => {
        if (!cancelled) setDistributor(data?.distributor || data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Distributor not found");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      // Refresh session so email_verified is current before POST.
      await getOperatorSession().catch(() => null);
      const result = await createDistributorProfileClaim({
        slug,
        title: title.trim() || undefined,
        attestation_note: attestation.trim() || undefined,
      });
      setSuccess(result);
    } catch (err) {
      setSubmitError(err.message || "Unable to submit claim");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div style={styles.page}>
        <StickyPageHeader />
        <main style={styles.main}>
          <h1 style={styles.title}>Claim profile</h1>
          <p style={styles.body}>{loadError}</p>
          <Link to="/" style={styles.link}>
            Back home
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!distributor) {
    return (
      <div style={styles.page}>
        <StickyPageHeader />
        <main style={styles.main}>
          <p style={styles.body}>Loading…</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!distributor.show_claim_cta) {
    return (
      <div style={styles.page}>
        <StickyPageHeader />
        <main style={styles.main}>
          <h1 style={styles.title}>{distributor.display_name}</h1>
          <p style={styles.body}>
            This profile is not currently available to claim.
          </p>
          <Link to={`/distributors/${distributor.slug}`} style={styles.link}>
            View public profile
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.page}>
        <StickyPageHeader />
        <main style={styles.main}>
          <h1 style={styles.title}>Claim submitted</h1>
          <p style={styles.body}>
            {success.message ||
              "Your claim is pending Menuply review. The profile stays Not yet claimed until approved."}
          </p>
          <div style={styles.ctaRow}>
            <Link to={`/distributors/${distributor.slug}`} style={styles.primaryCta}>
              Back to profile
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const loginRedirect = `/distributors/${slug}/claim`;

  return (
    <div style={styles.page}>
      <StickyPageHeader />
      <main style={styles.main}>
        <p style={styles.eyebrow}>Claim Menuply profile</p>
        <h1 style={styles.title}>{distributor.display_name}</h1>
        <p style={styles.body}>
          Confirm you represent this distributor. Claims require a verified
          Menuply business account and Menuply approval before the profile is
          marked claimed. Claiming does not auto-verify the profile.
        </p>

        {authLoading ? (
          <p style={styles.body}>Checking your account…</p>
        ) : !isAuthenticated ? (
          <div style={styles.panel}>
            <p style={styles.body}>
              Sign in with your Menuply business account to request a claim.
            </p>
            <Link
              to="/operator/login"
              state={{ nextPath: loginRedirect }}
              style={styles.primaryCta}
            >
              Operator sign in
            </Link>
          </div>
        ) : !isEmailVerified ? (
          <div style={styles.panel}>
            <p style={styles.body}>
              Verify your business email before claiming a distributor profile.
            </p>
            <Link to="/operator/my-account" style={styles.primaryCta}>
              Open My Account
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.panel}>
            <label style={styles.label}>
              Your title (optional)
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
                maxLength={120}
                placeholder="e.g. Regional Sales Manager"
              />
            </label>
            <label style={styles.label}>
              Attestation
              <textarea
                value={attestation}
                onChange={(e) => setAttestation(e.target.value)}
                style={styles.textarea}
                required
                maxLength={2000}
                rows={4}
                placeholder="I represent this distributor and am authorized to claim this Menuply profile."
              />
            </label>
            {submitError ? <p style={styles.error}>{submitError}</p> : null}
            <button type="submit" disabled={submitting} style={styles.primaryCta}>
              {submitting ? "Submitting…" : "Submit claim request"}
            </button>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate(`/distributors/${distributor.slug}`)}
            >
              Cancel
            </button>
          </form>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2f0 100%)",
    color: "#0f172a",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  main: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "24px 20px 96px",
  },
  eyebrow: {
    margin: 0,
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  title: {
    margin: "8px 0 12px",
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  body: {
    margin: "0 0 16px",
    fontSize: 16,
    lineHeight: 1.55,
    color: "#334155",
  },
  panel: {
    display: "grid",
    gap: 14,
    padding: 20,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e2e8f0",
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    fontFamily: "inherit",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    fontFamily: "inherit",
    resize: "vertical",
  },
  primaryCta: {
    display: "inline-block",
    textAlign: "center",
    padding: "12px 18px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    fontFamily: "inherit",
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  link: {
    color: "#15803d",
    fontWeight: 700,
  },
  error: {
    margin: 0,
    color: "#b91c1c",
    fontWeight: 600,
    fontSize: 14,
  },
  ctaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
};
