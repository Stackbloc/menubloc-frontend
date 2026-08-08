import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import {
  fetchPublicDistributor,
  submitPublicDistributorClaim,
} from "../lib/api.js";
import { attachDistributorProfileClaim } from "../lib/operatorApi.js";
import { useOperator } from "../context/OperatorContext.jsx";

const CLAIM_STORAGE_KEY = "menuply_distributor_claim_id";

/**
 * Public claim page — no auth required to load or submit.
 * Account creation / sign-in uses distributor-branded screens backed by the
 * same Menuply business account + email verification as restaurants.
 */
export default function DistributorClaimPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isEmailVerified,
    loading: authLoading,
    operator,
  } = useOperator();

  const [distributor, setDistributor] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);
  const [attachNotice, setAttachNotice] = useState("");
  const [attachError, setAttachError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPublicDistributor(slug)
      .then((data) => {
        if (!cancelled) setDistributor(data?.distributor || null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Distributor not found");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Prefill from signed-in business account when available (still not required).
  useEffect(() => {
    if (!operator) return;
    if (!fullName && operator.full_name) setFullName(String(operator.full_name));
    if (!businessEmail && operator.email) setBusinessEmail(String(operator.email));
  }, [operator]); // eslint-disable-line react-hooks/exhaustive-deps

  // After signup/verify/sign-in, link stored claim to the Menuply account.
  useEffect(() => {
    if (authLoading || !isAuthenticated || !isEmailVerified) return;
    const claimId = sessionStorage.getItem(CLAIM_STORAGE_KEY);
    if (!claimId) return;
    let cancelled = false;
    attachDistributorProfileClaim(claimId)
      .then((result) => {
        if (cancelled) return;
        sessionStorage.removeItem(CLAIM_STORAGE_KEY);
        setAttachNotice(
          result.message ||
            "Claim linked to your Menuply account and pending Menuply review."
        );
        setSuccess((prev) => prev || { claim: result.claim, needs_account: false });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.payload?.code === "claim_not_found" || err?.status === 404) {
          sessionStorage.removeItem(CLAIM_STORAGE_KEY);
        }
        setAttachError(err.message || "Unable to link claim to your account");
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, isEmailVerified]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const result = await submitPublicDistributorClaim(slug, {
        full_name: fullName.trim(),
        business_email: businessEmail.trim(),
        title: title.trim(),
        phone: phone.trim() || undefined,
      });
      if (result?.claim?.id) {
        sessionStorage.setItem(CLAIM_STORAGE_KEY, result.claim.id);
      }
      setSuccess(result);

      // If already signed in + verified, attach immediately.
      if (isAuthenticated && isEmailVerified && result?.claim?.id) {
        try {
          await attachDistributorProfileClaim(result.claim.id);
          sessionStorage.removeItem(CLAIM_STORAGE_KEY);
          setAttachNotice("Claim linked to your Menuply account and pending review.");
        } catch (attachErr) {
          setAttachError(attachErr.message || "Claim saved; finish account linking next.");
        }
      }
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
          <p style={styles.body}>This profile is not currently available to claim.</p>
          <Link to={`/distributors/${distributor.slug}`} style={styles.link}>
            View public profile
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const claimReturn = `/distributors/${distributor.slug}/claim`;
  const accountState = {
    nextPath: claimReturn,
    claimId: success?.claim?.id || sessionStorage.getItem(CLAIM_STORAGE_KEY),
    email: businessEmail.trim() || success?.claim?.claimant_business_email || undefined,
    full_name: fullName.trim() || undefined,
  };

  if (success) {
    const needsAccount = success.needs_account !== false && !(isAuthenticated && isEmailVerified);
    return (
      <div style={styles.page}>
        <StickyPageHeader />
        <main style={styles.main}>
          <h1 style={styles.title}>Claim submitted</h1>
          <p style={styles.body}>
            Your request to claim <strong>{distributor.display_name}</strong> is
            recorded. Menuply review is required before the profile is marked
            claimed. Verification is a separate step and is not automatic.
          </p>
          {attachNotice ? <p style={styles.ok}>{attachNotice}</p> : null}
          {attachError ? <p style={styles.error}>{attachError}</p> : null}

          {needsAccount ? (
            <div style={styles.panel}>
              <p style={styles.body}>
                Continue with a Menuply distributor account (same email
                verification used for restaurants) so we can finish linking your
                claim.
              </p>
              <Link
                to="/distributor/account/signup"
                state={accountState}
                style={styles.primaryCta}
              >
                Create distributor account
              </Link>
              <Link
                to="/distributor/account/login"
                state={accountState}
                style={styles.secondaryCta}
              >
                Already have a Menuply account? Sign in
              </Link>
            </div>
          ) : (
            <div style={styles.ctaRow}>
              <Link to={`/distributors/${distributor.slug}`} style={styles.primaryCta}>
                Back to profile
              </Link>
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <StickyPageHeader />
      <main style={styles.main}>
        <p style={styles.eyebrow}>Claim Menuply profile</p>
        <h1 style={styles.title}>Claim {distributor.display_name} on Menuply</h1>
        <p style={styles.body}>
          Are you authorized to represent {distributor.display_name}? Submit your
          details below. You do not need to sign in first.
        </p>

        <form onSubmit={handleSubmit} style={styles.panel}>
          <label style={styles.label}>
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
              required
              maxLength={120}
              autoComplete="name"
            />
          </label>
          <label style={styles.label}>
            Business email
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              style={styles.input}
              required
              maxLength={200}
              autoComplete="email"
            />
          </label>
          <label style={styles.label}>
            Job title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              required
              maxLength={120}
              placeholder="e.g. Regional Sales Manager"
            />
          </label>
          <label style={styles.label}>
            Phone <span style={styles.optional}>(optional)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              maxLength={40}
              autoComplete="tel"
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

        <p style={{ ...styles.body, marginTop: 18 }}>
          Already have a Menuply account?{" "}
          <Link
            to="/distributor/account/login"
            state={{ nextPath: claimReturn }}
            style={styles.link}
          >
            Sign in
          </Link>
        </p>
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
  optional: {
    fontWeight: 500,
    color: "#64748b",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    fontFamily: "inherit",
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
  secondaryCta: {
    display: "inline-block",
    textAlign: "center",
    padding: "12px 18px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 15,
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
  ok: {
    margin: "0 0 12px",
    color: "#047857",
    fontWeight: 700,
    fontSize: 14,
  },
  ctaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
};
