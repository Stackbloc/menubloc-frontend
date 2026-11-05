/**
 * /advertise/renewal?token=… — opened from the 2-day renewal notice email.
 * Shows what renews, when and for how much, with Keep / Cancel. The backend decides
 * whether a change is still allowed (not after the charge, which starts 2 hours early).
 */
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo.jsx";
import { fetchAdRenewal, formatUsd, setAdRenewal, termLabel } from "../../lib/adMarketplaceApi.js";
import "../../styles/advertise.css";

function longDate(iso, timeZone) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone });
  } catch {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
}

export default function AdRenewalPage() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [renewal, setRenewal] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!token) {
      setError("This link isn't valid.");
      return undefined;
    }
    fetchAdRenewal(token)
      .then((res) => alive && setRenewal(res.renewal))
      .catch((err) => alive && setError(err?.message || "We couldn't open this renewal."));
    return () => {
      alive = false;
    };
  }, [token]);

  async function change(autoRenew) {
    setBusy(true);
    setError("");
    try {
      const res = await setAdRenewal(token, autoRenew);
      setRenewal(res.renewal);
      setChanged(true);
    } catch (err) {
      setError(err?.message || "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const ends = renewal ? longDate(renewal.ends_at, renewal.timezone) : "";
  const where = renewal ? `${renewal.spot.name} · ${renewal.cluster.name}` : "";

  return (
    <div className="ad-page">
      <header className="ad-top">
        <div className="ad-wrap">
          <BrandLogo height={30} pageColor="#ffffff" />
          <span className="ad-spacer" />
          {renewal?.restaurant ? <span className="ad-toplink">{renewal.restaurant}</span> : null}
        </div>
      </header>

      <main className="ad-wrap">
        <h1 className="ad-h1">Your ad renewal</h1>
        {!renewal && !error ? <div className="ad-state">Loading…</div> : null}
        {error ? <div className="ad-error" role="alert">{error}</div> : null}

        {renewal ? (
          <section className="ad-renewal" aria-label="Renewal">
            <p className="ad-sub">{where}</p>
            {renewal.renews ? (
              <p>
                Renews on <strong>{ends}</strong> for another {termLabel(renewal.term.period, renewal.term.count)}.
                We'll charge <strong>{formatUsd(renewal.price_cents)}</strong> to the card you used before.
              </p>
            ) : renewal.auto_renew && renewal.price_cents == null ? (
              <p>
                Ends on <strong>{ends}</strong>. It won't renew automatically this time. Nothing will be charged.
              </p>
            ) : (
              <p>
                Ends on <strong>{ends}</strong> and won't renew. Nothing will be charged.
              </p>
            )}
            {changed ? (
              <div className="ad-notice" role="status">
                {renewal.renews ? "Done. Your ad will renew." : "Done. Your ad won't renew."}
              </div>
            ) : null}
            {renewal.can_change ? (
              <div className="ad-actions">
                {renewal.auto_renew ? (
                  <button type="button" className="ad-pill" disabled={busy} onClick={() => change(false)}>
                    {busy ? "Saving…" : "Cancel renewal"}
                  </button>
                ) : (
                  <button type="button" className="ad-pill ad-pill-green" disabled={busy} onClick={() => change(true)}>
                    {busy ? "Saving…" : "Keep it running"}
                  </button>
                )}
              </div>
            ) : (
              <p className="ad-fine">This renewal can't be changed anymore. Reply to the email and we'll help.</p>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
