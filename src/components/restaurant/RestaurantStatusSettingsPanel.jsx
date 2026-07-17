/**
 * Operator profile controls for public-profile status banners.
 * Mounted on /operator/profile only — not duplicated on the public page.
 * Simple banners toggle live; Happy Hour / Live Music use schedules.
 */
import { useEffect, useState } from "react";
import * as operatorApi from "../../lib/operatorApi.js";
import {
  RESTAURANT_STATUS_BANNERS,
  normalizeStatusBannerIds,
} from "../../lib/restaurantStatusBanners.js";
import StatusEventScheduleEditor from "./StatusEventScheduleEditor.jsx";

export default function RestaurantStatusSettingsPanel({
  restaurantId,
  initialBanners = [],
  initialEvents = [],
  timezoneLabel = null,
  timezoneValid = false,
  onChanged,
}) {
  const rid = restaurantId;
  const [activeBanners, setActiveBanners] = useState(() =>
    normalizeStatusBannerIds(initialBanners)
  );
  const [statusEvents, setStatusEvents] = useState(() =>
    Array.isArray(initialEvents) ? initialEvents : []
  );
  const [restaurantTimezone, setRestaurantTimezone] = useState(timezoneLabel);
  const [restaurantTimezoneValid, setRestaurantTimezoneValid] = useState(
    timezoneValid === true
  );
  const [bannerSaving, setBannerSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setActiveBanners(normalizeStatusBannerIds(initialBanners));
  }, [rid, initialBanners]);

  useEffect(() => {
    setStatusEvents(Array.isArray(initialEvents) ? initialEvents : []);
  }, [rid, initialEvents]);

  useEffect(() => {
    setRestaurantTimezone(timezoneLabel);
    setRestaurantTimezoneValid(timezoneValid === true);
  }, [timezoneLabel, timezoneValid]);

  useEffect(() => {
    if (!rid) return;
    let alive = true;
    operatorApi
      .getProfile(rid)
      .then((profileData) => {
        if (!alive) return;
        setActiveBanners(normalizeStatusBannerIds(profileData.profile?.status_banners));
        setStatusEvents(Array.isArray(profileData.status_events) ? profileData.status_events : []);
        setRestaurantTimezone(profileData.restaurant_timezone || null);
        setRestaurantTimezoneValid(profileData.restaurant_timezone_valid === true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [rid]);

  async function handleBannerToggle(bannerId) {
    if (!rid || bannerSaving) return;
    const next = activeBanners.includes(bannerId)
      ? activeBanners.filter((id) => id !== bannerId)
      : normalizeStatusBannerIds([...activeBanners, bannerId]);
    const prev = activeBanners;
    setActiveBanners(next);
    setBannerSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await operatorApi.updateStatusBanners(rid, next);
      setActiveBanners(normalizeStatusBannerIds(result.status_banners));
      setNotice("Status banners updated.");
      if (typeof onChanged === "function") await onChanged(result);
    } catch (e) {
      setActiveBanners(prev);
      setError(e.message || "Could not update status banners.");
    } finally {
      setBannerSaving(false);
    }
  }

  if (!rid) return null;

  // Parent (OperatorProfileEditor Section) owns the title/description — avoid a nested card.
  return (
    <div>
      {error ? (
        <div style={{ marginBottom: 10, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
          {error}
        </div>
      ) : null}
      {notice ? (
        <div style={{ marginBottom: 10, fontSize: 12, color: "#166534", fontWeight: 600 }}>
          {notice}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 8 }}>
        {RESTAURANT_STATUS_BANNERS.map((banner) => {
          const on = activeBanners.includes(banner.id);
          return (
            <div key={banner.id}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: on ? "1px solid #86efac" : "1px solid #d1d5db",
                  background: on ? "#fff" : "#f8fafc",
                  cursor: bannerSaving ? "wait" : "pointer",
                  fontSize: 13,
                  color: "#0f172a",
                  fontWeight: banner.prominence === "primary" ? 700 : 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={bannerSaving}
                  onChange={() => handleBannerToggle(banner.id)}
                />
                <span aria-hidden="true">{banner.emoji}</span>
                <span>{banner.label}</span>
                {banner.prominence === "primary" ? (
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#15803d", fontWeight: 800 }}>
                    Featured
                  </span>
                ) : null}
                {banner.scheduled ? (
                  <span
                    style={{
                      marginLeft: banner.prominence === "primary" ? 8 : "auto",
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 700,
                    }}
                  >
                    Scheduled
                  </span>
                ) : null}
              </label>
              {on && banner.id === "happy_hour" ? (
                <StatusEventScheduleEditor
                  restaurantId={rid}
                  statusType="happy_hour"
                  initialEvents={statusEvents.filter((e) => e.status_type === "happy_hour")}
                  timezoneLabel={restaurantTimezone}
                  timezoneValid={restaurantTimezoneValid}
                  onSaved={async (result) => {
                    setStatusEvents((prev) => [
                      ...prev.filter((e) => e.status_type !== "happy_hour"),
                      ...(result.events || []),
                    ]);
                    setActiveBanners(normalizeStatusBannerIds(result.status_banners));
                    setNotice("Happy Hour schedules updated.");
                    if (typeof onChanged === "function") await onChanged(result);
                  }}
                />
              ) : null}
              {on && banner.id === "live_music" ? (
                <StatusEventScheduleEditor
                  restaurantId={rid}
                  statusType="live_music"
                  initialEvents={statusEvents.filter((e) => e.status_type === "live_music")}
                  timezoneLabel={restaurantTimezone}
                  timezoneValid={restaurantTimezoneValid}
                  onSaved={async (result) => {
                    setStatusEvents((prev) => [
                      ...prev.filter((e) => e.status_type !== "live_music"),
                      ...(result.events || []),
                    ]);
                    setActiveBanners(normalizeStatusBannerIds(result.status_banners));
                    setNotice("Live Music events updated.");
                    if (typeof onChanged === "function") await onChanged(result);
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
