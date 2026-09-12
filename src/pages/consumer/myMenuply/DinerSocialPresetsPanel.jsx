/**
 * Edit View social presets — scoped into hub sections.
 * Wanna Eat: Take Me Out · Crews: Join Crew
 * Join Me for plans/events is per instance (EatingPlanDayForm / EventComposeSheet) —
 * not a section-wide preset (vocabulary contract).
 */

import { useEffect, useState } from "react";
import InviteMeOutAudiencePicker from "./InviteMeOutAudiencePicker.jsx";
import JoinMeAudiencePicker from "./JoinMeAudiencePicker.jsx";

const SCOPES = new Set(["wanna-eat", "crews"]);

/** Stable empties — default `= []` is a new array every render and infinite-loops sync effects. */
const EMPTY_ID_LIST = Object.freeze([]);
const EMPTY_CANDIDATES = Object.freeze([]);

function normalizeJoinBlock(raw, { withCapacity = false } = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const open = src.open === true || src.enabled === true;
  let audience = String(src.audience || "none").trim().toLowerCase();
  if (audience !== "connections" && audience !== "selected") audience = "none";
  if (!open) audience = "none";
  if (open && audience === "none") audience = "connections";
  const allowed_user_ids =
    audience === "selected" && Array.isArray(src.allowed_user_ids)
      ? src.allowed_user_ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)
      : [];
  const block = { open, audience, allowed_user_ids };
  if (withCapacity) {
    const cap = Number(src.join_capacity ?? src.joinCapacity);
    block.join_capacity =
      open && Number.isFinite(cap) && cap >= 1 && cap <= 99 ? Math.floor(cap) : open ? 4 : null;
  }
  return block;
}

/** Kept for back-compat reads of stored JSON; plans/events keys are unused by UI. */
export function parseDinerSocialDefaults(raw) {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    plans_join_me: normalizeJoinBlock(obj.plans_join_me || obj.plansJoinMe, {
      withCapacity: true,
    }),
    events_join_me: normalizeJoinBlock(obj.events_join_me || obj.eventsJoinMe, {
      withCapacity: false,
    }),
    crews_join_me: normalizeJoinBlock(obj.crews_join_me || obj.crewsJoinMe, {
      withCapacity: false,
    }),
  };
}

function StatusToggle({ testId, featureLabel, open, busy, onToggle }) {
  const state = open ? "On" : "Off";
  const hint = open ? "click to turn Off" : "click to turn On";
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={busy}
      onClick={() => onToggle(!open)}
      style={styles.statusBtn}
    >
      {featureLabel} is {state} — {hint}
    </button>
  );
}

/**
 * @param {"wanna-eat"|"crews"} scope
 */
export default function DinerSocialPresetsPanel({
  canEdit = false,
  scope = "wanna-eat",
  inviteMeOutOpen = false,
  inviteMeOutAudience = "connections",
  inviteMeOutSelectedIds = EMPTY_ID_LIST,
  inviteMeOutCandidates = EMPTY_CANDIDATES,
  onInviteMeOutSave,
  inviteMeOutToggleBusy = false,
  dinerSocialDefaults = null,
  onDinerSocialDefaultsSave,
  socialDefaultsBusy = false,
  joinCandidates = EMPTY_CANDIDATES,
}) {
  const activeScope = SCOPES.has(scope) ? scope : "wanna-eat";
  const defaults = parseDinerSocialDefaults(dinerSocialDefaults);
  const busy = Boolean(inviteMeOutToggleBusy || socialDefaultsBusy);
  const selectedIds = Array.isArray(inviteMeOutSelectedIds)
    ? inviteMeOutSelectedIds
    : EMPTY_ID_LIST;
  const selectedIdsKey = selectedIds.map((id) => String(id)).join(",");

  const [draftInviteOpen, setDraftInviteOpen] = useState(Boolean(inviteMeOutOpen));
  const [draftInviteAudience, setDraftInviteAudience] = useState(
    inviteMeOutAudience === "selected" ? "selected" : "connections"
  );
  const [draftInviteIds, setDraftInviteIds] = useState(() => [...selectedIds]);
  const [draftCrews, setDraftCrews] = useState(defaults.crews_join_me);

  useEffect(() => {
    setDraftInviteOpen(Boolean(inviteMeOutOpen));
    setDraftInviteAudience(inviteMeOutAudience === "selected" ? "selected" : "connections");
    setDraftInviteIds(selectedIds.map((id) => id));
  }, [inviteMeOutOpen, inviteMeOutAudience, selectedIdsKey]);

  useEffect(() => {
    const next = parseDinerSocialDefaults(dinerSocialDefaults);
    setDraftCrews(next.crews_join_me);
  }, [dinerSocialDefaults]);

  async function saveInvite(next) {
    if (typeof onInviteMeOutSave !== "function") return;
    setDraftInviteOpen(Boolean(next.open));
    setDraftInviteAudience(next.audience === "selected" ? "selected" : "connections");
    setDraftInviteIds(Array.isArray(next.selectedIds) ? next.selectedIds : []);
    await onInviteMeOutSave(next);
  }

  async function saveCrews(block) {
    if (typeof onDinerSocialDefaultsSave !== "function") return;
    setDraftCrews(block);
    await onDinerSocialDefaultsSave({ crews_join_me: block });
  }

  if (!canEdit) return null;

  let body = null;
  if (activeScope === "wanna-eat") {
    body = (
      <div style={styles.row} data-testid="preset-wanna-eat">
        <StatusToggle
          testId="preset-wanna-eat-toggle"
          featureLabel="Take Me Out"
          open={Boolean(draftInviteOpen)}
          busy={busy}
          onToggle={async (nextOpen) => {
            await saveInvite({
              open: nextOpen,
              audience: nextOpen
                ? draftInviteAudience === "selected"
                  ? "selected"
                  : "connections"
                : "none",
              selectedIds: nextOpen ? draftInviteIds : [],
            });
          }}
        />
        {draftInviteOpen ? (
          <InviteMeOutAudiencePicker
            variant="preset"
            open={draftInviteOpen}
            onOpenChange={async (nextOpen) => {
              setDraftInviteOpen(nextOpen);
              await saveInvite({
                open: nextOpen,
                audience: draftInviteAudience,
                selectedIds: draftInviteIds,
              });
            }}
            audience={draftInviteAudience}
            onAudienceChange={async (nextAudience) => {
              setDraftInviteAudience(nextAudience);
              await saveInvite({
                open: true,
                audience: nextAudience,
                selectedIds: draftInviteIds,
              });
            }}
            selectedIds={draftInviteIds}
            onSelectedIdsChange={async (ids) => {
              setDraftInviteIds(ids);
              await saveInvite({
                open: true,
                audience: draftInviteAudience,
                selectedIds: ids,
              });
            }}
            candidates={inviteMeOutCandidates}
            disabled={busy}
          />
        ) : null}
      </div>
    );
  } else if (activeScope === "crews") {
    body = (
      <div style={styles.row} data-testid="preset-crews">
        <StatusToggle
          testId="preset-crews-toggle"
          featureLabel="Join Crew"
          open={Boolean(draftCrews.open)}
          busy={busy}
          onToggle={async (nextOpen) => {
            await saveCrews({
              open: nextOpen,
              audience: nextOpen
                ? draftCrews.audience === "selected"
                  ? "selected"
                  : "connections"
                : "none",
              allowed_user_ids: nextOpen ? draftCrews.allowed_user_ids : [],
            });
          }}
        />
        {draftCrews.open ? (
          <JoinMeAudiencePicker
            variant="preset"
            joinable={Boolean(draftCrews.open)}
            onJoinableChange={async (nextOpen) => {
              await saveCrews({
                open: nextOpen,
                audience: nextOpen
                  ? draftCrews.audience === "selected"
                    ? "selected"
                    : "connections"
                  : "none",
                allowed_user_ids: nextOpen ? draftCrews.allowed_user_ids : [],
              });
            }}
            audience={draftCrews.audience === "selected" ? "selected" : "connections"}
            onAudienceChange={async (nextAudience) => {
              await saveCrews({
                open: true,
                audience: nextAudience,
                allowed_user_ids: draftCrews.allowed_user_ids,
              });
            }}
            selectedIds={draftCrews.allowed_user_ids || []}
            onSelectedIdsChange={async (ids) => {
              await saveCrews({
                open: true,
                audience: "selected",
                allowed_user_ids: ids,
              });
            }}
            candidates={joinCandidates}
            showCapacity={false}
            disabled={busy}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div style={styles.wrap} data-testid="diner-social-presets" data-scope={activeScope}>
      {body}
    </div>
  );
}

const styles = {
  wrap: {
    margin: "0 0 10px",
  },
  row: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
  },
  statusBtn: {
    appearance: "none",
    width: "100%",
    textAlign: "left",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px 12px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
    minHeight: 44,
  },
};
