/**
 * Catch Me — one line under location; city and dates live in a dialog.
 * Destination and dates only; no food-selection controls.
 */

import { useEffect, useState } from "react";
import { searchUsCities } from "../../../lib/locationReferenceApi.js";
import {
  CATCH_ME_ADD_DETAILS_LABEL,
  CATCH_ME_CITY_LABEL,
  CATCH_ME_DIALOG_HELP,
  CATCH_ME_DIALOG_TITLE,
  CATCH_ME_FROM_LABEL,
  CATCH_ME_SAVE_LABEL,
  CATCH_ME_TRAVELING_PROMPT,
  CATCH_ME_UNTIL_LABEL,
  catchMeEditSummary,
} from "../../../lib/dinerCatchMeDisplay.js";
import * as s from "./myMenuplyStyles.js";

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #bbf7d0",
  fontSize: 14,
  color: "#0f172a",
  background: "#fff",
};

const dialog = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    zIndex: 1400,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "12px 12px max(12px, env(safe-area-inset-bottom, 0px))",
  },
  panel: {
    width: "100%",
    maxWidth: 400,
    background: "#fff",
    borderRadius: 16,
    padding: "16px 16px 18px",
    boxShadow: "0 16px 48px rgba(15, 23, 42, 0.22)",
    maxHeight: "min(92dvh, calc(100dvh - 16px))",
    overflowY: "auto",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" },
  close: {
    appearance: "none",
    border: "none",
    background: "rgba(120,120,128,0.12)",
    width: 32,
    height: 32,
    borderRadius: 16,
    cursor: "pointer",
    fontSize: 16,
    lineHeight: "32px",
    color: "#334155",
  },
};

export default function CatchMePanel({
  catchMe = null,
  readOnly = false,
  busy = false,
  onSave,
  onClear,
}) {
  const [open, setOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const summary = catchMeEditSummary(catchMe);
  const minDate = todayYmd();

  useEffect(() => {
    if (!open) return;
    setError("");
    if (catchMe) {
      setSelectedCity({
        us_city_id: catchMe.us_city_id,
        city_name: catchMe.city_name,
        state_code: catchMe.state_code,
      });
      setCityQuery(
        [catchMe.city_name, catchMe.state_code].filter(Boolean).join(", ")
      );
      setStartDate(String(catchMe.start_date || "").slice(0, 10));
      setEndDate(String(catchMe.end_date || "").slice(0, 10));
    } else {
      setSelectedCity(null);
      setCityQuery("");
      setStartDate(minDate);
      setEndDate(minDate);
    }
  }, [open, catchMe, minDate]);

  useEffect(() => {
    const q = cityQuery.trim();
    if (!open || q.length < 2) {
      setResults([]);
      return undefined;
    }
    if (
      selectedCity &&
      q === [selectedCity.city_name, selectedCity.state_code].filter(Boolean).join(", ")
    ) {
      setResults([]);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      setSearchBusy(true);
      try {
        const rows = await searchUsCities(q, null, 8);
        setResults(Array.isArray(rows) ? rows : []);
      } catch {
        setResults([]);
      } finally {
        setSearchBusy(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [cityQuery, open, selectedCity]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape" && !busy && !saving) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, saving]);

  if (readOnly) {
    return null;
  }

  async function handleSave() {
    const cityId = Number(selectedCity?.us_city_id || selectedCity?.id);
    if (!cityId) {
      setError("Choose a city");
      return;
    }
    if (!startDate || !endDate) {
      setError("From and Until dates are required");
      return;
    }
    if (endDate < startDate) {
      setError("Until must be on or after From");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave?.({
        us_city_id: cityId,
        start_date: startDate,
        end_date: endDate,
      });
      setOpen(false);
    } catch (err) {
      setError(err?.message || "Unable to save Catch Me");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    setError("");
    try {
      await onClear?.();
      setOpen(false);
    } catch (err) {
      setError(err?.message || "Unable to clear Catch Me");
    } finally {
      setSaving(false);
    }
  }

  const disabled = busy || saving;

  return (
    <div style={{ marginTop: 2 }} data-testid="diner-catch-me-editor">
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 14,
          color: "#475467",
          fontWeight: 600,
        }}
      >
        {CATCH_ME_TRAVELING_PROMPT}{" "}
        <button
          type="button"
          data-testid="diner-catch-me-toggle"
          style={{ ...s.personalContextToggle, margin: 0, display: "inline", fontSize: 14 }}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          {summary || CATCH_ME_ADD_DETAILS_LABEL}
        </button>
      </p>

      {open ? (
        <div
          role="presentation"
          style={dialog.backdrop}
          data-testid="diner-catch-me-dialog"
          onClick={() => {
            if (!disabled) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="diner-catch-me-dialog-title"
            aria-describedby="diner-catch-me-help"
            style={dialog.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={dialog.head}>
              <p id="diner-catch-me-dialog-title" style={dialog.title}>
                {CATCH_ME_DIALOG_TITLE}
              </p>
              <button
                type="button"
                style={dialog.close}
                aria-label="Close"
                disabled={disabled}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <p
              id="diner-catch-me-help"
              data-testid="diner-catch-me-help"
              style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.45, color: "#475467" }}
            >
              {CATCH_ME_DIALOG_HELP}
            </p>
            <div data-testid="diner-catch-me-form">
              <label style={{ display: "block", marginBottom: 8 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475467", marginBottom: 4 }}>
                  {CATCH_ME_CITY_LABEL}
                </span>
                <input
                  type="text"
                  autoComplete="off"
                  data-testid="diner-catch-me-city"
                  style={inputStyle}
                  value={cityQuery}
                  disabled={disabled}
                  placeholder="Atlanta, GA"
                  onChange={(e) => {
                    setSelectedCity(null);
                    setCityQuery(e.target.value);
                  }}
                />
              </label>
              {searchBusy ? (
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#667085" }}>Searching…</p>
              ) : null}
              {results.length ? (
                <div
                  style={{
                    margin: "0 0 8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {results.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      data-testid={`diner-catch-me-city-option-${city.id}`}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 10px",
                        border: "none",
                        borderBottom: "1px solid #f1f5f9",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "#0f172a",
                      }}
                      onClick={() => {
                        setSelectedCity({
                          id: city.id,
                          us_city_id: city.id,
                          city_name: city.city_name,
                          state_code: city.state_code,
                        });
                        setCityQuery(`${city.city_name}, ${city.state_code}`);
                        setResults([]);
                      }}
                    >
                      {city.label || `${city.city_name}, ${city.state_code}`}
                    </button>
                  ))}
                </div>
              ) : null}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <label>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475467", marginBottom: 4 }}>
                    {CATCH_ME_FROM_LABEL}
                  </span>
                  <input
                    type="date"
                    data-testid="diner-catch-me-start"
                    style={inputStyle}
                    min={minDate}
                    value={startDate}
                    disabled={disabled}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475467", marginBottom: 4 }}>
                    {CATCH_ME_UNTIL_LABEL}
                  </span>
                  <input
                    type="date"
                    data-testid="diner-catch-me-end"
                    style={inputStyle}
                    min={startDate || minDate}
                    value={endDate}
                    disabled={disabled}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </div>
              {error ? <p style={s.error}>{error}</p> : null}
              <div
                data-testid="diner-catch-me-actions"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  position: "sticky",
                  bottom: 0,
                  background: "#fff",
                  paddingTop: 10,
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  data-testid="diner-catch-me-save"
                  style={s.personalContextDoneBtn}
                  disabled={disabled}
                  onClick={handleSave}
                >
                  {saving ? "Saving…" : CATCH_ME_SAVE_LABEL}
                </button>
                <button
                  type="button"
                  data-testid="diner-catch-me-cancel"
                  style={s.personalContextToggle}
                  disabled={disabled}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                {catchMe ? (
                  <button
                    type="button"
                    data-testid="diner-catch-me-clear"
                    style={s.personalContextToggle}
                    disabled={disabled}
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
