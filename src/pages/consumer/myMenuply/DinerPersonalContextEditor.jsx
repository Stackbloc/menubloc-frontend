import { useEffect, useState } from "react";
import {
  buildDinerPersonalContextLines,
  FIELD_MAX,
  HOBBIES_MAX,
  normalizePersonalContextInput,
} from "../../../lib/dinerPersonalContext.js";
import {
  ALL_FAVORITE_FOOD_OPTIONS,
  MAX_FAVORITES,
  normalizeFavoriteFoods,
} from "../../../lib/dinerFavoriteFoods.js";
import { DINER_SEX_OPTIONS, dinerSexLabel } from "../../../lib/dinerDateOfBirth.js";
import { labelWithFoodIcon } from "../../../lib/foodInterestIcons.js";
import * as s from "./myMenuplyStyles.js";

function emptyContext() {
  return {
    diner_education_status: "",
    diner_field_of_study: "",
    diner_occupation: "",
    diner_hometown: "",
    diner_hobbies: "",
  };
}

const chip = {
  appearance: "none",
  border: "1px solid #d0d5dd",
  background: "#fff",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 13,
  fontWeight: 600,
  color: "#344054",
  cursor: "pointer",
};

const chipOn = {
  borderColor: "#16a34a",
  background: "#ecfdf3",
  color: "#166534",
};

/**
 * One profile-settings panel: occupation / school / hometown / hobbies /
 * gender / birthday / favorite foods — single Save, then collapse.
 * Hobbies are not optional UI — they stay in this section.
 */
export default function DinerPersonalContextEditor({
  value = null,
  dateOfBirth = "",
  dinerSex = "",
  favoriteFoods = [],
  busy = false,
  onSave,
}) {
  const normalizedFavorites = normalizeFavoriteFoods(favoriteFoods);
  const hasContext = buildDinerPersonalContextLines(value || {}).length > 0;
  const hasProfileBits =
    hasContext ||
    normalizedFavorites.length > 0 ||
    Boolean(String(dateOfBirth || "").trim()) ||
    Boolean(String(dinerSex || "").trim());

  const [editing, setEditing] = useState(!hasProfileBits);
  const [draft, setDraft] = useState(() => ({
    ...emptyContext(),
    ...normalizePersonalContextInput(value || {}),
  }));
  const [dob, setDob] = useState(dateOfBirth || "");
  const [sex, setSex] = useState(dinerSex || "");
  const [favorites, setFavorites] = useState(() => normalizedFavorites);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (editing) return;
    setDraft({
      ...emptyContext(),
      ...normalizePersonalContextInput(value || {}),
    });
    setDob(dateOfBirth || "");
    setSex(dinerSex || "");
    setFavorites(normalizeFavoriteFoods(favoriteFoods));
  }, [
    editing,
    value?.diner_education_status,
    value?.diner_field_of_study,
    value?.diner_occupation,
    value?.diner_hometown,
    value?.diner_hobbies,
    dateOfBirth,
    dinerSex,
    favoriteFoods,
  ]);

  function toggleFavorite(opt) {
    setFavorites((prev) => {
      const list = [...prev];
      const idx = list.findIndex((f) => f.key === opt.key);
      if (idx >= 0) {
        list.splice(idx, 1);
        return list;
      }
      if (list.length >= MAX_FAVORITES) return list;
      return [...list, { key: opt.key, label: opt.label, kind: opt.kind }];
    });
  }

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    setErr("");
    try {
      await onSave({
        ...normalizePersonalContextInput(draft),
        diner_sex: sex || null,
        date_of_birth: dob || null,
        favorite_foods: favorites,
      });
      setEditing(false);
    } catch (e) {
      setErr(e?.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  const occupationSet = Boolean(String(draft.diner_occupation || "").trim());
  const sexLabel = dinerSexLabel(dinerSex);

  if (!editing) {
    return (
      <div data-testid="diner-profile-settings-collapsed">
        {sexLabel ? (
          <p
            style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 650, color: "#344054" }}
            data-testid="diner-sex-display"
          >
            {sexLabel}
          </p>
        ) : null}
        {normalizedFavorites.length ? (
          <div style={{ marginTop: 10 }} data-testid="diner-favorite-foods-display">
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                color: "#667085",
              }}
            >
              Favorite foods
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {normalizedFavorites.map((f) => (
                <span
                  key={f.key}
                  data-testid={`diner-fav-shown-${f.key}`}
                  style={{ ...chip, ...chipOn, cursor: "default" }}
                >
                  {labelWithFoodIcon(f.key, f.label)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          data-testid="diner-personal-context-toggle"
          style={s.personalContextToggle}
          disabled={busy || saving}
          onClick={() => setEditing(true)}
        >
          {hasProfileBits ? "Edit profile details" : "Add profile details"}
        </button>
      </div>
    );
  }

  return (
    <div style={s.personalContextPanel} data-testid="diner-personal-context-editor">
      <div style={s.personalContextPanelHead}>
        <p style={s.personalContextPanelTitle}>Profile details</p>
        <button
          type="button"
          data-testid="diner-profile-settings-save"
          style={s.personalContextDoneBtn}
          disabled={busy || saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <p style={s.personalContextPanelDesc}>
        One save for hobbies, favorites, gender, birthday, and the rest — full birthday stays
        private after save; age may appear in discovery when set.
      </p>

      <div style={s.personalContextGrid}>
        <label style={s.personalContextField}>
          <span style={s.personalContextLabel}>Occupation</span>
          <input
            type="text"
            data-testid="diner-occupation-input"
            style={s.personalContextInput}
            value={draft.diner_occupation}
            maxLength={FIELD_MAX}
            placeholder="Software designer"
            disabled={busy || saving}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                diner_occupation: e.target.value.slice(0, FIELD_MAX),
              }))
            }
          />
        </label>

        <label style={s.personalContextField}>
          <span style={s.personalContextLabel}>Class year</span>
          <input
            type="text"
            data-testid="diner-education-status-input"
            style={s.personalContextInput}
            value={draft.diner_education_status}
            maxLength={FIELD_MAX}
            placeholder="Freshman"
            disabled={busy || saving || occupationSet}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                diner_education_status: e.target.value.slice(0, FIELD_MAX),
              }))
            }
          />
        </label>

        <label style={s.personalContextField}>
          <span style={s.personalContextLabel}>Major</span>
          <input
            type="text"
            data-testid="diner-field-of-study-input"
            style={s.personalContextInput}
            value={draft.diner_field_of_study}
            maxLength={FIELD_MAX}
            placeholder="Biology"
            disabled={busy || saving || occupationSet}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                diner_field_of_study: e.target.value.slice(0, FIELD_MAX),
              }))
            }
          />
        </label>

        <label style={s.personalContextField}>
          <span style={s.personalContextLabel}>Hometown</span>
          <input
            type="text"
            data-testid="diner-hometown-input"
            style={s.personalContextInput}
            value={draft.diner_hometown}
            maxLength={FIELD_MAX}
            placeholder="Houston, TX"
            disabled={busy || saving}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                diner_hometown: e.target.value.slice(0, FIELD_MAX),
              }))
            }
          />
        </label>

        <label style={{ ...s.personalContextField, gridColumn: "1 / -1" }}>
          <span style={s.personalContextLabel}>Hobbies</span>
          <input
            type="text"
            data-testid="diner-hobbies-input"
            style={s.personalContextInput}
            value={draft.diner_hobbies}
            maxLength={HOBBIES_MAX}
            placeholder="Hiking, live music, cooking"
            disabled={busy || saving}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                diner_hobbies: e.target.value.slice(0, HOBBIES_MAX),
              }))
            }
          />
        </label>

        <label style={s.personalContextField}>
          <span style={s.personalContextLabel}>Gender</span>
          <select
            data-testid="diner-sex-input"
            style={s.personalContextInput}
            value={sex || ""}
            disabled={busy || saving}
            onChange={(e) => setSex(e.target.value)}
          >
            <option value="">Prefer not to say yet</option>
            {DINER_SEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span style={s.personalContextHint}>
            Shown as F / M / NB on discovery so others can tell profiles apart.
          </span>
        </label>

        <label style={{ ...s.personalContextField, gridColumn: "1 / -1" }}>
          <span style={s.personalContextLabel}>Date of birth</span>
          <input
            type="date"
            data-testid="diner-dob-input"
            style={{ ...s.personalContextInput, maxWidth: 220 }}
            value={dob || ""}
            disabled={busy || saving}
            onChange={(e) => setDob(e.target.value)}
          />
          <span style={s.personalContextHint}>
            Optional. Full birthday stays private; age may appear in Who&apos;s Eating / Find
            Diners when set.
          </span>
        </label>

        <div style={{ ...s.personalContextField, gridColumn: "1 / -1" }}>
          <span style={s.personalContextLabel}>Favorite foods</span>
          <p style={{ ...s.personalContextHint, marginTop: 0 }}>
            Shown on your profile. Tap to select (up to {MAX_FAVORITES}).
          </p>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}
            data-testid="diner-favorite-foods"
          >
            {ALL_FAVORITE_FOOD_OPTIONS.map((opt) => {
              const on = favorites.some((f) => f.key === opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  data-testid={`diner-fav-${opt.key}`}
                  disabled={busy || saving}
                  aria-pressed={on}
                  onClick={() => toggleFavorite(opt)}
                  style={{ ...chip, ...(on ? chipOn : null) }}
                >
                  {labelWithFoodIcon(opt.key, opt.label)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {occupationSet ? (
        <p style={s.personalContextHint}>
          Occupation shows instead of school details on your profile.
        </p>
      ) : null}

      {err ? <p style={s.error}>{err}</p> : null}

      <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
        <button
          type="button"
          data-testid="diner-personal-context-done"
          style={s.personalContextDoneBtn}
          disabled={busy || saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {hasProfileBits ? (
          <button
            type="button"
            data-testid="diner-profile-settings-cancel"
            style={s.personalContextToggle}
            disabled={busy || saving}
            onClick={() => {
              setDraft({
                ...emptyContext(),
                ...normalizePersonalContextInput(value || {}),
              });
              setDob(dateOfBirth || "");
              setSex(dinerSex || "");
              setFavorites(normalizeFavoriteFoods(favoriteFoods));
              setErr("");
              setEditing(false);
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
