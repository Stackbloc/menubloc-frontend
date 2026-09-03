import { useEffect, useState } from "react";
import {
  buildDinerPersonalContextLines,
  FIELD_MAX,
  HOBBIES_MAX,
  normalizePersonalContextInput,
} from "../../../lib/dinerPersonalContext.js";
import { FlashVideosEditorField } from "./FlashVideosBlock.jsx";
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

export default function DinerPersonalContextEditor({
  value = null,
  busy = false,
  onSave,
  flashVideos = [],
  flashBusy = false,
  flashError = "",
  onFlashVideoAdd,
  onFlashVideoRemove,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({
    ...emptyContext(),
    ...normalizePersonalContextInput(value || {}),
  }));
  const [saving, setSaving] = useState(false);

  const hasContext = buildDinerPersonalContextLines(value || {}).length > 0;

  useEffect(() => {
    if (editing) return;
    setDraft({
      ...emptyContext(),
      ...normalizePersonalContextInput(value || {}),
    });
  }, [
    editing,
    value?.diner_education_status,
    value?.diner_field_of_study,
    value?.diner_occupation,
    value?.diner_hometown,
    value?.diner_hobbies,
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

  async function handleDone() {
    await saveIfChanged();
    setEditing(false);
  }

  const occupationSet = Boolean(String(draft.diner_occupation || "").trim());

  if (!editing) {
    return (
      <button
        type="button"
        data-testid="diner-personal-context-toggle"
        style={s.personalContextToggle}
        disabled={busy || saving}
        onClick={() => setEditing(true)}
      >
        {hasContext ? "Edit personal details" : "Add personal details"}
      </button>
    );
  }

  return (
    <div style={s.personalContextPanel} data-testid="diner-personal-context-editor">
      <div style={s.personalContextPanelHead}>
        <p style={s.personalContextPanelTitle}>Personal details</p>
        <button
          type="button"
          data-testid="diner-personal-context-done"
          style={s.personalContextDoneBtn}
          disabled={busy || saving}
          onClick={handleDone}
        >
          {saving ? "Saving…" : "Done"}
        </button>
      </div>

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
            onBlur={saveIfChanged}
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
            onBlur={saveIfChanged}
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
            onBlur={saveIfChanged}
          />
        </label>

        {typeof onFlashVideoAdd === "function" ? (
          <FlashVideosEditorField
            items={flashVideos}
            busy={busy || saving || flashBusy}
            error={flashError}
            onAddFile={onFlashVideoAdd}
            onRemove={onFlashVideoRemove}
          />
        ) : null}
      </div>

      {occupationSet ? (
        <p style={s.personalContextHint}>
          Occupation shows instead of school details on your profile.
        </p>
      ) : null}
    </div>
  );
}
