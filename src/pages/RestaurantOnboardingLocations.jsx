/**
 * Onboarding Locations stage
 * Route: /restaurant/onboarding/locations
 *
 * Manual entry up to MAX_MANUAL_LOCATIONS. At the limit → guided Bulk Location Import.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  buildManualLocationLimitMessages,
  canAddManualLocation,
  emptyLocationForm,
  resolveManualLocationLimit,
  validateLocationForm,
} from "../lib/locationEntryPolicy.js";
import {
  completeOwnedLocationsCheckpoint,
  confirmLocationImport,
  createOwnedLocation,
  deleteOwnedLocation,
  downloadLocationImportTemplate,
  getOwnedLocations,
  reorderOwnedLocations,
  setPrimaryOwnedLocation,
  updateOwnedLocation,
  validateLocationImport,
} from "../lib/operatorApi.js";
import { resolvePostLocationsPath } from "../lib/restaurantInformationSchema.js";
import {
  navigateWithRestaurantOnboardingState,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f7f4ef 0%, #efe8df 100%)",
    fontFamily: FONT,
  },
  main: { maxWidth: 820, margin: "0 auto", padding: "40px 20px 80px" },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    color: "#1F4E3D",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: "clamp(1.6rem, 3.5vw, 2.1rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#0B0F0C",
    margin: "0 0 8px",
  },
  subtitle: { fontSize: 15, color: "#4b5563", lineHeight: 1.55, margin: "0 0 8px" },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  card: {
    border: "1px solid #e8e4de",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: 800, margin: "0 0 10px" },
  err: {
    marginBottom: 12,
    padding: 12,
    background: "#fff5f5",
    border: "1px solid #ffd2d2",
    borderRadius: 12,
    color: "#7f1d1d",
    fontSize: 14,
  },
  ok: {
    marginBottom: 12,
    padding: 12,
    background: "#f3fff6",
    border: "1px solid #c6f3d1",
    borderRadius: 12,
    color: "#14532d",
    fontSize: 14,
  },
  warn: {
    marginBottom: 12,
    padding: 12,
    background: "#fff8e6",
    border: "1px solid #f0e0a8",
    borderRadius: 12,
    color: "#7c5e10",
    fontSize: 14,
  },
  row: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  full: { gridColumn: "1 / -1" },
  label: { fontSize: 12, fontWeight: 800, marginBottom: 4 },
  input: {
    width: "100%",
    height: 40,
    padding: "0 10px",
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    boxSizing: "border-box",
    fontFamily: FONT,
  },
  primaryBtn: {
    height: 44,
    padding: "0 16px",
    borderRadius: 12,
    border: 0,
    background: "#1F4E3D",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: FONT,
  },
  secondaryBtn: {
    height: 44,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: FONT,
  },
  smallBtn: {
    height: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 12,
  },
  badge: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    background: "#e8f5ef",
    color: "#1F4E3D",
    borderRadius: 999,
    padding: "2px 8px",
  },
};

function resolveRestaurantId(onboarding, restaurants) {
  const fromOnboarding = Number(onboarding?.restaurant_id);
  if (Number.isInteger(fromOnboarding) && fromOnboarding > 0) return fromOnboarding;
  const first = restaurants?.[0];
  const fromSession = Number(first?.id || first?.restaurant_id);
  return Number.isInteger(fromSession) && fromSession > 0 ? fromSession : null;
}

export default function RestaurantOnboardingLocations() {
  const navigate = useNavigate();
  const location = useLocation();
  const { operator, restaurants, isAuthenticated, isEmailVerified, loading: sessionLoading } =
    useOperator();

  const onboarding = useMemo(
    () =>
      resolveRestaurantOnboardingState({
        routeState: location.state,
        search: location.search,
      }).state,
    [location.state, location.search]
  );

  const restaurantId = useMemo(
    () => resolveRestaurantId(onboarding, restaurants),
    [onboarding, restaurants]
  );

  const [workspace, setWorkspace] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionOk, setActionOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [guidedBulkTransition, setGuidedBulkTransition] = useState(false);
  const [form, setForm] = useState(emptyLocationForm());
  const [editId, setEditId] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState(null);

  const { max: effectiveMax, source: maxSource } = resolveManualLocationLimit(
    workspace?.max_manual
  );
  const rawLimitMessages =
    workspace?.guided_limit_messages ||
    buildManualLocationLimitMessages(effectiveMax);
  const limitMessages = {
    headline: rawLimitMessages.headline,
    body: rawLimitMessages.body || rawLimitMessages.short,
    primaryAction:
      rawLimitMessages.primaryAction ||
      rawLimitMessages.primary_action ||
      "Import Locations",
    secondaryAction:
      rawLimitMessages.secondaryAction ||
      rawLimitMessages.secondary_action ||
      "Back to Locations",
  };
  // maxSource is "backend" when workspace loaded; "emergency_fallback" only if API max missing.

  function persistLocationsCheckpoint() {
    const nextOnboarding = persistRestaurantOnboardingState({
      ...onboarding,
      restaurant_id: restaurantId || onboarding?.restaurant_id,
      current_step_key: "locations",
      completed_step_keys: Array.from(
        new Set([
          ...(onboarding?.completed_step_keys || []),
          "restaurant_information",
        ])
      ),
    });
    syncRestaurantOnboardingProgress(nextOnboarding, {
      current_step_key: "locations",
      completed_step_keys: nextOnboarding.completed_step_keys,
      requested_location_count: workspace?.count || 1,
    }).catch(() => {});
    return nextOnboarding;
  }

  function enterGuidedBulkImport() {
    setActionError("");
    setShowAdd(false);
    setEditId(null);
    setGuidedBulkTransition(true);
    setShowBulk(false);
    persistLocationsCheckpoint();
  }

  function startBulkImportFromGuide() {
    persistLocationsCheckpoint();
    setGuidedBulkTransition(false);
    setShowBulk(true);
    setActionOk("Continuing Locations with Bulk Location Import. Your progress is saved.");
  }

  function backToLocationsFromGuide() {
    setGuidedBulkTransition(false);
    setShowBulk(false);
    setActionError("");
  }

  useEffect(() => {
    if (sessionLoading) return;
    if (!isAuthenticated) {
      navigate("/operator/login", {
        replace: true,
        state: { nextPath: "/restaurant/onboarding/locations", ...onboarding },
      });
      return;
    }
    if (!isEmailVerified) {
      navigate("/operator/verify-email", {
        replace: true,
        state: {
          email: operator?.email || onboarding?.email,
          nextPath: "/restaurant/onboarding/locations",
          autoSend: true,
          ...onboarding,
        },
      });
    }
  }, [sessionLoading, isAuthenticated, isEmailVerified, navigate, operator?.email, onboarding]);

  async function refreshWorkspace() {
    if (!restaurantId) return;
    const data = await getOwnedLocations(restaurantId);
    setWorkspace(data);
    const primary = data.locations?.find((l) => l.is_primary) || data.locations?.[0];
    setForm((prev) =>
      emptyLocationForm({
        restaurant_name: primary?.restaurant_name || onboarding?.restaurant_name || prev.restaurant_name,
        country_code: primary?.country_code || "US",
      })
    );
  }

  useEffect(() => {
    if (sessionLoading || !isAuthenticated || !isEmailVerified || !restaurantId) return;
    let cancelled = false;
    (async () => {
      try {
        await refreshWorkspace();
        if (!cancelled) setLoadError("");
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Unable to load locations.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, isAuthenticated, isEmailVerified, restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAddManual() {
    setActionError("");
    setActionOk("");
    const count = workspace?.count || 0;
    if (!canAddManualLocation(count, effectiveMax)) {
      enterGuidedBulkImport();
      return;
    }
    setGuidedBulkTransition(false);
    setShowAdd(true);
    setEditId(null);
    const primary = workspace?.locations?.find((l) => l.is_primary) || workspace?.locations?.[0];
    setForm(
      emptyLocationForm({
        restaurant_name: primary?.restaurant_name || onboarding?.restaurant_name || "",
        country_code: primary?.country_code || "US",
      })
    );
  }

  async function handleCreateOrUpdate(e) {
    e.preventDefault();
    setActionError("");
    setActionOk("");
    const validation = validateLocationForm(form);
    if (!validation.ok) {
      setActionError(validation.message);
      return;
    }
    if (!editId && !canAddManualLocation(workspace?.count || 0, effectiveMax)) {
      enterGuidedBulkImport();
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        await updateOwnedLocation(restaurantId, editId, form);
        setActionOk("Location updated.");
      } else {
        await createOwnedLocation(restaurantId, form);
        setActionOk("Location added.");
      }
      setShowAdd(false);
      setEditId(null);
      await refreshWorkspace();
    } catch (err) {
      const code = err?.payload?.code;
      if (code === "manual_location_limit" || err?.payload?.bulk_import_required) {
        enterGuidedBulkImport();
      } else {
        setActionError(err.message || "Unable to save location.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    setActionError("");
    try {
      await deleteOwnedLocation(restaurantId, id);
      await refreshWorkspace();
      setActionOk("Location removed.");
    } catch (err) {
      setActionError(err.message || "Unable to remove location.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPrimary(id) {
    setBusy(true);
    try {
      await setPrimaryOwnedLocation(restaurantId, id);
      await refreshWorkspace();
      setActionOk("Primary location updated.");
    } catch (err) {
      setActionError(err.message || "Unable to set primary.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(id, direction) {
    const ids = (workspace?.locations || []).map((l) => Number(l.id));
    const idx = ids.indexOf(Number(id));
    if (idx < 0) return;
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) return;
    const next = [...ids];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setBusy(true);
    try {
      await reorderOwnedLocations(restaurantId, next);
      await refreshWorkspace();
    } catch (err) {
      setActionError(err.message || "Unable to reorder.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadTemplate() {
    try {
      const csv = await downloadLocationImportTemplate(restaurantId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "menuply-bulk-location-import-template.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err.message || "Unable to download template.");
    }
  }

  async function handleValidateImport() {
    setBusy(true);
    setActionError("");
    setPreview(null);
    try {
      const result = await validateLocationImport(restaurantId, {
        format: "csv",
        csv: csvText,
      });
      setPreview(result);
      if (!result.import_ready) {
        setActionError("Resolve validation issues before confirming import.");
      } else {
        setActionOk("Preview ready. Confirm to import — no locations are created until you confirm.");
      }
    } catch (err) {
      setActionError(err.message || "Validation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview?.preview_id) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await confirmLocationImport(restaurantId, preview.preview_id);
      setActionOk(result.completion_report?.message || "Import complete.");
      setPreview(null);
      setCsvText("");
      setShowBulk(false);
      await refreshWorkspace();
    } catch (err) {
      setActionError(err.message || "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleContinue() {
    if (!restaurantId) {
      setActionError("Restaurant context is missing.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const result = await completeOwnedLocationsCheckpoint(restaurantId, {
        selected_plan_code:
          onboarding?.selected_plan_code ||
          onboarding?.selected_plan ||
          onboarding?.plan ||
          null,
      });
      const next =
        result.next_route ||
        resolvePostLocationsPath(onboarding || {});
      const completed = Array.from(
        new Set([
          ...(onboarding?.completed_step_keys || []),
          ...(result.checkpoint?.completed_step_keys || []),
          "restaurant_information",
          "locations",
        ])
      );
      const nextStep =
        result.checkpoint?.current_step_key ||
        (next.includes("design-select") ? "public_profile_review" : "payment");
      const nextOnboarding = persistRestaurantOnboardingState({
        ...onboarding,
        current_step_key: nextStep,
        completed_step_keys: completed,
        draft_payload: {
          ...(onboarding?.draft_payload || {}),
          stage_records: result.checkpoint?.stage_records || {},
        },
      });
      syncRestaurantOnboardingProgress(nextOnboarding, {
        current_step_key: nextStep,
        completed_step_keys: completed,
        requested_location_count: result.workspace?.count || workspace?.count || 1,
      }).catch(() => {});
      navigateWithRestaurantOnboardingState(navigate, next, nextOnboarding);
    } catch (err) {
      setActionError(err.message || "Unable to complete Locations checkpoint.");
    } finally {
      setBusy(false);
    }
  }

  if (sessionLoading || (!workspace && !loadError)) {
    return (
      <div style={styles.page}>
        <div style={styles.main}>
          <BrandLogo height={44} radius={12} matchPageBackground={false} />
          <p style={{ marginTop: 28, color: "#6b7280" }}>Loading locations…</p>
        </div>
      </div>
    );
  }

  const locations = workspace?.locations || [];
  const count = workspace?.count || 0;

  return (
    <div style={styles.page}>
      <div style={styles.main}>
        <BrandLogo height={44} radius={12} matchPageBackground={false} />
        <div style={{ ...styles.eyebrow, marginTop: 28 }}>Onboarding · Locations</div>
        <h1 style={styles.title}>Locations</h1>
        <p style={styles.subtitle}>
          Manage where you operate. Manual entry supports up to {effectiveMax} locations.
          Larger organizations use Bulk Location Import — an alternate way to complete this same
          Locations stage.
        </p>
        <p style={styles.hint}>Your progress is saved automatically.</p>

        {loadError ? <div style={styles.err}>{loadError}</div> : null}
        {actionError ? <div style={styles.err}>{actionError}</div> : null}
        {actionOk ? <div style={styles.ok}>{actionOk}</div> : null}

        {guidedBulkTransition ? (
          <section
            style={styles.warn}
            aria-labelledby="guided-bulk-title"
            data-testid="guided-bulk-location-import"
          >
            <h2 id="guided-bulk-title" style={{ ...styles.sectionTitle, marginTop: 0 }}>
              {limitMessages.headline}
            </h2>
            <p style={{ margin: "0 0 14px", lineHeight: 1.55 }}>{limitMessages.body}</p>
            <div style={styles.row}>
              <button
                type="button"
                style={styles.primaryBtn}
                onClick={startBulkImportFromGuide}
                data-testid="guided-import-locations"
              >
                {limitMessages.primaryAction}
              </button>
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={backToLocationsFromGuide}
                data-testid="guided-back-to-locations"
              >
                {limitMessages.secondaryAction}
              </button>
            </div>
          </section>
        ) : null}

        <section style={styles.card} aria-labelledby="manual-entry">
          <div style={{ ...styles.row, justifyContent: "space-between", marginBottom: 8 }}>
            <h2 id="manual-entry" style={{ ...styles.sectionTitle, margin: 0 }}>
              Manual Location Entry
            </h2>
            <span style={styles.badge} data-max-source={maxSource}>
              {count} / {effectiveMax}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
            Best for independents, small groups, and small regional chains.
          </p>

          {locations.map((loc) => (
            <div key={loc.id} style={{ ...styles.card, marginBottom: 8, background: "#fafafa" }}>
              <div style={{ ...styles.row, justifyContent: "space-between" }}>
                <div>
                  <strong>{loc.restaurant_name}</strong>
                  {loc.is_primary ? (
                    <span style={{ ...styles.badge, marginLeft: 8 }}>Primary</span>
                  ) : null}
                  <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>
                    {[loc.address_line1, loc.city, loc.state, loc.postal_code]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
                <div style={styles.row}>
                  <button type="button" style={styles.smallBtn} disabled={busy} onClick={() => handleMove(loc.id, "up")}>
                    Up
                  </button>
                  <button type="button" style={styles.smallBtn} disabled={busy} onClick={() => handleMove(loc.id, "down")}>
                    Down
                  </button>
                  {!loc.is_primary ? (
                    <button type="button" style={styles.smallBtn} disabled={busy} onClick={() => handleSetPrimary(loc.id)}>
                      Make primary
                    </button>
                  ) : null}
                  <button
                    type="button"
                    style={styles.smallBtn}
                    disabled={busy}
                    onClick={() => {
                      setEditId(loc.id);
                      setShowAdd(true);
                      setForm({
                        restaurant_name: loc.restaurant_name || "",
                        address_line1: loc.address_line1 || "",
                        address_line2: loc.address_line2 || "",
                        city: loc.city || "",
                        state: loc.state || "",
                        postal_code: loc.postal_code || "",
                        country_code: loc.country_code || "US",
                        phone: loc.phone || "",
                      });
                    }}
                  >
                    Edit
                  </button>
                  {!loc.is_primary ? (
                    <button type="button" style={styles.smallBtn} disabled={busy} onClick={() => handleDelete(loc.id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          <div style={styles.row}>
            <button type="button" style={styles.secondaryBtn} disabled={busy} onClick={openAddManual}>
              Add location
            </button>
          </div>

          {showAdd ? (
            <form onSubmit={handleCreateOrUpdate} style={{ marginTop: 14 }}>
              <div style={styles.grid}>
                {[
                  ["restaurant_name", "Location name *", "full"],
                  ["address_line1", "Address line 1 *", "full"],
                  ["address_line2", "Address line 2", "full"],
                  ["city", "City *"],
                  ["state", "State *"],
                  ["postal_code", "Postal code *"],
                  ["country_code", "Country"],
                  ["phone", "Phone"],
                ].map(([key, label, full]) => (
                  <div key={key} style={full ? styles.full : undefined}>
                    <div style={styles.label}>{label}</div>
                    <input
                      style={styles.input}
                      value={form[key]}
                      maxLength={key === "state" || key === "country_code" ? 2 : undefined}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          [key]:
                            key === "state" || key === "country_code"
                              ? e.target.value.toUpperCase().slice(0, 2)
                              : e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div style={{ ...styles.row, marginTop: 12 }}>
                <button type="submit" style={styles.primaryBtn} disabled={busy}>
                  {busy ? "Saving…" : editId ? "Update location" : "Add location"}
                </button>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy}
                  onClick={() => {
                    setShowAdd(false);
                    setEditId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section style={styles.card} aria-labelledby="bulk-import">
          <h2 id="bulk-import" style={styles.sectionTitle}>
            Bulk Location Import
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 0 }}>
            Optional at any size. Required when you need more than {effectiveMax} locations.
            Supports CSV (XLSX reserved). Nothing is created until you confirm a validated preview.
            Bulk Location Import continues this Locations stage — it is not a separate onboarding flow.
          </p>
          <div style={styles.row}>
            <button type="button" style={styles.secondaryBtn} onClick={() => setShowBulk((v) => !v)}>
              {showBulk ? "Hide import" : "Import Locations"}
            </button>
            <button type="button" style={styles.smallBtn} onClick={handleDownloadTemplate}>
              Download CSV template
            </button>
          </div>

          {showBulk ? (
            <div style={{ marginTop: 14 }}>
              <div style={styles.label}>Paste CSV contents</div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                style={{
                  width: "100%",
                  border: "1px solid #e5e5e5",
                  borderRadius: 12,
                  padding: 10,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12,
                  boxSizing: "border-box",
                }}
                placeholder="restaurant_name,address_line1,address_line2,city,state,postal_code,country_code,phone"
              />
              <div style={{ ...styles.row, marginTop: 10 }}>
                <button type="button" style={styles.secondaryBtn} disabled={busy} onClick={handleValidateImport}>
                  Validate & preview
                </button>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy || !preview?.import_ready}
                  onClick={handleConfirmImport}
                >
                  Confirm import
                </button>
              </div>
              {preview ? (
                <div style={{ marginTop: 12, fontSize: 13 }}>
                  <div>
                    Valid: {preview.valid_count} · Issues: {preview.issue_count} · Ready:{" "}
                    {preview.import_ready ? "yes" : "no"}
                  </div>
                  {preview.issues?.length ? (
                    <ul>
                      {preview.issues.slice(0, 10).map((issue, i) => (
                        <li key={i}>
                          Row {issue.row_number}: {issue.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <div style={{ ...styles.row, marginTop: 8 }}>
          <button type="button" style={styles.primaryBtn} disabled={busy || !locations.length} onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
