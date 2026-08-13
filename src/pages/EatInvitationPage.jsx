/**
 * Public Invite to Eat landing — view without login; respond requires auth.
 * Invitation-first practical details (who/where/when/how) without forcing signup.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import {
  fetchPublicEatInvitation,
  respondToEatInvitation,
} from "../lib/eatInvitationsApi.js";
import { restaurantPath } from "../lib/canonicalUrlCore.js";
import { clusterPath } from "../lib/clusterUrl.js";
import {
  buildAddressLocalityLine,
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsUrlForRestaurant,
} from "../lib/catalogMenuUtils.js";
import { formatHoursRows } from "../components/restaurant/publicProfile/profilePrimitives.jsx";

function formatDateLabel(isoDate) {
  if (!isoDate) return "";
  const raw = String(isoDate).trim();
  const ymd = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || null;
  try {
    const d = ymd ? new Date(`${ymd}T12:00:00`) : new Date(raw);
    if (Number.isNaN(d.getTime())) return ymd || raw;
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return ymd || raw;
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

function responseLabel(status) {
  if (status === "accepted") return "Accepted";
  if (status === "maybe") return "Maybe";
  if (status === "declined") return "Can't Make It";
  return status || "";
}

function buildStreetAddress(invitation) {
  return [invitation?.restaurant_address_line1, invitation?.restaurant_address_line2]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
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
  const [authPrompt, setAuthPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setAuthPrompt(false);
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

  const menuHref = useMemo(() => {
    if (!restaurantHref) return null;
    return `${restaurantHref}/menu`;
  }, [restaurantHref]);

  const dishHref = useMemo(() => {
    if (!invitation?.menu_item_id) return null;
    return `/menu-items/${encodeURIComponent(String(invitation.menu_item_id))}`;
  }, [invitation]);

  const clusterHref = useMemo(() => {
    if (!invitation?.cluster_slug) return null;
    if (String(invitation.cluster_slug).includes("holding")) return null;
    return clusterPath({
      state: invitation.cluster_state,
      city: invitation.cluster_city,
      slug: invitation.cluster_slug,
    });
  }, [invitation]);

  const streetAddr = useMemo(() => buildStreetAddress(invitation), [invitation]);
  const cityLine = useMemo(
    () =>
      buildAddressLocalityLine(
        invitation?.restaurant_city,
        invitation?.restaurant_state,
        invitation?.restaurant_postal_code
      ),
    [invitation]
  );
  const mapsDestination = useMemo(() => {
    return [streetAddr, cityLine].filter(Boolean).join(", ");
  }, [streetAddr, cityLine]);
  const directionsUrl = useMemo(() => {
    if (!invitation) return "";
    const byCoords = buildGoogleMapsUrlForRestaurant({
      lat: invitation.restaurant_lat,
      lng: invitation.restaurant_lng,
      addressLine1: invitation.restaurant_address_line1,
      addressLine2: invitation.restaurant_address_line2,
      city: invitation.restaurant_city,
      state: invitation.restaurant_state,
      zip: invitation.restaurant_postal_code,
    });
    if (byCoords) return byCoords;
    return mapsDestination ? buildGoogleMapsDirectionsUrl(mapsDestination) : "";
  }, [invitation, mapsDestination]);
  const hoursRows = useMemo(
    () => formatHoursRows(invitation?.operating_hours || []),
    [invitation]
  );

  async function handleRespond(status) {
    if (busy) return;
    if (!isAuthenticated) {
      setAuthPrompt(true);
      return;
    }
    setBusy(true);
    setError("");
    setAuthPrompt(false);
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

  function goSignIn() {
    const redirectTo = `${location.pathname}${location.search || ""}`;
    navigate("/account/login", { state: { redirectTo } });
  }

  function goSignUp() {
    const redirectTo = `${location.pathname}${location.search || ""}`;
    navigate("/account/signup", { state: { redirectTo } });
  }

  const organizerName = invitation?.organizer_display_name || "A Menuply diner";
  const placeName = invitation?.restaurant_name || "a restaurant";
  const dateLabel = formatDateLabel(invitation?.scheduled_date);
  const timeLabel = formatTimeLabel(invitation?.scheduled_time);
  const phone = String(invitation?.restaurant_phone || "").trim();
  const logoUrl = String(invitation?.restaurant_logo_url || "").trim();

  return (
    <div
      data-testid="eat-invitation-page"
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        padding: "20px 14px 72px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: "20px 18px",
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
            {/* 1. Who invited */}
            <h1 style={{ margin: "10px 0 6px", fontSize: 26, lineHeight: 1.2, fontWeight: 800 }}>
              {invitation.is_organizer ? "Your invitation" : "You've Been Invited to Eat"}
            </h1>
            {!invitation.is_organizer ? (
              <div style={{ fontSize: 15, color: "#44403c", lineHeight: 1.45 }}>
                <strong>{organizerName}</strong> invited you to eat at:
              </div>
            ) : (
              <div style={{ fontSize: 14, color: "#57534e" }}>Ready for guests at:</div>
            )}

            {/* 2. Restaurant name + optional logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 12,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  data-testid="invite-restaurant-logo"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    objectFit: "cover",
                    border: "1px solid #e7e5e4",
                    flexShrink: 0,
                  }}
                />
              ) : null}
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{placeName}</div>
            </div>

            {/* 3. Address + Open in Maps */}
            {(streetAddr || cityLine) ? (
              <div data-testid="invite-restaurant-address" style={{ marginTop: 12 }}>
                {streetAddr ? (
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#292524" }}>{streetAddr}</div>
                ) : null}
                {cityLine ? (
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#44403c" }}>{cityLine}</div>
                ) : null}
                {directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="invite-open-in-maps"
                    style={{
                      display: "inline-flex",
                      marginTop: 10,
                      height: 40,
                      padding: "0 14px",
                      alignItems: "center",
                      borderRadius: 999,
                      border: "1px solid #d6d3d1",
                      background: "#fff",
                      color: "#166534",
                      fontWeight: 800,
                      fontSize: 14,
                      textDecoration: "none",
                    }}
                  >
                    Open in Maps
                  </a>
                ) : null}
              </div>
            ) : null}

            {/* 4–5. Date / time */}
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 16, color: "#292524" }}>
              {dateLabel}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#44403c" }}>{timeLabel}</div>

            {/* 6. Optional message */}
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
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{organizerName} says:</div>
                “{invitation.message}”
              </blockquote>
            ) : null}

            {/* 7. Recommended menu item */}
            {invitation.menu_item_name ? (
              <div style={{ marginTop: 16, fontSize: 14, color: "#44403c", lineHeight: 1.45 }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>Recommended</div>
                <div style={{ fontSize: 16 }}>
                  {dishHref ? (
                    <Link to={dishHref} style={{ color: "#166534", fontWeight: 800 }}>
                      {invitation.menu_item_name}
                    </Link>
                  ) : (
                    <strong>{invitation.menu_item_name}</strong>
                  )}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#78716c" }}>
                  Informational only — no purchase required.
                </div>
              </div>
            ) : null}

            {/* Soft destination context */}
            {clusterHref && invitation.cluster_name ? (
              <div style={{ marginTop: 12, fontSize: 13, color: "#57534e" }}>
                Near{" "}
                <Link to={clusterHref} style={{ color: "#166534", fontWeight: 700 }}>
                  {invitation.cluster_name}
                </Link>
              </div>
            ) : null}

            {/* 8. Respond / organizer status */}
            {invitation.is_organizer ? (
              <div style={{ marginTop: 20, display: "grid", gap: 12 }} data-testid="invite-organizer-status">
                <div
                  style={{
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#ecfdf5",
                    color: "#166534",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {invitation.status_label || "Ready to Send"}
                </div>
                <div style={{ fontSize: 13, color: "#57534e", lineHeight: 1.45 }}>
                  Share this link with guests. Menuply records when the invitation page is opened and
                  when guests respond — not whether Messages delivered the text.
                </div>
                {Array.isArray(invitation.responses) && invitation.responses.length > 0 ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Guest responses</div>
                    {invitation.responses.map((row) => (
                      <div
                        key={row.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 10,
                          background: "#fafaf9",
                          border: "1px solid #e7e5e4",
                          fontSize: 14,
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{row.display_name}</span>
                        <span style={{ color: "#166534", fontWeight: 700 }}>
                          {responseLabel(row.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#78716c" }}>
                    {invitation.first_opened_at
                      ? "Opened — waiting for guest responses."
                      : "Not yet opened by a guest."}
                  </div>
                )}
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
                    Your response: {responseLabel(responded)}
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
                {authPrompt || !isAuthenticated ? (
                  <div
                    data-testid="invite-auth-prompt"
                    style={{
                      marginTop: 4,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#fafaf9",
                      border: "1px solid #e7e5e4",
                      fontSize: 13,
                      color: "#44403c",
                      lineHeight: 1.45,
                    }}
                  >
                    {authPrompt ? (
                      <>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>
                          Create a free Menuply account to respond to this invitation.
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          <button type="button" onClick={goSignUp} style={btnPrimary}>
                            Create account
                          </button>
                          <button type="button" onClick={goSignIn} style={btnSecondary}>
                            Sign in
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        You can read this invitation without an account. Sign in only when you are
                        ready to respond.
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* 9. Restaurant / menu on Menuply */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: "1px solid #e7e5e4",
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                {String(placeName).toUpperCase()} ON MENUPLY
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {menuHref ? (
                  <Link to={menuHref} style={linkBtn} data-testid="invite-view-menu">
                    View Menu
                  </Link>
                ) : null}
                {restaurantHref ? (
                  <Link to={restaurantHref} style={linkBtnSecondary}>
                    Restaurant profile
                  </Link>
                ) : null}
                {dishHref ? (
                  <Link to={dishHref} style={linkBtnSecondary}>
                    Recommended dish
                  </Link>
                ) : null}
              </div>

              {(phone || hoursRows.length > 0) ? (
                <div data-testid="invite-restaurant-info" style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#57534e" }}>
                    Restaurant information
                  </div>
                  {phone ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#78716c" }}>Phone</div>
                      <a
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        style={{ color: "#1c1917", fontWeight: 700, textDecoration: "none" }}
                      >
                        {phone}
                      </a>
                    </div>
                  ) : null}
                  {hoursRows.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#78716c", marginBottom: 4 }}>
                        Hours
                      </div>
                      <div style={{ display: "grid", gap: 2 }}>
                        {hoursRows.map((row) => (
                          <div
                            key={row.day}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              fontSize: 13,
                              color: "#44403c",
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>{row.day}</span>
                            <span>{row.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
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

const linkBtn = {
  ...btnPrimary,
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
};

const linkBtnSecondary = {
  ...btnSecondary,
  display: "inline-flex",
  alignItems: "center",
  textDecoration: "none",
};
