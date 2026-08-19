import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchUsCitiesByState,
  fetchUsStates,
  searchUsCities,
} from "../../lib/locationReferenceApi.js";

const fieldLabel = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 15,
};

const resultBtn = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  border: "none",
  borderBottom: "1px solid #f3f4f6",
  background: "#fff",
  cursor: "pointer",
  fontSize: 15,
  color: "#0f172a",
};

export default function PrimaryLocationPicker({
  value = null,
  onChange,
  neighborhood = "",
  onNeighborhoodChange,
  postalCode = "",
  onPostalCodeChange,
  showOptionalFields = true,
  disabled = false,
}) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [stateCode, setStateCode] = useState(value?.state_code || "");
  const [cityQuery, setCityQuery] = useState(value?.city_name || "");
  const [selectedCity, setSelectedCity] = useState(value);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchUsStates();
        if (!cancelled) setStates(rows);
      } finally {
        if (!cancelled) setLoadingStates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (value?.us_city_id) {
      setSelectedCity(value);
      setStateCode(value.state_code || "");
      setCityQuery(value.city_name || "");
    }
  }, [value?.us_city_id, value?.city_name, value?.state_code]);

  const loadCitiesForState = useCallback(async (code) => {
    if (!code) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    try {
      const rows = await fetchUsCitiesByState(code);
      setCities(rows);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    if (stateCode && cityQuery.length < 2) {
      loadCitiesForState(stateCode);
    }
  }, [stateCode, cityQuery, loadCitiesForState]);

  useEffect(() => {
    const q = cityQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setSearchBusy(true);
      try {
        const rows = await searchUsCities(q, stateCode || null, 12);
        setSearchResults(rows);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchBusy(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [cityQuery, stateCode]);

  const visibleResults = useMemo(() => {
    if (cityQuery.trim().length >= 2) return searchResults;
    return cities.slice(0, 50);
  }, [cityQuery, searchResults, cities]);

  function pickCity(city) {
    const next = {
      us_city_id: city.id,
      city_name: city.city_name,
      state_code: city.state_code,
      state_name: city.state_name,
      label: city.label || `${city.city_name}, ${city.state_code}`,
      country_code: "US",
    };
    setSelectedCity(next);
    setStateCode(city.state_code);
    setCityQuery(city.city_name);
    setSearchResults([]);
    onChange?.(next);
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabel} htmlFor="primary-location-state">
          State / province
        </label>
        <select
          id="primary-location-state"
          value={stateCode}
          disabled={disabled || loadingStates}
          onChange={(e) => {
            const code = e.target.value;
            setStateCode(code);
            setSelectedCity(null);
            setCityQuery("");
            onChange?.(null);
          }}
          style={inputStyle}
        >
          <option value="">Select state</option>
          {states.map((st) => (
            <option key={st.state_code} value={st.state_code}>
              {st.state_name} ({st.state_code})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={fieldLabel} htmlFor="primary-location-city">
          City
        </label>
        <input
          id="primary-location-city"
          type="search"
          value={cityQuery}
          disabled={disabled}
          onChange={(e) => {
            setCityQuery(e.target.value);
            if (selectedCity) {
              setSelectedCity(null);
              onChange?.(null);
            }
          }}
          placeholder="Start typing your city"
          style={inputStyle}
          autoComplete="address-level2"
        />
        {selectedCity?.label ? (
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#14532d", fontWeight: 600 }}>
            Selected: {selectedCity.label}
          </p>
        ) : null}
        {(loadingCities || searchBusy) && cityQuery.length >= 2 ? (
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6b7280" }}>Searching…</p>
        ) : null}
        {visibleResults.length > 0 && !selectedCity ? (
          <div
            style={{
              marginTop: 8,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden",
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {visibleResults.map((city) => (
              <button
                key={city.id}
                type="button"
                style={resultBtn}
                onClick={() => pickCity(city)}
              >
                {city.city_name}, {city.state_code}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {showOptionalFields ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={fieldLabel} htmlFor="primary-location-neighborhood">
              Neighborhood <span style={{ fontWeight: 400, color: "#6b7280" }}>(optional)</span>
            </label>
            <input
              id="primary-location-neighborhood"
              type="text"
              value={neighborhood}
              disabled={disabled}
              onChange={(e) => onNeighborhoodChange?.(e.target.value)}
              placeholder="e.g. Silver Lake"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabel} htmlFor="primary-location-postal">
              ZIP / postal code{" "}
              <span style={{ fontWeight: 400, color: "#6b7280" }}>(optional, not shown publicly)</span>
            </label>
            <input
              id="primary-location-postal"
              type="text"
              inputMode="numeric"
              value={postalCode}
              disabled={disabled}
              onChange={(e) => onPostalCodeChange?.(e.target.value)}
              placeholder="90210"
              style={inputStyle}
              maxLength={10}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
