/**
 * Guided Social Onboarding — discovery questions over existing Social Engine APIs.
 * Every step is skippable. Not a college-only product.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import WhatPeopleAreEating from "../../components/cluster/WhatPeopleAreEating.jsx";
import ImEatingComposer from "../../components/foodActivity/ImEatingComposer.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  listDiningCrews,
  createDiningCrew,
  inviteToDiningCrew,
  sendEduVerification,
  createImEating,
  getSocialOnboarding,
  putSocialOnboarding,
} from "../../lib/consumerApi.js";
import {
  getEduVerificationFromConsumer,
} from "../../lib/eduVerificationDisplay.js";
import { fetchWaiterPeopleEating } from "../../lib/waiterApi.js";
import { clusterPath } from "../../lib/clusterUrl.js";
import {
  buildShareLinks,
  copyText,
  normalizeConsumerShareUrl,
} from "../../components/share/shareUtils.js";
import {
  DEFAULT_ONBOARDING_CLUSTER,
  SOCIAL_ONBOARDING_STEPS,
  emptySocialOnboardingState,
  isSocialOnboardingComplete,
  loadLocalSocialOnboarding,
  markSocialOnboardingStep,
  nextPendingStep,
  normalizeSocialOnboardingState,
  saveLocalSocialOnboarding,
} from "../../lib/socialOnboardingState.js";

const USC_CLUSTER_HREF =
  clusterPath({
    state: DEFAULT_ONBOARDING_CLUSTER.state,
    city: DEFAULT_ONBOARDING_CLUSTER.city,
    slug: DEFAULT_ONBOARDING_CLUSTER.slug,
  }) || "/clusters";

/** Force invite URLs onto https://menuply.com (never preview / share.google origins). */
function menuplyInviteUrl(apiUrl) {
  const raw = String(apiUrl || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "https://menuply.com");
    return (
      normalizeConsumerShareUrl(`https://menuply.com${parsed.pathname}${parsed.search}`) || ""
    );
  } catch {
    return normalizeConsumerShareUrl(raw) || "";
  }
}

function diningCrewInviteShareData(inviteUrl) {
  const url = menuplyInviteUrl(inviteUrl);
  return {
    title: "Join my Dining Crew on Menuply",
    text: "Join my Dining Crew on Menuply — let's decide where and what to eat together.",
    url,
  };
}

const STEP_META = {
  dining_crew: { title: "Who do you eat with?" },
  expand_crew: { title: "Want to expand your Dining Crew by meeting new people?" },
  student_edu: { title: "Are you a student?" },
  people_eating: { title: "What are people eating?" },
  im_eating: { title: "What are you eating?" },
  waiter: { title: "Ask Waiter" },
};

function SkipButton({ onClick, disabled, label = "Skip this step" }) {
  return (
    <button type="button" style={styles.skipBtn} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}

export default function SocialOnboardingPage() {
  const navigate = useNavigate();
  const { consumer, isAuthenticated, loading: authLoading, refreshSession } = useConsumer();
  const userId = consumer?.id;
  const edu = getEduVerificationFromConsumer(consumer);

  const [state, setState] = useState(emptySocialOnboardingState);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Dining crew step
  const [crewReady, setCrewReady] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [activeCrewId, setActiveCrewId] = useState(null);
  const [copyState, setCopyState] = useState("idle");

  // Expand step
  const [expandMode, setExpandMode] = useState(false);

  // Student step
  const [eduEmail, setEduEmail] = useState("");
  const [eduSent, setEduSent] = useState(false);

  // I'm Eating step
  const [restaurant, setRestaurant] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [sharedOk, setSharedOk] = useState(false);

  // Waiter step
  const [waiterPreview, setWaiterPreview] = useState(null);

  const stepId = useMemo(() => nextPendingStep(state), [state]);

  const persist = useCallback(
    async (next) => {
      const normalized = normalizeSocialOnboardingState(next);
      setState(normalized);
      if (userId) saveLocalSocialOnboarding(userId, normalized);
      try {
        await putSocialOnboarding(normalized);
      } catch {
        // localStorage remains source of truth if column/migration pending
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/social-onboarding")}`, {
        replace: true,
      });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!userId) return;
      const local = loadLocalSocialOnboarding(userId);
      let merged = local;
      try {
        const remote = await getSocialOnboarding();
        if (remote?.onboarding) {
          const r = normalizeSocialOnboardingState(remote.onboarding);
          // Prefer completed remote; else merge local progress.
          if (r.status === "completed" || r.updated_at >= (local.updated_at || "")) {
            merged = r;
          }
        }
      } catch {
        // keep local
      }
      if (cancelled) return;
      setState(merged);
      setHydrated(true);
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (stepId !== "waiter") return undefined;
    let cancelled = false;
    fetchWaiterPeopleEating({
      q: "What are people eating around USC?",
      clusterId: DEFAULT_ONBOARDING_CLUSTER.id,
      city: DEFAULT_ONBOARDING_CLUSTER.city,
      state: DEFAULT_ONBOARDING_CLUSTER.state,
      limit: 5,
    })
      .then((data) => {
        if (!cancelled) setWaiterPreview(data);
      })
      .catch(() => {
        if (!cancelled) setWaiterPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [stepId]);

  async function settle(step, value) {
    setError("");
    setNotice("");
    const next = markSocialOnboardingStep(state, step, value);
    await persist(next);
    if (isSocialOnboardingComplete(next)) {
      setNotice("You're ready to explore Menuply.");
    }
  }

  async function ensureDiningCrewInvite() {
    let crewId = activeCrewId;
    if (!crewId) {
      const existing = await listDiningCrews();
      const crews = existing.crews || [];
      if (crews[0]?.id) {
        crewId = crews[0].id;
      } else {
        const created = await createDiningCrew("My Dining Crew");
        crewId = created.crew?.id;
      }
      setActiveCrewId(crewId);
    }
    const invited = await inviteToDiningCrew(crewId, {});
    const url = menuplyInviteUrl(invited.invitation?.url || "");
    setInviteUrl(url);
    setCrewReady(true);
    return url;
  }

  async function handleTextInvite(e) {
    e?.preventDefault?.();
    setBusy(true);
    setError("");
    try {
      const url = await ensureDiningCrewInvite();
      if (!url) throw new Error("Unable to create invite link");
      const links = buildShareLinks(diningCrewInviteShareData(url));
      setNotice("Your Dining Crew is ready — pick who to text.");
      // Opens the device Messages app with the Menuply invite (no phone-book harvest).
      if (typeof window !== "undefined" && links.sms) {
        window.location.href = links.sms;
      }
    } catch (err) {
      setError(err.message || "Unable to set up Dining Crew");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyInvite() {
    setError("");
    try {
      let url = inviteUrl;
      if (!url) {
        setBusy(true);
        url = await ensureDiningCrewInvite();
        setBusy(false);
      }
      if (!url) throw new Error("Unable to create invite link");
      const ok = await copyText(url);
      setCopyState(ok ? "success" : "error");
      setNotice(ok ? "Invite link copied — paste it into a text message." : "Could not copy link");
    } catch (err) {
      setBusy(false);
      setError(err.message || "Unable to copy invite");
      setCopyState("error");
    }
  }

  async function handleEdu(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await sendEduVerification(eduEmail.trim());
      setEduSent(true);
      setNotice(result.message || "Check your .edu inbox for a verification link.");
      await refreshSession().catch(() => {});
    } catch (err) {
      setError(err.message || "Unable to start .edu verification");
    } finally {
      setBusy(false);
    }
  }

  async function handleShareEating(e) {
    e.preventDefault();
    if (!restaurant?.restaurant_id || !menuItem?.menu_item_id) {
      setError("Choose a restaurant and a menu item.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createImEating({
        restaurant_id: restaurant.restaurant_id,
        menu_item_id: menuItem.menu_item_id,
        menu_id: menuItem.menu_id || null,
        comment: comment.trim() || null,
        visibility,
      });
      setSharedOk(true);
      setNotice("Your post can help other people discover what to eat.");
      await settle("im_eating", "done");
    } catch (err) {
      setError(err.message || "Unable to share");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !hydrated) {
    return (
      <>
        <StickyPageHeader title="Getting started" />
        <div style={styles.page}>
          <p style={styles.muted}>Loading…</p>
        </div>
        <BottomNav />
      </>
    );
  }

  if (!stepId) {
    return (
      <>
        <StickyPageHeader title="You're ready" />
        <div style={styles.page} data-testid="social-onboarding-complete">
          <h1 style={styles.h1}>You're ready to explore Menuply</h1>
          <p style={styles.lead}>
            Dining Crew, What People Are Eating, I'm Eating, and Waiter stay available anytime from
            your account — nothing is required.
          </p>
          {edu.edu_verified ? <p style={styles.badge}>{edu.badge}</p> : null}
          <div style={styles.actions}>
            <Link to="/" style={styles.primaryLink}>
              Continue to Menuply
            </Link>
            <Link to="/account" style={styles.secondaryLink}>
              Account
            </Link>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  const meta = STEP_META[stepId] || { title: "Getting started" };
  const stepIndex = SOCIAL_ONBOARDING_STEPS.indexOf(stepId) + 1;

  return (
    <>
      <StickyPageHeader title="Getting started" />
      <div style={styles.page} data-testid="social-onboarding" data-step={stepId}>
        <p style={styles.progress}>
          Step {stepIndex} of {SOCIAL_ONBOARDING_STEPS.length}
        </p>
        <h1 style={styles.h1}>{meta.title}</h1>

        {error ? <p style={styles.error}>{error}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}

        {stepId === "dining_crew" ? (
          <section>
            <p style={styles.lead}>This is your Dining Crew.</p>
            <p style={styles.body}>
              Add the people you usually eat with so you can easily decide where and what to eat
              together.
            </p>
            <p style={styles.body}>
              Start by texting them an invite — they open the link and join your crew.
            </p>
            {crewReady ? (
              <div style={styles.card}>
                <strong>Your Dining Crew is ready</strong>
                <p style={{ ...styles.soft, marginTop: 8 }}>
                  Text as many people as you want. Matching by phone, email, or QR can come later —
                  texting is the easiest way to start.
                </p>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy}
                  onClick={handleTextInvite}
                >
                  Text another invite
                </button>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy}
                  onClick={handleCopyInvite}
                >
                  {copyState === "success" ? "Link copied" : "Copy invite link"}
                </button>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy}
                  onClick={() => settle("dining_crew", "done")}
                >
                  Continue
                </button>
              </div>
            ) : (
              <div style={styles.form}>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy}
                  onClick={handleTextInvite}
                  data-testid="dining-crew-text-invite"
                >
                  Text an invite
                </button>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy}
                  onClick={handleCopyInvite}
                >
                  {copyState === "success" ? "Link copied" : "Copy invite link"}
                </button>
                <p style={styles.soft}>
                  Opens your Messages app with a Menuply invite link. We never ask for your phone
                  contacts.
                </p>
              </div>
            )}
            <SkipButton disabled={busy} onClick={() => settle("dining_crew", "skipped")} />
          </section>
        ) : null}

        {stepId === "expand_crew" ? (
          <section>
            <p style={styles.body}>
              Discover other people who are looking for people to eat with — always around food and
              restaurants, not blind stranger networking.
            </p>
            {edu.edu_verified ? (
              <p style={styles.soft}>
                Students from your school who are looking for people to eat with may appear with{" "}
                {edu.badge}.
              </p>
            ) : null}
            <div style={styles.card}>
              <p style={styles.cardTitle}>Food context</p>
              <p style={styles.body}>
                Example: people gather around a restaurant and meal — not private locations.
              </p>
              <p style={styles.example}>
                ABC Restaurant · Tonight at 7 PM
                <br />
                Connections and verified students can show interest around the same meal.
              </p>
              <WhatPeopleAreEating clusterId={DEFAULT_ONBOARDING_CLUSTER.id} compact />
            </div>
            {!expandMode ? (
              <button
                type="button"
                style={styles.primaryBtn}
                onClick={() => setExpandMode(true)}
              >
                Find people
              </button>
            ) : (
              <div style={styles.form}>
                <p style={styles.body}>
                  Keep growing your crew the same way — text an invite when you meet someone over
                  food. Phone, email, or QR matching can help later; it is not required here.
                </p>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy}
                  onClick={handleTextInvite}
                >
                  Text an invite
                </button>
                <Link to="/account/dining-crews" style={styles.secondaryLink}>
                  Open Dining Crews
                </Link>
                <Link to="/account/connections" style={styles.secondaryLink}>
                  Open Connections
                </Link>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  disabled={busy}
                  onClick={() => settle("expand_crew", "done")}
                >
                  Continue
                </button>
              </div>
            )}
            <SkipButton disabled={busy} onClick={() => settle("expand_crew", "skipped")} />
          </section>
        ) : null}

        {stepId === "student_edu" ? (
          <section>
            <p style={styles.optBadge}>Optional step for students</p>
            <p style={styles.body}>
              Verify your .edu address to show your school affiliation and connect with other
              students on Menuply. This is an affiliation signal — not proof of current enrollment.
            </p>
            <p style={styles.soft}>Not a student? No problem. You can skip this step and use Menuply normally.</p>
            {edu.edu_verified ? (
              <div style={styles.card}>
                <p style={styles.badge}>{edu.badge}</p>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  onClick={() => settle("student_edu", "done")}
                >
                  Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleEdu} style={styles.form}>
                <label style={styles.label}>
                  School .edu email
                  <input
                    style={styles.input}
                    type="email"
                    value={eduEmail}
                    onChange={(e) => setEduEmail(e.target.value)}
                    placeholder="you@school.edu"
                    required
                  />
                </label>
                <button type="submit" style={styles.primaryBtn} disabled={busy || !eduEmail.trim()}>
                  Verify .edu address
                </button>
                {eduSent ? (
                  <p style={styles.soft}>
                    Check your inbox, then return here after confirming the link. Your email is never
                    shown publicly.
                  </p>
                ) : null}
                {eduSent ? (
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    onClick={async () => {
                      await refreshSession().catch(() => {});
                      await settle("student_edu", "done");
                    }}
                  >
                    Continue
                  </button>
                ) : null}
              </form>
            )}
            <SkipButton disabled={busy} onClick={() => settle("student_edu", "skipped")} />
          </section>
        ) : null}

        {stepId === "people_eating" ? (
          <section>
            <p style={styles.body}>See what people are eating around you.</p>
            <p style={styles.soft}>
              Around {DEFAULT_ONBOARDING_CLUSTER.name}: see what people are eating around campus.
              Public discovery — no subscription required.
            </p>
            <div style={styles.card}>
              <WhatPeopleAreEating clusterId={DEFAULT_ONBOARDING_CLUSTER.id} />
              <p style={styles.soft}>
                Nothing happening here yet? Be the first to share what you&apos;re eating in the next
                step.
              </p>
            </div>
            <Link
              to={USC_CLUSTER_HREF}
              style={styles.primaryLink}
              onClick={() => settle("people_eating", "done")}
            >
              Explore
            </Link>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() => settle("people_eating", "done")}
            >
              Continue
            </button>
            <SkipButton disabled={busy} onClick={() => settle("people_eating", "skipped")} />
          </section>
        ) : null}

        {stepId === "im_eating" ? (
          <section>
            <p style={styles.body}>
              Share what you&apos;re eating and help other people discover what to try.
            </p>
            <p style={styles.soft}>
              This is user-reported activity — Menuply does not claim verified purchases or orders.
            </p>
            {sharedOk ? (
              <div style={styles.card}>
                <p style={styles.body}>Your post can help other people discover what to eat.</p>
                <button type="button" style={styles.primaryBtn} onClick={() => settle("im_eating", "done")}>
                  Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleShareEating} style={styles.form}>
                <ImEatingComposer
                  restaurant={restaurant}
                  menuItem={menuItem}
                  onRestaurantChange={setRestaurant}
                  onMenuItemChange={setMenuItem}
                  comment={comment}
                  onCommentChange={setComment}
                  visibility={visibility}
                  onVisibilityChange={setVisibility}
                  disabled={busy}
                />
                <button type="submit" style={styles.primaryBtn} disabled={busy}>
                  Share what I&apos;m eating
                </button>
              </form>
            )}
            <SkipButton disabled={busy} onClick={() => settle("im_eating", "skipped")} />
          </section>
        ) : null}

        {stepId === "waiter" ? (
          <section>
            <p style={styles.body}>
              Ask about restaurants, menus, dishes, and what&apos;s happening around you.
            </p>
            <div style={styles.card}>
              <p style={styles.example}>&quot;What are people eating around USC?&quot;</p>
              {waiterPreview?.items?.length ? (
                <ul style={styles.list}>
                  {waiterPreview.items.slice(0, 5).map((item) => (
                    <li key={`${item.menu_item_id || item.item_name}-${item.restaurant_id}`}>
                      {item.item_name || "Dish"} — {item.restaurant_name || "Restaurant"}
                      {item.people_shared_label ? ` · ${item.people_shared_label}` : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={styles.soft}>
                  {waiterPreview?.notice ||
                    "Nothing happening here yet. Ask Waiter anytime as activity grows."}
                </p>
              )}
            </div>
            <Link
              to="/waiter"
              style={styles.primaryLink}
              onClick={() => settle("waiter", "done")}
            >
              Ask Waiter
            </Link>
            <button type="button" style={styles.primaryBtn} onClick={() => settle("waiter", "done")}>
              Continue
            </button>
            <SkipButton disabled={busy} onClick={() => settle("waiter", "skipped")} />
          </section>
        ) : null}
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "20px 16px 96px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#0B0F0C",
  },
  progress: { fontSize: 13, color: "#6b7280", margin: "0 0 8px", fontWeight: 600 },
  h1: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    margin: "0 0 12px",
    lineHeight: 1.2,
  },
  lead: { fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "#111827" },
  body: { fontSize: 15, lineHeight: 1.55, color: "#374151", margin: "0 0 12px" },
  soft: { fontSize: 14, lineHeight: 1.5, color: "#6b7280", margin: "0 0 12px" },
  optBadge: {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 700,
    color: "#1d4ed8",
    background: "#eff6ff",
    borderRadius: 999,
    padding: "4px 10px",
    marginBottom: 10,
  },
  form: { display: "grid", gap: 12, marginBottom: 12 },
  label: { display: "grid", gap: 6, fontSize: 13, fontWeight: 700, color: "#111827" },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 15,
  },
  primaryBtn: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 10,
  },
  secondaryBtn: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 16px",
    background: "#fff",
    color: "#111827",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 10,
  },
  skipBtn: {
    display: "block",
    width: "100%",
    marginTop: 8,
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "underline",
    cursor: "pointer",
    padding: "10px 0",
  },
  primaryLink: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: "12px 16px",
    background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    textDecoration: "none",
    marginBottom: 10,
  },
  secondaryLink: {
    display: "inline-block",
    color: "#15803d",
    fontWeight: 700,
    marginBottom: 10,
  },
  inlineLink: { color: "#15803d", wordBreak: "break-all" },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    background: "#fafafa",
  },
  cardTitle: { fontWeight: 800, margin: "0 0 8px" },
  example: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "#111827",
    background: "#fff",
    borderRadius: 10,
    padding: 12,
    border: "1px solid #e5e7eb",
    marginBottom: 12,
  },
  list: { margin: "8px 0 0", paddingLeft: 18, color: "#374151", fontSize: 14, lineHeight: 1.5 },
  badge: { fontWeight: 800, color: "#15803d", margin: "0 0 12px" },
  error: { color: "#b91c1c", fontSize: 14, marginBottom: 10 },
  notice: {
    color: "#15803d",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 12,
  },
  muted: { color: "#6b7280" },
  actions: { display: "grid", gap: 10 },
};
