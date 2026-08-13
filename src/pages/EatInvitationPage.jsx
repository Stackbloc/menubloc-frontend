/**
 * Public Invite to Eat landing — view without login; respond requires auth.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import {
  fetchPublicEatInvitation,
  respondToEatInvitation,
} from "../lib/eatInvitationsApi.js";
import { restaurantPath } from "../lib/canonicalUrlCore.js";

function formatDateLabel(isoDate) {
  if (!isoDate) return "";
  try {
    const d = new Date(`${isoDate}T12:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function formatTimeLabel(time) {
  if (!time) return "";
  const parts = String(time).split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (!Number.isFinite(h)) return time;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function EatInvitationPage() {
  const { token } = useParams();
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [responded, setResponded] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchPublicEatInvitation(token)
      .then((data) => {
        if (cancelled) return;
        const inv = data?.invitation || null;
        if (!inv) throw new Error(data?.error || "Invitation not found");
        setInvitation(inv);
        setResponded(inv.my_response || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Invitation not found");
          setInvitation(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const restaurantHref = useMemo(() => {
    if (!invitation) return null;
    return (
      restaurantPath({
        slug: invitation.restaurant_slug,
        city: invitation.restaurant_city,
        state: invitation.restaurant_state,
      }) ||
      (invitation.restaurant_id
        ? `/restaurants/${encodeURIComponent(String(invitation.restaurant_id))}`
        : null)
    );
  }, [invitation]);

  async function handleRespond(status) {
    if (busy) return;
    if (!isAuthenticated) {
      const redirectTo = `${location.pathname}${location.search || ""}`;
      navigate("/account/login", { state: { redirectTo } });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await respondToEatInvitation(token, status);
      setResponded(data?.response?.status || status);
      if (data?.invitation) setInvitation((prev) => ({ ...prev, ...data.invitation }));
    } catch (err) {
      setError(err?.message || "Could not save your response");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-testid="eat-invitation-page"
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        padding: "24px 16px 80px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
          color: "#1c1917",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "#78716c" }}>
          INVITE TO EAT
        </div>

        {loading ? (
          <div style={{ marginTop: 16, fontSize: 14, color: "#78716c" }}>Loading invitation…</div>
        ) : null}

        {error && !invitation ? (
          <div role="alert" style={{ marginTop: 16, color: "#b91c1c", fontSize: 14 }}>
            {error}
          </div>
        ) : null}

        {invitation ? (
          <>
            <h1 style={{ margin: "10px 0 8px", fontSize: 24, lineHeight: 1.2 }}>
              {invitation.organizer_display_name || "A Menuply diner"} invited you to eat at{" "}
              {restaurantHref ? (
                <Link to={restaurantHref} style={{ color: "#166534" }}>
                  {invitation.restaurant_name || "a restaurant"}
                </Link>
              ) : (
                invitation.restaurant_name || "a restaurant"
              )}
              .
            </h1>

            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 12 }}>
              {formatDateLabel(invitation.scheduled_date)}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#44403c" }}>
              {formatTimeLabel(invitation.scheduled_time)}
            </div>

            {invitation.message ? (
              <blockquote
                style={{
                  margin: "16px 0 0",
                  padding: "12px 14px",
                  borderLeft: "3px solid #bbf7d0",
                  background: "#f0fdf4",
                  borderRadius: 8,
                  fontSize: 15,
                  lineHeight: 1.45,
                  color: "#292524",
                }}
              >
                “{invitation.message}”
              </blockquote>
            ) : null}

            {invitation.menu_item_name ? (
              <div style={{ marginTop: 16, fontSize: 14, color: "#44403c", lineHeight: 1.45 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>Recommended</div>
                {(invitation.organizer_display_name || "Someone")} recommends the{" "}
                <strong>{invitation.menu_item_name}</strong>
                {invitation.restaurant_name ? ` at ${invitation.restaurant_name}` : ""}.
              </div>
            ) : null}

            {invitation.is_organizer ? (
              <div style={{ marginTop: 18, fontSize: 13, color: "#57534e" }}>
                This is your invitation. Share the link with guests — they can Accept, Maybe, or
                Can’t Make It.
              </div>
            ) : (
              <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                {responded ? (
                  <div
                    data-testid="invite-response-saved"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#ecfdf5",
                      color: "#166534",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Your response:{" "}
                    {responded === "accepted"
                      ? "Accept"
                      : responded === "maybe"
                        ? "Maybe"
                        : "Can't Make It"}
                  </div>
                ) : null}
                {error ? (
                  <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                    {error}
                  </div>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    data-testid="invite-accept"
                    disabled={busy}
                    onClick={() => handleRespond("accepted")}
                    style={btnPrimary}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    data-testid="invite-maybe"
                    disabled={busy}
                    onClick={() => handleRespond("maybe")}
                    style={btnSecondary}
                  >
                    Maybe
                  </button>
                  <button
                    type="button"
                    data-testid="invite-decline"
                    disabled={busy}
                    onClick={() => handleRespond("declined")}
                    style={btnSecondary}
                  >
                    Can&apos;t Make It
                  </button>
                </div>
                {!isAuthenticated ? (
                  <div style={{ fontSize: 13, color: "#57534e" }}>
                    You can read this invitation without an account.{" "}
                    <Link
                      to="/account/login"
                      state={{
                        redirectTo: `${location.pathname}${location.search || ""}`,
                      }}
                      style={{ color: "#166534", fontWeight: 700 }}
                    >
                      Sign in
                    </Link>{" "}
                    to respond.
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

const btnPrimary = {
  height: 42,
  padding: "0 16px",
  borderRadius: 999,
  border: "none",
  background: "#166534",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const btnSecondary = {
  height: 42,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid #d6d3d1",
  background: "#fff",
  color: "#1c1917",
  fontWeight: 700,
  cursor: "pointer",
};
