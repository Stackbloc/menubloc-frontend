/**
 * Public distributor profile — /distributors/:slug
 * Layout mirrors restaurant public profile: hero identity block, claim invite,
 * About Us + Founded, Updates. No photos / deals / favorite menu items.
 * Canonical identity is UUID from API; slug is presentation only.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { fetchPublicDistributor, toConsumerErrorMessage } from "../lib/api.js";
import { formatWebsiteHostLabel } from "../lib/formatWebsiteHostLabel.js";
import { buildGoogleMapsDirectionsUrl } from "../lib/catalogMenuUtils.js";
import { formatAddressQuery, normalizeDisplayAddress } from "../lib/displayAddress.js";
import ProfileAboutFounded from "../components/restaurant/publicProfile/ProfileAboutFounded.jsx";
import ProfileUpdates from "../components/restaurant/publicProfile/ProfileUpdates.jsx";
import {
  LogoMark,
  PROFILE_CONTENT_MAX,
  PROFILE_INK,
  PROFILE_MUTED,
  PROFILE_PAGE_BG,
  profileCardBorderVar,
  profileCardShadowVar,
  profileAccentVar,
} from "../components/restaurant/publicProfile/profilePrimitives.jsx";

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

function useIsMobile(breakpoint = 720) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

export default function DistributorPublicPage() {
  const { slug } = useParams();
  const isMobile = useIsMobile();
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
      `${name} on Menuply — food distributor profile.`;
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
        <main style={styles.shellMain}>
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
        <main style={styles.shellMain}>
          <h1 style={styles.plainTitle}>Distributor not found</h1>
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
        <main style={styles.shellMain}>
          <h1 style={styles.plainTitle}>Something went wrong</h1>
          <p style={styles.muted}>{error}</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  const d = distributor;
  const claimStatus = String(d.profile_claim_status || "UNCLAIMED").toUpperCase();
  const { streetAddr, cityLine, hasAddress } = normalizeDisplayAddress({
    address_line1: d.address_line1,
    address_line2: d.address_line2,
    city: d.city,
    state: d.state,
    postal_code: d.postal_code,
  });
  const mapsHref = hasAddress
    ? buildGoogleMapsDirectionsUrl(formatAddressQuery({ streetAddr, cityLine }))
    : "";
  const website = d.website_url || "";
  const websiteLabel = formatWebsiteHostLabel(website);
  const phone = d.phone || "";
  const callHref = phone ? `tel:${String(phone).replace(/[^\d+]/g, "")}` : "";
  const companyEmail = d.email || "";
  const mailHref = companyEmail ? `mailto:${companyEmail}` : "";
  const aboutText = d.description || d.short_note || "";
  const foundedText = d.founded_year != null ? String(d.founded_year) : "";
  const updates = Array.isArray(d.profile_updates) ? d.profile_updates : [];
  const showClaimInvites = Boolean(d.show_claim_cta);
  const ink = "#fafaf9";
  const muted = "rgba(250,250,249,0.88)";
  const linkColor = "rgba(250,250,249,0.92)";
  const hasHeroContact = Boolean(phone || website || companyEmail);

  return (
    <div style={styles.page} data-testid="distributor-public-profile">
      <StickyPageHeader />
      <header
        aria-label={d.display_name}
        data-testid="profile-hero-placeholder"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          minHeight: isMobile ? 220 : 280,
          background:
            "linear-gradient(160deg, #052e16 0%, #14532d 38%, #292524 100%)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(250,250,249,0.18), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(28,25,23,0.2), transparent 50%)",
          }}
        />
        <div
          style={{
            position: "relative",
            padding: isMobile ? "20px 16px 18px" : "28px 28px 24px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              maxWidth: PROFILE_CONTENT_MAX,
              margin: "0 auto",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                minWidth: 0,
              }}
            >
              <LogoMark
                name={d.display_name}
                logoUrl={d.has_logo ? d.logo_url : null}
                onPhoto
              />
              <div style={{ flex: 1, minWidth: 0 }} data-testid="distributor-identity-block">
                <h1
                  style={{
                    margin: 0,
                    fontSize: isMobile ? 24 : 32,
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.2,
                    color: ink,
                  }}
                >
                  {d.display_name}
                </h1>
                <div
                  data-testid="distributor-type-label"
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: muted,
                    textTransform: "uppercase",
                  }}
                >
                  Food Distributor
                </div>

                {hasAddress ? (
                  mapsHref ? (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="profile-hero-maps-address"
                      style={{
                        margin: "10px 0 0",
                        display: "block",
                        fontSize: 14,
                        lineHeight: 1.4,
                        color: muted,
                        textDecoration: "none",
                        fontStyle: "normal",
                      }}
                    >
                      {streetAddr ? <div>{streetAddr}</div> : null}
                      {cityLine ? <div>{cityLine}</div> : null}
                    </a>
                  ) : (
                    <address
                      data-testid="profile-hero-maps-address"
                      style={{
                        margin: "10px 0 0",
                        fontSize: 14,
                        lineHeight: 1.4,
                        color: muted,
                        fontStyle: "normal",
                      }}
                    >
                      {streetAddr ? <div>{streetAddr}</div> : null}
                      {cityLine ? <div>{cityLine}</div> : null}
                    </address>
                  )
                ) : null}

                {hasHeroContact ? (
                  <div
                    data-testid="profile-hero-contact"
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      fontSize: 14,
                      lineHeight: 1.4,
                      color: muted,
                    }}
                  >
                    {phone ? (
                      <a
                        href={callHref}
                        data-testid="profile-hero-phone"
                        style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
                      >
                        {phone}
                      </a>
                    ) : null}
                    {companyEmail ? (
                      <a
                        href={mailHref}
                        data-testid="profile-hero-email"
                        style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
                      >
                        {companyEmail}
                      </a>
                    ) : null}
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="profile-hero-website"
                        style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
                      >
                        {websiteLabel} ↗
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: PROFILE_CONTENT_MAX,
          margin: "0 auto",
          padding: isMobile ? "16px 16px 96px" : "24px 28px 96px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Reserved for future distributor-offer module — intentionally empty */}
        <div
          data-distributor-offer-slot="true"
          aria-hidden="true"
          style={{ display: "none" }}
        />

        {showClaimInvites ? (
          <section
            data-testid="distributor-claim-panel"
            style={{
              marginBottom: 20,
              padding: "16px 16px",
              borderRadius: 14,
              border: `1px solid ${profileCardBorderVar}`,
              background: "#fffbeb",
              boxShadow: profileCardShadowVar,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: PROFILE_INK,
                letterSpacing: "-0.02em",
              }}
            >
              Is this your company?
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: PROFILE_MUTED,
                lineHeight: 1.5,
              }}
            >
              Menuply is a new platform dedicated to serving the restaurant industry
              and the diners they serve. Distributors play a critical role in that
              ecosystem.
            </p>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: PROFILE_MUTED,
                lineHeight: 1.5,
              }}
            >
              Claim your free distributor profile to establish your presence on
              Menuply and connect with restaurants that have joined the platform.
            </p>
            <Link
              to={`/distributors/${d.slug}/claim`}
              data-testid="distributor-claim-cta"
              style={{
                display: "inline-block",
                marginTop: 12,
                fontSize: 14,
                fontWeight: 800,
                color: profileAccentVar,
                textDecoration: "none",
              }}
            >
              Claim this Profile →
            </Link>
            {claimStatus === "CLAIM_PENDING" ? (
              <p style={{ margin: "10px 0 0", fontSize: 13, color: PROFILE_MUTED }}>
                A claim is currently under review for this profile.
              </p>
            ) : null}
          </section>
        ) : null}

        <ProfileAboutFounded
          aboutText={aboutText}
          foundedText={foundedText}
          name={d.display_name}
          isMobile={isMobile}
          showClaimInvites={showClaimInvites}
          showPhotos={false}
          aboutBlankMessage="Tell restaurants about this distributor."
          foundedBlankMessage="Add the year founded."
        />

        {(Array.isArray(d.product_categories) && d.product_categories.length) ||
        (Array.isArray(d.geographic_markets) && d.geographic_markets.length) ||
        d.service_area_note ? (
          <section
            data-testid="distributor-markets-categories"
            style={{
              marginBottom: 20,
              padding: "16px 16px",
              borderRadius: 14,
              border: `1px solid ${profileCardBorderVar}`,
              background: "#fff",
              boxShadow: profileCardShadowVar,
            }}
          >
            {Array.isArray(d.product_categories) && d.product_categories.length ? (
              <div style={{ marginBottom: d.geographic_markets?.length || d.service_area_note ? 12 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: PROFILE_MUTED, letterSpacing: 0.4, textTransform: "uppercase" }}>
                  Categories
                </div>
                <div style={{ marginTop: 6, fontSize: 14, color: PROFILE_INK, lineHeight: 1.45 }}>
                  {d.product_categories.join(" · ")}
                </div>
              </div>
            ) : null}
            {(Array.isArray(d.geographic_markets) && d.geographic_markets.length) || d.service_area_note ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: PROFILE_MUTED, letterSpacing: 0.4, textTransform: "uppercase" }}>
                  Markets served
                </div>
                <div style={{ marginTop: 6, fontSize: 14, color: PROFILE_INK, lineHeight: 1.45 }}>
                  {Array.isArray(d.geographic_markets) && d.geographic_markets.length
                    ? d.geographic_markets.join(" · ")
                    : d.service_area_note}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <ProfileUpdates
          updates={updates}
          isMobile={isMobile}
          showClaimInvites={showClaimInvites}
        />

        {/* Reserved for future Distributor → Restaurants relationship module */}
        <div
          data-distributor-connect-slot="true"
          aria-hidden="true"
          style={{ display: "none" }}
        />

        {d.is_claimed && !d.show_claim_cta ? (
          <section
            style={{
              marginBottom: 28,
              padding: "14px 16px",
              borderRadius: 14,
              border: `1px solid ${profileCardBorderVar}`,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: PROFILE_INK,
                marginBottom: 8,
              }}
            >
              Menuply
            </div>
            {d.is_verified ? (
              <p style={{ margin: 0, fontSize: 14, color: PROFILE_MUTED, lineHeight: 1.5 }}>
                ✓ Verified Distributor on Menuply.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: PROFILE_MUTED, lineHeight: 1.5 }}>
                This profile has been claimed on Menuply.
              </p>
            )}
            <div style={{ marginTop: 12 }}>
              <Link to="/distributor/login" style={styles.secondaryCta}>
                Distributor sign in
              </Link>
            </div>
          </section>
        ) : null}
      </main>
      <BottomNav />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: PROFILE_PAGE_BG,
    color: PROFILE_INK,
    fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
  },
  shellMain: {
    maxWidth: PROFILE_CONTENT_MAX,
    margin: "0 auto",
    padding: "24px 20px 96px",
  },
  plainTitle: {
    margin: "0 0 12px",
    fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  muted: {
    color: PROFILE_MUTED,
    fontSize: 15,
    lineHeight: 1.6,
  },
  textLink: {
    color: "#166534",
    fontWeight: 700,
    textDecoration: "none",
  },
  secondaryCta: {
    display: "inline-block",
    background: "#fff",
    color: PROFILE_INK,
    fontWeight: 800,
    padding: "10px 14px",
    borderRadius: 12,
    textDecoration: "none",
    fontSize: 14,
    border: `1px solid ${profileCardBorderVar}`,
  },
};
