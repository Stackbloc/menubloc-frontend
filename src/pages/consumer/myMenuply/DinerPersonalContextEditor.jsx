import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FIELD_MAX, normalizePersonalContextInput } from "../../../lib/dinerPersonalContext.js";
import * as s from "./myMenuplyStyles.js";

function emptyContext() {
  return {
    diner_education_status: "",
    diner_field_of_study: "",
    diner_occupation: "",
    diner_hometown: "",
  };
}

export default function DinerPersonalContextEditor({
  value = null,
  busy = false,
  onSave,
}) {
  const [draft, setDraft] = useState(() => ({
    ...emptyContext(),
    ...normalizePersonalContextInput(value || {}),
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      ...emptyContext(),
      ...normalizePersonalContextInput(value || {}),
    });
  }, [
    value?.diner_education_status,
    value?.diner_field_of_study,
    value?.diner_occupation,
    value?.diner_hometown,
  ]);

  async function saveIfChanged() {
    const next = normalizePersonalContextInput(draft);
    const prev = normalizePersonalContextInput(value || {});
    const changed = Object.keys(next).some((key) => next[key] !== prev[key]);
    if (!changed || !onSave) return;

    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
    }
  }

  const occupationSet = Boolean(String(draft.diner_occupation || "").trim());

  return (
    <div style={s.personalContextPanel} data-testid="diner-personal-context-editor">
      <div style={s.personalContextPanelHead}>
        <div>
          <p style={s.personalContextPanelTitle}>Personal context</p>
          <p style={s.personalContextPanelDesc}>
            Optional — shown under your name (class year, job, hometown).
          </p>
        </div>
        <Link to="/account?tab=profile#profile-information" style={s.link}>
          Screen name
        </Link>
      </div>

      <div style={s.personalContextGrid}>
        <label style={s.personalContextField}>
          <span style={s.personalContextLabel}>Occupation or profession</span>
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
            onBlur={saveIfChanged}
          />
        </label>

        <label style={s.personalContextField}>
          <span style={s.personalContextLabel}>Class year or status</span>
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
            onBlur={saveIfChanged}
          />
        </label>

        <label style={s.personalContextField}>
          <span style={s.personalContextLabel}>Major or field</span>
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
            onBlur={saveIfChanged}
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
            onBlur={saveIfChanged}
          />
        </label>
      </div>

      {occupationSet ? (
        <p style={s.personalContextHint}>
          Occupation shows instead of school details on your profile.
        </p>
      ) : null}
    </div>
  );
}
