/**
 * Edit View social presets: Take Me Out (Wanna Eat) vs Join Me (plans / crews).
 * Vocabulary stays separate — do not merge allow-lists.
 */

import { useEffect, useState } from "react";
import InviteMeOutAudiencePicker from "./InviteMeOutAudiencePicker.jsx";
import JoinMeAudiencePicker from "./JoinMeAudiencePicker.jsx";
import * as s from "./myMenuplyStyles.js";

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

export default function DinerSocialPresetsPanel({
  canEdit = false,
  inviteMeOutOpen = false,
  inviteMeOutAudience = "connections",
  inviteMeOutSelectedIds = [],
  inviteMeOutCandidates = [],
  onInviteMeOutSave,
  inviteMeOutToggleBusy = false,
  dinerSocialDefaults = null,
  onDinerSocialDefaultsSave,
  socialDefaultsBusy = false,
  joinCandidates = [],
}) {
  const defaults = parseDinerSocialDefaults(dinerSocialDefaults);
  const busy = Boolean(inviteMeOutToggleBusy || socialDefaultsBusy);

  const [draftInviteOpen, setDraftInviteOpen] = useState(Boolean(inviteMeOutOpen));
  const [draftInviteAudience, setDraftInviteAudience] = useState(
    inviteMeOutAudience === "selected" ? "selected" : "connections"
  );
  const [draftInviteIds, setDraftInviteIds] = useState(
    Array.isArray(inviteMeOutSelectedIds) ? inviteMeOutSelectedIds : []
  );

  const [draftPlans, setDraftPlans] = useState(defaults.plans_join_me);
  const [draftPlansCapacity, setDraftPlansCapacity] = useState(
    String(defaults.plans_join_me.join_capacity ?? 4)
  );
  const [draftCrews, setDraftCrews] = useState(defaults.crews_join_me);

  useEffect(() => {
    setDraftInviteOpen(Boolean(inviteMeOutOpen));
    setDraftInviteAudience(inviteMeOutAudience === "selected" ? "selected" : "connections");
    setDraftInviteIds(Array.isArray(inviteMeOutSelectedIds) ? inviteMeOutSelectedIds : []);
  }, [inviteMeOutOpen, inviteMeOutAudience, inviteMeOutSelectedIds]);

  useEffect(() => {
    const next = parseDinerSocialDefaults(dinerSocialDefaults);
    setDraftPlans(next.plans_join_me);
    setDraftPlansCapacity(String(next.plans_join_me.join_capacity ?? 4));
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

  async function saveCrews(next) {
    if (typeof onDinerSocialDefaultsSave !== "function") return;
    const block = normalizeJoinBlock(next, { withCapacity: false });
    setDraftCrews(block);
    await onDinerSocialDefaultsSave({ crews_join_me: block });
  }

  return (
    <section style={styles.wrap} data-testid="diner-social-presets">
      <h2 style={styles.title}>Social defaults</h2>
      <p style={styles.lead}>
        Set who can Take Me Out on cravings, and your default Join Me for plans and crews.
      </p>

      <div style={styles.row} data-testid="preset-wanna-eat">
        <p style={styles.rowLabel}>What I Wanna Eat</p>
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

      <div style={styles.row} data-testid="preset-plans">
        <p style={styles.rowLabel}>My Eating Plans</p>
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

      <div style={styles.row} data-testid="preset-crews">
        <p style={styles.rowLabel}>My Crews</p>
        <StatusToggle
          testId="preset-crews-toggle"
          featureLabel="Join Me"
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
    </section>
  );
}

const styles = {
  wrap: {
    ...s.section,
    marginBottom: 8,
  },
  title: {
    margin: "0 0 4px",
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
  },
  lead: {
    margin: "0 0 12px",
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.45,
  },
  row: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    background: "#fff",
  },
  rowLabel: {
    margin: "0 0 6px",
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
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
