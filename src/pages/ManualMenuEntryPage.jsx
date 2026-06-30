import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import OperatorLayout from "./operator/OperatorLayout.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  RESTAURANT_SIGNUP_RESTART_ROUTE,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../lib/restaurantOnboardingState.js";

import {
  canRemoveManualMenuItem,
  emptyManualMenuItem,
  emptyManualMenuSection,
  loadManualMenuDraft,
  manualMenuDraftStorageKey,
  validateManualMenuSections,
} from "../lib/manualMenuEntryModel.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

const s = {
  page: {
    maxWidth: 760,
    margin: "40px auto",
    padding: "0 20px 80px",
    fontFamily: FONT,
    color: "#111",
  },
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 32,
    fontSize: 12,
    fontWeight: 600,
    flexWrap: "wrap",
    rowGap: 8,
  },
  step: (active, done) => ({
    padding: "4px 12px",
    borderRadius: 999,
    background: done ? "#111" : active ? "#f0f0f5" : "transparent",
    color: done ? "#fff" : active ? "#111" : "#aaa",
    border: active ? "1.5px solid #111" : "1.5px solid transparent",
    whiteSpace: "nowrap",
  }),
  stepDivider: { flex: "0 0 16px", height: 1, background: "#e0e0e0", margin: "0 2px" },
  heading: { fontSize: 24, fontWeight: 800, marginBottom: 8, lineHeight: 1.25 },
  subheading: { fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 1.6, maxWidth: 560 },
  contextCard: {
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 24,
    background: "#fafafa",
    fontSize: 13,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "center",
  },
  contextLabel: { fontWeight: 700, color: "#111", marginRight: 4 },
  sectionCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "18px 18px 14px",
    marginBottom: 18,
    background: "#fff",
  },
  sectionHeader: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#444",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    height: 42,
    borderRadius: 10,
    border: "1px solid #d0d5dd",
    padding: "0 12px",
    fontSize: 14,
    fontFamily: FONT,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 72,
    borderRadius: 10,
    border: "1px solid #d0d5dd",
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: FONT,
    resize: "vertical",
  },
  itemCard: {
    border: "1px solid #eef0f3",
    borderRadius: 12,
    padding: "14px 14px 12px",
    marginBottom: 12,
    background: "#fafbfc",
  },
  itemCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#344054",
  },
  sectionFooter: {
    display: "flex",
    justifyContent: "flex-start",
    marginTop: 4,
    marginBottom: 4,
  },
  itemGrid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  },
  subtleRemoveBtn: {
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#667085",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT,
  },
  ghostBtn: {
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#344054",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT,
  },
  dangerBtn: {
    border: 0,
    background: "transparent",
    color: "#b42318",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT,
    padding: "4px 0",
  },
  addRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
    marginBottom: 28,
  },
  primaryBtn: {
    border: 0,
    background: "#111",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONT,
  },
  secondaryBtn: {
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#111",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONT,
  },
  submitBtn: (disabled) => ({
    width: "100%",
    height: 48,
    borderRadius: 12,
    border: 0,
    background: disabled ? "#ccc" : "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: FONT,
  }),
  error: {
    padding: "12px 16px",
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    fontSize: 13,
    color: "#c00",
    marginBottom: 16,
    lineHeight: 1.5,
  },
  notice: {
    padding: "12px 16px",
    background: "#f0f7ff",
    border: "1px solid #c2d9f0",
    borderRadius: 10,
    fontSize: 13,
    color: "#2563a8",
    marginBottom: 16,
    lineHeight: 1.5,
  },
  successBox: {
    border: "2px solid #2a7a2a",
    borderRadius: 16,
    padding: "32px 28px",
    textAlign: "center",
    background: "#f0fbf0",
  },
  successIcon: { fontSize: 48, marginBottom: 12, lineHeight: 1 },
  successTitle: { fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#1a5c1a" },
  successSub: {
    fontSize: 14,
    color: "#444",
    marginBottom: 24,
    lineHeight: 1.6,
    maxWidth: 440,
    margin: "0 auto 24px",
  },
  profileLink: {
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: 12,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
  },
  pendingNote: { marginTop: 16, fontSize: 12, color: "#777", lineHeight: 1.5 },
  restartBtn: {
    display: "inline-flex",
    marginTop: 14,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  },
  draftSaved: {
    fontSize: 12,
    color: "#027a48",
    marginBottom: 12,
    fontWeight: 600,
  },
};

export default function ManualMenuEntryPage() {
  const location = useLocation();
  const { operator, selectedRestaurant } = useOperator();
  const isOperatorFlow = location.pathname.startsWith("/operator/");

  const recovery = useMemo(
    () => resolveRestaurantOnboardingState({ routeState: location.state, search: location.search }),
    [location.state, location.search]
  );

  useEffect(() => {
    if (!isOperatorFlow && recovery.hasAnyData) {
      persistRestaurantOnboardingState(recovery.state);
    }
  }, [isOperatorFlow, recovery]);

  const recoveryState = recovery.state || {};
  const state = isOperatorFlow
    ? {
        restaurant_id: selectedRestaurant?.id || null,
        restaurant_name: selectedRestaurant?.restaurant_name || "Your restaurant",
        email: operator?.email || "",
        owner_token: "",
        plan: "",
      }
    : recoveryState;

  const {
    restaurant_id,
    restaurant_name = "Your restaurant",
    email = "",
    owner_token = "",
    plan = "",
  } = state;

  const missingState = isOperatorFlow ? !selectedRestaurant?.id : recovery.missing;

  const [sections, setSections] = useState([emptyManualMenuSection()]);
  const [savedMenuId, setSavedMenuId] = useState(null);
  const [draftNotice, setDraftNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!restaurant_id) return;
    const draft = loadManualMenuDraft(restaurant_id);
    if (draft?.sections?.length) {
      setSections(draft.sections);
      if (draft.menu_id) setSavedMenuId(draft.menu_id);
      setDraftNotice("Draft restored from this browser.");
    }
  }, [restaurant_id]);

  function updateSection(sectionId, patch) {
    setSections((prev) => prev.map((section) => (
      section.id === sectionId ? { ...section, ...patch } : section
    )));
  }

  function updateItem(sectionId, itemId, patch) {
    setSections((prev) => prev.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map((item) => (
          item.id === itemId ? { ...item, ...patch } : item
        )),
      };
    }));
  }

  function addSection() {
    setSections((prev) => [...prev, emptyManualMenuSection()]);
  }

  function addItem(sectionId) {
    setSections((prev) => prev.map((section) => (
      section.id === sectionId
        ? { ...section, items: [...section.items, emptyManualMenuItem()] }
        : section
    )));
  }

  function removeSection(sectionId) {
    setSections((prev) => {
      if (prev.length <= 1) return [emptyManualMenuSection()];
      return prev.filter((section) => section.id !== sectionId);
    });
  }

  function removeItem(sectionId, itemId) {
    setSections((prev) => prev.map((section) => {
      if (section.id !== sectionId) return section;
      const nextItems = section.items.filter((item) => item.id !== itemId);
      return {
        ...section,
        items: nextItems.length ? nextItems : [emptyManualMenuItem()],
      };
    }));
  }

  function handleSaveDraft() {
    if (!restaurant_id) return;
    const payload = {
      sections,
      menu_id: savedMenuId,
      saved_at: new Date().toISOString(),
    };
    localStorage.setItem(manualMenuDraftStorageKey(restaurant_id), JSON.stringify(payload));
    setDraftNotice(`Draft saved locally at ${new Date().toLocaleTimeString()}.`);
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setUploadErr("");

    const { ok, errors, flat } = validateManualMenuSections(sections);
    if (!ok) {
      setFormError(errors.slice(0, 4).join(" "));
      return;
    }

    const items = flat.map(({ section, name, description, price }) => ({
      section,
      name,
      description,
      price,
    }));

    setUploading(true);
    try {
      const res = await fetch(`${API}/menu-upload/manual`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id,
          email,
          owner_token,
          plan: plan || undefined,
          menu_id: savedMenuId || undefined,
          items,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Submit failed (${res.status})`);
      }

      if (restaurant_id) {
        localStorage.removeItem(manualMenuDraftStorageKey(restaurant_id));
      }
      setResult(data);
    } catch (error) {
      setUploadErr(error.message || "Submit failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (missingState && isOperatorFlow) {
    return (
      <OperatorLayout title="Enter Menu">
        <p style={{ color: "#8a9ab0" }}>Select a restaurant from the operator sidebar before entering menu items.</p>
      </OperatorLayout>
    );
  }

  if (missingState) {
    return (
      <div style={s.page}>
        <BrandLogo height={48} radius={14} matchPageBackground={false} />
        <div style={{ ...s.error, marginTop: 24 }}>
          <strong>We could not recover your restaurant signup session.</strong><br />
          Restart signup to continue with manual menu entry.
          <br />
          <Link to={RESTAURANT_SIGNUP_RESTART_ROUTE} style={s.restartBtn}>
            Restart restaurant signup
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    const content = (
      <div style={s.page}>
        {!isOperatorFlow && (
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
        )}

        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          <div style={s.successTitle}>Menu submitted for review</div>
          <p style={s.successSub}>
            {result.items_inserted} menu item{result.items_inserted !== 1 ? "s" : ""} saved and pending review.
            Once approved, your menu will appear on your Menuply profile.
          </p>
          <Link to={isOperatorFlow ? "/operator/menulab" : "/operator/login"} style={s.profileLink}>
            {isOperatorFlow ? "Back to Menu Lab" : "Sign in to My Account"}
          </Link>
          {!isOperatorFlow ? (
            <Link
              to={`/restaurant-profile/${restaurant_id}`}
              style={{ ...s.profileLink, marginTop: 10, background: "#fff", color: "#111", border: "1px solid #d0d5dd" }}
            >
              View restaurant profile
            </Link>
          ) : null}
          <div style={s.pendingNote}>
            {result.items_inserted} items saved · Menu status: <strong>pending review</strong>
          </div>
        </div>
      </div>
    );
    return isOperatorFlow ? <OperatorLayout title="Enter Menu">{content}</OperatorLayout> : content;
  }

  const content = (
    <div style={s.page}>
      {!isOperatorFlow && (
        <BrandLogo height={48} radius={14} matchPageBackground={false} />
      )}

      {!isOperatorFlow && (
        <div style={s.steps}>
          <div style={s.step(false, true)}>1. Account</div>
          <div style={s.stepDivider} />
          <div style={s.step(false, true)}>2. Choose plan</div>
          <div style={s.stepDivider} />
          <div style={s.step(false, true)}>3. Design</div>
          <div style={s.stepDivider} />
          <div style={s.step(true, false)}>4. Add menu</div>
        </div>
      )}

      <div style={s.heading}>Enter your menu</div>
      <div style={s.subheading}>
        Add sections and items with names, descriptions, and prices. Description is optional.
        Save a draft any time, then submit when you are ready for review.
      </div>

      <div style={s.contextCard}>
        <span>
          <span style={s.contextLabel}>Restaurant</span>
          {restaurant_name}
        </span>
      </div>

      {draftNotice ? <div style={s.draftSaved}>{draftNotice}</div> : null}

      <form onSubmit={handleSubmit} noValidate>
        {sections.map((section, sectionIndex) => (
          <div key={section.id} style={s.sectionCard}>
            <div style={s.sectionHeader}>
              <div style={{ flex: "1 1 240px" }}>
                <label style={s.label} htmlFor={`section-${section.id}`}>
                  Section name {sectionIndex === 0 ? "(required)" : ""}
                </label>
                <input
                  id={`section-${section.id}`}
                  style={s.input}
                  value={section.name}
                  onChange={(event) => updateSection(section.id, { name: event.target.value })}
                  placeholder="Appetizers"
                />
              </div>
              {sections.length > 1 ? (
                <button
                  type="button"
                  style={s.dangerBtn}
                  onClick={() => removeSection(section.id)}
                >
                  Remove section
                </button>
              ) : null}
            </div>

            {section.items.map((item, itemIndex) => (
              <div key={item.id} style={s.itemCard} data-testid="manual-menu-item-card">
                <div style={s.itemCardHeader}>
                  <div style={s.itemTitle}>Item {itemIndex + 1}</div>
                  {canRemoveManualMenuItem(itemIndex, section.items.length) ? (
                    <button
                      type="button"
                      style={s.subtleRemoveBtn}
                      onClick={() => removeItem(section.id, item.id)}
                    >
                      Remove item
                    </button>
                  ) : null}
                </div>
                <div style={s.itemGrid}>
                  <div>
                    <label style={s.label} htmlFor={`item-name-${item.id}`}>Item name</label>
                    <input
                      id={`item-name-${item.id}`}
                      style={s.input}
                      value={item.name}
                      onChange={(event) => updateItem(section.id, item.id, { name: event.target.value })}
                      placeholder="Mozzarella Sticks"
                    />
                  </div>
                  <div>
                    <label style={s.label} htmlFor={`item-price-${item.id}`}>Price</label>
                    <input
                      id={`item-price-${item.id}`}
                      style={s.input}
                      value={item.price}
                      onChange={(event) => updateItem(section.id, item.id, { price: event.target.value })}
                      placeholder="8.99"
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={s.label} htmlFor={`item-desc-${item.id}`}>Description (optional)</label>
                  <textarea
                    id={`item-desc-${item.id}`}
                    style={s.textarea}
                    value={item.description}
                    onChange={(event) => updateItem(section.id, item.id, { description: event.target.value })}
                    placeholder="Fried mozzarella served with marinara"
                  />
                </div>
              </div>
            ))}

            <div style={s.sectionFooter}>
              <button
                type="button"
                style={s.ghostBtn}
                data-testid="manual-menu-add-item"
                onClick={() => addItem(section.id)}
              >
                + Add another item
              </button>
            </div>
          </div>
        ))}

        <div style={s.addRow}>
          <button type="button" style={s.secondaryBtn} onClick={addSection}>
            + Add another section
          </button>
          <button type="button" style={s.secondaryBtn} onClick={handleSaveDraft}>
            Save draft
          </button>
        </div>

        {formError ? <div style={s.error}>{formError}</div> : null}
        {uploadErr ? <div style={s.error}>{uploadErr}</div> : null}
        {uploading ? <div style={s.notice}>Submitting your menu for review...</div> : null}

        <button type="submit" style={s.submitBtn(uploading)} disabled={uploading}>
          {uploading ? "Submitting..." : "Submit for review"}
        </button>
      </form>
    </div>
  );

  return isOperatorFlow ? <OperatorLayout title="Enter Menu">{content}</OperatorLayout> : content;
}
