/**
 * Phone-camera entry for https://menuply.com/d/:token
 * Served by the SPA (not proxied through Railway) so a backend outage
 * cannot produce a browser "site can't be reached" on scan.
 * Resolves personal → /connect/d/:token; Meet Me Here → /invite/:token.
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { fetchPublicDinerQr, resolveDinerQrScan } from "../../lib/consumerApi.js";

function pathFromLandingUrl(landingUrl, token) {
  const raw = String(landingUrl || "").trim();
  if (!raw) return `/connect/d/${encodeURIComponent(String(token || ""))}`;
  try {
    const u = new URL(raw, "https://menuply.com");
    const host = u.hostname.toLowerCase();
    if (
      host === "menuply.com" ||
      host === "www.menuply.com" ||
      host === "localhost" ||
      host === "127.0.0.1"
    ) {
      return `${u.pathname}${u.search}${u.hash}` || `/connect/d/${encodeURIComponent(String(token || ""))}`;
    }
  } catch {
    // fall through
  }
  return null;
}

export default function DinerQrScanRedirectPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const t = String(token || "").trim();
    if (!t) {
      setError("Missing QR token");
      return undefined;
    }

    (async () => {
      try {
        const data = await resolveDinerQrScan(t);
        if (cancelled) return;
        const landing = data?.landing_url || data?.connect_landing_url || "";
        const path = pathFromLandingUrl(landing, t);
        if (path) {
          navigate(path, { replace: true });
          return;
        }
        if (landing) {
          window.location.replace(landing);
          return;
        }
        navigate(`/connect/d/${encodeURIComponent(t)}`, { replace: true });
      } catch (err) {
        if (cancelled) return;
        // Personal QR public projection still works when /d JSON is down.
        try {
          await fetchPublicDinerQr(t);
          if (cancelled) return;
          navigate(`/connect/d/${encodeURIComponent(t)}`, { replace: true });
          return;
        } catch {
          setError(err?.message || "This QR is unavailable right now");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <>
      <StickyPageHeader title="Opening Menuply" />
      <div style={styles.page}>
        {error ? (
          <>
            <p style={styles.error} role="alert">
              {error}
            </p>
            <p style={styles.muted}>
              Try again in a moment, or open Menuply and ask the diner to share a fresh link.
            </p>
            <p style={styles.back}>
              <Link to="/" style={styles.link}>
                ← Menuply home
              </Link>
            </p>
          </>
        ) : (
          <p style={styles.muted}>Opening your connection…</p>
        )}
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "16px 16px 96px",
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  },
  muted: { color: "#64748b", fontSize: 14, lineHeight: 1.45 },
  error: { color: "#b91c1c", fontSize: 14, fontWeight: 600 },
  back: { marginTop: 18 },
  link: { color: "#166534", fontWeight: 700, textDecoration: "none" },
};
