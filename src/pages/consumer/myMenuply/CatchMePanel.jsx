/**
 * Catch Me editor — destination city + date range under current location.
 * Destination and dates only; no food-selection controls.
 * Empty Edit View shows the city/date fields in this card — never a lone Add.
 */

import { useEffect, useState } from "react";
import { searchUsCities } from "../../../lib/locationReferenceApi.js";
import {
  CATCH_ME_EDIT_LABEL,
  CATCH_ME_EDITOR_HELP,
  CATCH_ME_EDITOR_TITLE,
  CATCH_ME_SAVE_LABEL,
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

export default function CatchMePanel({
  catchMe = null,
  readOnly = false,
  busy = false,
  onSave,
  onClear,
}) {
  const [editing, setEditing] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const summary = catchMeEditSummary(catchMe);
  const showForm = !summary || editing;
  const minDate = todayYmd();

  useEffect(() => {
    if (summary && !editing) return;
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
  }, [editing, catchMe, summary, minDate]);

  useEffect(() => {
    const q = cityQuery.trim();
    if (!showForm || q.length < 2) {
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
  }, [cityQuery, showForm, selectedCity]);

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
      setError("Start and end dates are required");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after start date");
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
      setEditing(false);
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
      setEditing(false);
    } catch (err) {
      setError(err?.message || "Unable to clear Catch Me");
    } finally {
      setSaving(false);
    }
  }

  const disabled = busy || saving;

  return (
    <div style={s.personalContextPanel} data-testid="diner-catch-me-editor">
      <p style={s.personalContextPanelTitle}>{CATCH_ME_EDITOR_TITLE}</p>
      <p
        id="diner-catch-me-help"
        data-testid="diner-catch-me-help"
        style={s.personalContextPanelDesc}
      >
        {CATCH_ME_EDITOR_HELP}
      </p>
      {summary && !showForm ? (
        <p
          style={{ margin: "8px 0 4px", fontSize: 14, color: "#475467", fontWeight: 600 }}
          data-testid="diner-catch-me-summary"
        >
          {summary}
        </p>
      ) : null}
      {showForm ? (
        <div data-testid="diner-catch-me-form" style={{ marginTop: 10 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475467", marginBottom: 4 }}>
              City you're visiting
            </span>
            <input
              type="text"
              autoComplete="off"
              data-testid="diner-catch-me-city"
              style={inputStyle}
              value={cityQuery}
              disabled={disabled}
              placeholder="Atlanta, GA"
              aria-describedby="diner-catch-me-help"
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
                First day there
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
                Last day there
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              data-testid="diner-catch-me-save"
              style={s.personalContextDoneBtn}
              disabled={disabled}
              onClick={handleSave}
            >
              {saving ? "Saving…" : CATCH_ME_SAVE_LABEL}
            </button>
            {summary ? (
              <button
                type="button"
                data-testid="diner-catch-me-cancel"
                style={s.personalContextToggle}
                disabled={disabled}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            ) : null}
            {catchMe ? (
              <button
                type="button"
                data-testid="diner-catch-me-clear"
                style={s.personalContextToggle}
                disabled={disabled}
                onClick={handleClear}
              >
                Clear Catch Me
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-testid="diner-catch-me-toggle"
          style={s.personalContextToggle}
          disabled={disabled}
          aria-describedby="diner-catch-me-help"
          onClick={() => setEditing(true)}
        >
          {CATCH_ME_EDIT_LABEL}
        </button>
      )}
    </div>
  );
}
