/**
 * Edit View social presets — scoped into each hub section.
 * Wanna Eat: Take Me Out · Plans/Events: Join Me · Crews: Join Crew
 * Vocabulary stays separate — do not merge allow-lists.
 */

import { useEffect, useState } from "react";
import InviteMeOutAudiencePicker from "./InviteMeOutAudiencePicker.jsx";
import JoinMeAudiencePicker from "./JoinMeAudiencePicker.jsx";
import * as s from "./myMenuplyStyles.js";

const SCOPES = new Set(["wanna-eat", "plans", "events", "crews"]);

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
 * @param {"wanna-eat"|"plans"|"events"|"crews"} scope
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
  // Primitive dep so omitted/empty props do not re-trigger every render.
  const selectedIdsKey = selectedIds.map((id) => String(id)).join(",");

  const [draftInviteOpen, setDraftInviteOpen] = useState(Boolean(inviteMeOutOpen));
  const [draftInviteAudience, setDraftInviteAudience] = useState(
    inviteMeOutAudience === "selected" ? "selected" : "connections"
  );
  const [draftInviteIds, setDraftInviteIds] = useState(() => [...selectedIds]);

  const [draftPlans, setDraftPlans] = useState(defaults.plans_join_me);
  const [draftPlansCapacity, setDraftPlansCapacity] = useState(
    String(defaults.plans_join_me.join_capacity ?? 4)
  );
  const [draftEvents, setDraftEvents] = useState(defaults.events_join_me);
  const [draftCrews, setDraftCrews] = useState(defaults.crews_join_me);

  useEffect(() => {
    setDraftInviteOpen(Boolean(inviteMeOutOpen));
    setDraftInviteAudience(inviteMeOutAudience === "selected" ? "selected" : "connections");
    setDraftInviteIds(selectedIds.map((id) => id));
  }, [inviteMeOutOpen, inviteMeOutAudience, selectedIdsKey]);

  useEffect(() => {
    const next = parseDinerSocialDefaults(dinerSocialDefaults);
    setDraftPlans(next.plans_join_me);
    setDraftPlansCapacity(String(next.plans_join_me.join_capacity ?? 4));
    setDraftEvents(next.events_join_me);
    setDraftCrews(next.crews_join_me);
  }, [dinerSocialDefaults]);

  if (!canEdit) return null;

  async function saveInvite({ open, audience, selectedIds }) {
    if (typeof onInviteMeOutSave !== "function") return;
    await onInviteMeOutSave({ open, audience, selectedIds });
  }

  async function savePlans(next) {
    if (typeof onDinerSocialDefaultsSave !== "function") return;
    const block = normalizeJoinBlock(
      {
        ...next,
        join_capacity: next.open ? Number(next.join_capacity ?? draftPlansCapacity) || 4 : null,
      },
      { withCapacity: true }
    );
    setDraftPlans(block);
    setDraftPlansCapacity(String(block.join_capacity ?? 4));
    await onDinerSocialDefaultsSave({ plans_join_me: block });
  }

  async function saveEvents(next) {
    if (typeof onDinerSocialDefaultsSave !== "function") return;
    const block = normalizeJoinBlock(next, { withCapacity: false });
    setDraftEvents(block);
    await onDinerSocialDefaultsSave({ events_join_me: block });
  }

  async function saveCrews(next) {
    if (typeof onDinerSocialDefaultsSave !== "function") return;
    const block = normalizeJoinBlock(next, { withCapacity: false });
    setDraftCrews(block);
    await onDinerSocialDefaultsSave({ crews_join_me: block });
  }

  let body = null;

  if (activeScope === "wanna-eat") {
    body = (
      <div style={styles.row} data-testid="preset-wanna-eat">
        <StatusToggle
          testId="preset-wanna-eat-toggle"
          featureLabel="Take Me Out"
          open={draftInviteOpen}
          busy={busy}
          onToggle={async (nextOpen) => {
            const audience = nextOpen
              ? draftInviteAudience === "selected"
                ? "selected"
                : "connections"
              : "none";
            setDraftInviteOpen(nextOpen);
            if (!nextOpen) setDraftInviteAudience("connections");
            await saveInvite({
              open: nextOpen,
              audience: nextOpen ? audience : "connections",
              selectedIds: nextOpen && audience === "selected" ? draftInviteIds : [],
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
  } else if (activeScope === "plans") {
    body = (
      <div style={styles.row} data-testid="preset-plans">
        <StatusToggle
          testId="preset-plans-toggle"
          featureLabel="Join Me"
          open={Boolean(draftPlans.open)}
          busy={busy}
          onToggle={async (nextOpen) => {
            await savePlans({
              open: nextOpen,
              audience: nextOpen
                ? draftPlans.audience === "selected"
                  ? "selected"
                  : "connections"
                : "none",
              allowed_user_ids: nextOpen ? draftPlans.allowed_user_ids : [],
              join_capacity: nextOpen ? Number(draftPlansCapacity) || 4 : null,
            });
          }}
        />
        {draftPlans.open ? (
          <JoinMeAudiencePicker
            variant="preset"
            joinable={Boolean(draftPlans.open)}
            onJoinableChange={async (nextOpen) => {
              await savePlans({
                open: nextOpen,
                audience: nextOpen
                  ? draftPlans.audience === "selected"
                    ? "selected"
                    : "connections"
                  : "none",
                allowed_user_ids: nextOpen ? draftPlans.allowed_user_ids : [],
                join_capacity: nextOpen ? Number(draftPlansCapacity) || 4 : null,
              });
            }}
            audience={draftPlans.audience === "selected" ? "selected" : "connections"}
            onAudienceChange={async (nextAudience) => {
              await savePlans({
                open: true,
                audience: nextAudience,
                allowed_user_ids: draftPlans.allowed_user_ids,
                join_capacity: Number(draftPlansCapacity) || 4,
              });
            }}
            selectedIds={draftPlans.allowed_user_ids || []}
            onSelectedIdsChange={async (ids) => {
              await savePlans({
                open: true,
                audience: "selected",
                allowed_user_ids: ids,
                join_capacity: Number(draftPlansCapacity) || 4,
              });
            }}
            candidates={joinCandidates}
            joinCapacity={draftPlansCapacity}
            onJoinCapacityChange={async (value) => {
              setDraftPlansCapacity(value);
              await savePlans({
                open: true,
                audience: draftPlans.audience,
                allowed_user_ids: draftPlans.allowed_user_ids,
                join_capacity: Number(value) || 4,
              });
            }}
            showCapacity
            disabled={busy}
          />
        ) : null}
      </div>
    );
  } else if (activeScope === "events") {
    body = (
      <div style={styles.row} data-testid="preset-events">
        <StatusToggle
          testId="preset-events-toggle"
          featureLabel="Join Me"
          open={Boolean(draftEvents.open)}
          busy={busy}
          onToggle={async (nextOpen) => {
            await saveEvents({
              open: nextOpen,
              audience: nextOpen
                ? draftEvents.audience === "selected"
                  ? "selected"
                  : "connections"
                : "none",
              allowed_user_ids: nextOpen ? draftEvents.allowed_user_ids : [],
            });
          }}
        />
        {draftEvents.open ? (
          <JoinMeAudiencePicker
            variant="preset"
            joinable={Boolean(draftEvents.open)}
            onJoinableChange={async (nextOpen) => {
              await saveEvents({
                open: nextOpen,
                audience: nextOpen
                  ? draftEvents.audience === "selected"
                    ? "selected"
                    : "connections"
                  : "none",
                allowed_user_ids: nextOpen ? draftEvents.allowed_user_ids : [],
              });
            }}
            audience={draftEvents.audience === "selected" ? "selected" : "connections"}
            onAudienceChange={async (nextAudience) => {
              await saveEvents({
                open: true,
                audience: nextAudience,
                allowed_user_ids: draftEvents.allowed_user_ids,
              });
            }}
            selectedIds={draftEvents.allowed_user_ids || []}
            onSelectedIdsChange={async (ids) => {
              await saveEvents({
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
