/**
 * Public distributor profile — /distributors/:slug
 * Canonical identity is UUID from API; slug is presentation only.
 * No restaurant relationship lists. No fake Connect/Offer actions.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { fetchPublicDistributor, toConsumerErrorMessage } from "../lib/api.js";

const CANONICAL_BASE = "https://menuply.com";

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOg(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export default function DistributorPublicPage() {
  const { slug } = useParams();
  const [distributor, setDistributor] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setDistributor(null);
    fetchPublicDistributor(slug)
      .then((data) => {
        if (cancelled) return;
        setDistributor(data?.distributor || null);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = String(err?.message || "");
        if (/not found/i.test(msg)) {
          setError("not_found");
        } else {
          setError(toConsumerErrorMessage(err, "Unable to load distributor profile."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!distributor) return;
    const name = distributor.display_name;
    const desc =
      distributor.description ||
      `${name} on Menuply — foodservice distributor profile.`;
    const canonical = `${CANONICAL_BASE}/distributors/${distributor.slug}`;

    document.title = `${name} | Menuply`;
    setMeta("description", desc);
    setOg("og:title", `${name} | Menuply`);
    setOg("og:description", desc);
    setOg("og:url", canonical);
    setOg("og:type", "website");

    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name,
      url: canonical,
      ...(distributor.website_url ? { sameAs: [distributor.website_url] } : {}),
      ...(distributor.description ? { description: distributor.description } : {}),
      ...(distributor.logo_url ? { logo: distributor.logo_url } : {}),
    };
    let script = document.getElementById("distributor-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.id = "distributor-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }, [distributor]);

  if (loading) {
    return (
      <div style={styles.page}>
        <StickyPageHeader />
        <main style={styles.main}>
          <p style={styles.muted}>Loading…</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error === "not_found" || (!distributor && !error)) {
    return (
      <div style={styles.page}>
        <StickyPageHeader />
        <main style={styles.main}>
          <h1 style={styles.title}>Distributor not found</h1>
          <p style={styles.muted}>
            This distributor profile is not available on Menuply.
          </p>
          <Link to="/" style={styles.textLink}>
            Back to Menuply
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <StickyPageHeader />
        <main style={styles.main}>
          <h1 style={styles.title}>Something went wrong</h1>
          <p style={styles.muted}>{error}</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  const d = distributor;
  const claimStatus = String(d.profile_claim_status || "UNCLAIMED").toUpperCase();
  const statusBadge =
    claimStatus === "VERIFIED"
      ? { label: "Verified", style: styles.verifiedBadge }
      : claimStatus === "CLAIMED"
        ? { label: "Claimed", style: styles.claimedBadge }
        : claimStatus === "CLAIM_PENDING"
          ? { label: "Claim Pending", style: styles.pendingBadge }
          : { label: "Unclaimed", style: styles.unclaimedBadge };

  const cityStateZip = [
    [d.city, d.state].filter(Boolean).join(", "),
    d.postal_code,
  ]
    .filter(Boolean)
    .join(" ");
  const hasAddress = Boolean(d.address_line1 || cityStateZip);

  const infoRows = [
    d.category_label
      ? { label: "Distributor type", value: d.category_label }
      : null,
    d.website_url
      ? { label: "Website", value: d.website_url, href: d.website_url }
      : null,
    d.phone
      ? {
          label: "Phone",
          value: d.phone,
          href: `tel:${d.phone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    d.email
      ? { label: "Email", value: d.email, href: `mailto:${d.email}` }
      : null,
    d.has_service_area
      ? { label: "Service area", value: d.service_area_note }
      : null,
  ].filter(Boolean);

  const aboutText = d.description || d.short_note || null;

  return (
    <div style={styles.page}>
      <StickyPageHeader />
      <main style={styles.main}>
        <header style={styles.hero}>
          {d.has_logo && d.logo_url ? (
            <img src={d.logo_url} alt="" style={styles.logo} />
          ) : (
            <div style={styles.logoFallback} aria-hidden="true">
              {String(d.display_name || "D")
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <p style={styles.eyebrow}>{d.category_label || "Foodservice Distributor"}</p>
          <h1 style={styles.title}>{d.display_name}</h1>
          <div style={statusBadge.style}>{statusBadge.label}</div>

          {hasAddress ? (
            <address style={styles.addressBlock}>
              {d.address_line1 ? <div>{d.address_line1}</div> : null}
              {cityStateZip ? <div>{cityStateZip}</div> : null}
            </address>
          ) : null}

          {d.has_website ? (
            <a
              href={d.website_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.primaryCta, marginTop: 16, display: "inline-block" }}
            >
              Visit Website
            </a>
          ) : null}
        </header>

        {/* Reserved for future distributor-offer module — intentionally empty */}
        <div
          data-distributor-offer-slot="true"
          aria-hidden="true"
          style={{ display: "none" }}
        />

        {aboutText ? (
          <Section title="About">
            <p style={styles.body}>{aboutText}</p>
          </Section>
        ) : null}

        {infoRows.length ? (
          <Section title="Company information">
            <dl style={styles.dl}>
              {infoRows.map((row) => (
                <div key={row.label} style={styles.dlRow}>
                  <dt style={styles.dt}>{row.label}</dt>
                  <dd style={styles.dd}>
                    {row.href ? (
                      <a
                        href={row.href}
                        target={row.href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          row.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        style={styles.textLink}
                      >
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        ) : null}

        {d.show_claim_cta ? (
          <section style={{ ...styles.section, ...styles.claimPanel }}>
            <h2 style={styles.sectionTitle}>Is this your company?</h2>
            <p style={styles.body}>
              Menuply is a new platform dedicated to serving the restaurant industry
              and the diners they serve. Distributors play a critical role in that
              ecosystem.
            </p>
            <p style={{ ...styles.body, marginTop: 12 }}>
              Claim your free distributor profile to establish your presence on
              Menuply and connect with restaurants that have joined the platform.
            </p>
            <div style={styles.ctaRow}>
              <Link
                to={`/distributors/${d.slug}/claim`}
                style={styles.claimCta}
              >
                Claim this Profile
              </Link>
            </div>
            {claimStatus === "CLAIM_PENDING" ? (
              <p style={{ ...styles.muted, marginTop: 12 }}>
                A claim is currently under review for this profile.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Reserved for future Distributor → Restaurants relationship module */}
        <div data-distributor-connect-slot="true" aria-hidden="true" style={{ display: "none" }} />

        {d.is_claimed && !d.show_claim_cta ? (
          <Section title="Menuply">
            {d.is_verified ? (
              <p style={styles.body}>✓ Verified Distributor on Menuply.</p>
            ) : (
              <p style={styles.body}>This profile has been claimed on Menuply.</p>
            )}
            <div style={styles.ctaRow}>
              <Link to="/distributor/login" style={styles.secondaryCta}>
                Distributor sign in
              </Link>
            </div>
          </Section>
        ) : null}
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
    maxWidth: 720,
    margin: "0 auto",
    padding: "24px 20px 96px",
  },
  hero: {
    marginBottom: 28,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "contain",
    borderRadius: 14,
    background: "#fff",
    border: "1px solid rgba(15,23,42,0.08)",
    marginBottom: 14,
  },
  logoFallback: {
    width: 72,
    height: 72,
    borderRadius: 14,
    background: "linear-gradient(145deg, #166534, #3f6212)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 28,
    marginBottom: 14,
  },
  eyebrow: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#3f6212",
  },
  title: {
    margin: "0 0 12px",
    fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
  },
  addressBlock: {
    marginTop: 14,
    fontStyle: "normal",
    fontSize: 15,
    lineHeight: 1.5,
    color: "#334155",
    fontWeight: 600,
  },
  section: {
    marginBottom: 28,
    padding: "20px 18px",
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(15,23,42,0.08)",
    borderRadius: 18,
  },
  claimPanel: {
    background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 70%)",
    border: "1px solid rgba(21, 128, 61, 0.22)",
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: 15,
    fontWeight: 800,
  },
  body: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.65,
    color: "#334155",
  },
  muted: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.6,
  },
  dl: { margin: 0 },
  dlRow: { marginBottom: 12 },
  dt: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 4,
  },
  dd: { margin: 0, fontSize: 15, fontWeight: 600 },
  primaryCta: {
    display: "inline-block",
    background: "#15803d",
    color: "#fff",
    fontWeight: 800,
    padding: "11px 16px",
    borderRadius: 12,
    textDecoration: "none",
    fontSize: 14,
  },
  claimCta: {
    display: "inline-block",
    background: "#15803d",
    color: "#fff",
    fontWeight: 800,
    padding: "14px 20px",
    borderRadius: 12,
    textDecoration: "none",
    fontSize: 16,
    boxShadow: "0 10px 24px rgba(21, 128, 61, 0.22)",
  },
  secondaryCta: {
    display: "inline-block",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    padding: "11px 16px",
    borderRadius: 12,
    textDecoration: "none",
    fontSize: 14,
    border: "1px solid rgba(15,23,42,0.12)",
  },
  ctaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  textLink: {
    color: "#15803d",
    fontWeight: 700,
    textDecoration: "none",
  },
  verifiedBadge: {
    display: "inline-block",
    marginTop: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#ecfdf5",
    color: "#047857",
    fontWeight: 800,
    fontSize: 13,
  },
  unclaimedBadge: {
    display: "inline-block",
    marginTop: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: 800,
    fontSize: 13,
  },
  pendingBadge: {
    display: "inline-block",
    marginTop: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#fff7ed",
    color: "#c2410c",
    fontWeight: 800,
    fontSize: 13,
  },
  claimedBadge: {
    display: "inline-block",
    marginTop: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 800,
    fontSize: 13,
  },
};
