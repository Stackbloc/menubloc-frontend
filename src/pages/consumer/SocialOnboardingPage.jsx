/**
 * Guided Social Onboarding — educational introduction to Menuply.
 * Informational screens with optional actions. Nothing is required to continue.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import WhatPeopleAreEating from "../../components/cluster/WhatPeopleAreEating.jsx";
import ImEatingComposer from "../../components/foodActivity/ImEatingComposer.jsx";
import ShareModal from "../../components/share/ShareModal.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  listDiningCrews,
  createDiningCrew,
  updateDiningCrew,
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
import { buildDiningCrewInviteShareData } from "../../lib/diningCrewInviteShare.js";
import {
  DEFAULT_ONBOARDING_CLUSTER,
  SOCIAL_ONBOARDING_STEPS,
  defaultDiningCrewNameFromProfile,
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

const STEP_META = {
  welcome: { title: "Welcome to Menuply" },
  dining_crew: { title: "Eating is social." },
  expand_crew: { title: "Want to expand your Dining Crew?" },
  food_camera: { title: "Share food with the Menuply community" },
  student_edu: { title: "Are you a student?" },
  people_eating: { title: "What are people eating?" },
  im_eating: { title: "What are you eating?" },
  waiter: { title: "Ask Waiter" },
};

function ProgressDots({ stepId }) {
  const index = SOCIAL_ONBOARDING_STEPS.indexOf(stepId);
  if (index < 0) return null;
  return (
    <div
      style={styles.dots}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={SOCIAL_ONBOARDING_STEPS.length}
      aria-valuenow={index + 1}
      aria-label="Onboarding progress"
    >
      {SOCIAL_ONBOARDING_STEPS.map((id, i) => (
        <span
          key={id}
          style={{
            ...styles.dot,
            background: i <= index ? "#16a34a" : "#d1d5db",
          }}
        />
      ))}
    </div>
  );
}

export default function SocialOnboardingPage() {
  const navigate = useNavigate();
  const { consumer, profile, isAuthenticated, loading: authLoading, refreshSession } =
    useConsumer();
  const userId = consumer?.id;
  const edu = getEduVerificationFromConsumer(consumer);

  const [state, setState] = useState(emptySocialOnboardingState);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Dining crew step
  const [crewCreated, setCrewCreated] = useState(false);
  const [activeCrewId, setActiveCrewId] = useState(null);
  const [crewName, setCrewName] = useState("");
  const [crewNameSaved, setCrewNameSaved] = useState(false);
  const [inviteShareData, setInviteShareData] = useState(null);
  const [inviteShareOpen, setInviteShareOpen] = useState(false);

  // Expand / share / I'm Eating optional reveals
  const [showFindPeople, setShowFindPeople] = useState(false);
  const [showShareFood, setShowShareFood] = useState(false);
  const [showImEating, setShowImEating] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);

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

  async function skipEntireIntroduction() {
    setBusy(true);
    setError("");
    try {
      let next = state;
      for (const id of SOCIAL_ONBOARDING_STEPS) {
        if (next.steps?.[id] === "pending") {
          next = markSocialOnboardingStep(next, id, "skipped");
        }
      }
      await persist(next);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateDiningCrew() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const existing = await listDiningCrews();
      const crews = existing.crews || [];
      let crew = crews[0] || null;
      const defaultName = defaultDiningCrewNameFromProfile(profile);
      if (!crew?.id) {
        const created = await createDiningCrew({ name: defaultName });
        crew = created.crew;
      }
      if (!crew?.id) throw new Error("Unable to create Dining Crew");
      setActiveCrewId(crew.id);
      setCrewName(crew.name || defaultName);
      setCrewCreated(true);
      setCrewNameSaved(false);
      setNotice("Your Dining Crew is ready. You can rename it now or add people later.");
    } catch (err) {
      setError(err.message || "Unable to create Dining Crew");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveCrewName() {
    if (!activeCrewId) return;
    const nextName = String(crewName || "").trim();
    if (!nextName) {
      setError("Enter a name for your Dining Crew.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await updateDiningCrew(activeCrewId, { name: nextName });
      setCrewName(updated.crew?.name || nextName);
      setCrewNameSaved(true);
      setNotice("Dining Crew name saved.");
    } catch (err) {
      setError(err.message || "Unable to update Dining Crew name");
    } finally {
      setBusy(false);
    }
  }

  async function handleShareInvite() {
    if (!activeCrewId) return;
    setBusy(true);
    setError("");
    try {
      const invited = await inviteToDiningCrew(activeCrewId, {});
      const shareData = buildDiningCrewInviteShareData(invited.invitation?.url || "");
      if (!shareData?.url) throw new Error("Unable to create invite link");
      setInviteShareData(shareData);
      setInviteShareOpen(true);
    } catch (err) {
      setError(err.message || "Unable to create invite");
    } finally {
      setBusy(false);
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
      setNotice("Thanks for sharing.");
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
          <h1 style={styles.h1}>You're ready to explore Menuply.</h1>
          <p style={styles.body}>
            Dining Crew, <strong>What People Are Eating</strong>, <strong>I'm Eating</strong>, and{" "}
            <strong>Waiter</strong> remain available from your account.
          </p>
          <p style={styles.lead}>Nothing is required.</p>
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

  return (
    <>
      <StickyPageHeader title="Getting started" />
      <div style={styles.page} data-testid="social-onboarding" data-step={stepId}>
        <p style={styles.kicker}>A guided introduction to Menuply</p>
        <ProgressDots stepId={stepId} />
        <h1 style={styles.h1}>{meta.title}</h1>

        {error ? <p style={styles.error}>{error}</p> : null}
        {notice ? <p style={styles.notice}>{notice}</p> : null}

        {stepId === "welcome" ? (
          <section data-testid="social-onboarding-welcome">
            <p style={styles.body}>
              <strong>
                Menuply helps you find, explore, and share food. Discover restaurants, menus,
                dishes, deals, and what people around you are eating.
              </strong>
            </p>
            <button
              type="button"
              style={styles.primaryBtn}
              disabled={busy}
              onClick={() => settle("welcome", "done")}
            >
              Continue
            </button>
          </section>
        ) : null}

        {stepId === "dining_crew" ? (
          <section data-testid="social-onboarding-dining-crew">
            <p style={styles.body}>
              Eating alone is always an option, but eating with friends and family is a different
              experience.
            </p>
            <p style={styles.lead}>Who do you eat with?</p>
            <p style={styles.body}>
              Create your own <strong>Dining Crew</strong> to bring the people you eat with together
              so you can decide where and what to eat—and invite them when you find something good.
            </p>

            {crewCreated ? (
              <div style={styles.card}>
                <strong>Your Dining Crew is ready</strong>
                <p style={{ ...styles.soft, marginTop: 8 }}>
                  Rename it if you like. Sharing an invite is optional — you can Continue without
                  inviting anyone.
                </p>
                <label style={styles.label}>
                  Dining Crew name
                  <input
                    style={styles.input}
                    type="text"
                    value={crewName}
                    onChange={(e) => {
                      setCrewName(e.target.value);
                      setCrewNameSaved(false);
                    }}
                    data-testid="dining-crew-name-input"
                  />
                </label>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy || !String(crewName || "").trim()}
                  onClick={handleSaveCrewName}
                >
                  {crewNameSaved ? "Name saved" : "Save name"}
                </button>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  disabled={busy || !activeCrewId}
                  onClick={handleShareInvite}
                  data-testid="dining-crew-share-invite"
                >
                  Share invite
                </button>
                <Link to="/account/dining-crews" style={styles.secondaryLink}>
                  Open Dining Crews
                </Link>
              </div>
            ) : (
              <button
                type="button"
                style={styles.secondaryBtn}
                disabled={busy}
                onClick={handleCreateDiningCrew}
                data-testid="create-dining-crew"
              >
                Create Dining Crew
              </button>
            )}

            <button
              type="button"
              style={styles.primaryBtn}
              disabled={busy}
              onClick={() => settle("dining_crew", "done")}
            >
              Continue
            </button>
          </section>
        ) : null}

        {stepId === "expand_crew" ? (
          <section>
            <p style={styles.lead}>Meet people through food.</p>
            <p style={styles.body}>
              Menuply can help you discover people who are looking to eat together around
              restaurants, dishes, coffee, lunch, dinner, and other food experiences.
            </p>
            <p style={styles.body}>
              It&apos;s about <strong>connecting through food</strong>, not generic stranger
              networking.
            </p>

            {!showFindPeople ? (
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={() => setShowFindPeople(true)}
              >
                Find People
              </button>
            ) : (
              <div style={styles.card}>
                <p style={styles.body}>
                  Browse public food activity and connections when you&apos;re ready. Nothing is
                  required now.
                </p>
                <WhatPeopleAreEating clusterId={DEFAULT_ONBOARDING_CLUSTER.id} compact />
                <Link to="/account/dining-crews" style={styles.secondaryLink}>
                  Open Dining Crews
                </Link>
                <Link to="/account/connections" style={styles.secondaryLink}>
                  Open Connections
                </Link>
              </div>
            )}

            <button
              type="button"
              style={styles.primaryBtn}
              disabled={busy}
              onClick={() => settle("expand_crew", "done")}
            >
              Continue
            </button>
          </section>
        ) : null}

        {stepId === "food_camera" ? (
          <section data-testid="social-onboarding-food-camera">
            <p style={styles.lead}>Food is worth sharing.</p>
            <p style={styles.body}>
              Share photos or comments about what you&apos;re eating as part of Menuply&apos;s food
              discovery experience.
            </p>

            {!showShareFood ? (
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={() => setShowShareFood(true)}
              >
                Share Food
              </button>
            ) : (
              <div style={styles.card}>
                <p style={styles.body}>
                  Share from Dining Crew conversations or when you post what you&apos;re eating —
                  photos and comments both count.
                </p>
                <Link to="/account/dining-crews" style={styles.secondaryLink}>
                  Open Dining Crews
                </Link>
              </div>
            )}

            <button
              type="button"
              style={styles.primaryBtn}
              disabled={busy}
              onClick={() => settle("food_camera", "done")}
            >
              Continue
            </button>
          </section>
        ) : null}

        {stepId === "student_edu" ? (
          <section>
            <p style={styles.optBadge}>Optional</p>
            <p style={styles.body}>
              Verify your <strong>.edu</strong> email to add school affiliation context to your
              Menuply experience.
            </p>
            <p style={styles.soft}>Your email is never shown publicly.</p>
            <p style={styles.soft}>
              This is an affiliation signal — not proof of current enrollment.
            </p>

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
              <>
                {!showEduForm ? (
                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    onClick={() => setShowEduForm(true)}
                  >
                    Verify Student Status
                  </button>
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
                    <button
                      type="submit"
                      style={styles.primaryBtn}
                      disabled={busy || !eduEmail.trim()}
                    >
                      Verify .edu address
                    </button>
                    {eduSent ? (
                      <p style={styles.soft}>
                        Check your inbox, then continue after confirming the link.
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
                <button
                  type="button"
                  style={styles.skipBtn}
                  disabled={busy}
                  onClick={() => settle("student_edu", "skipped")}
                >
                  Skip
                </button>
              </>
            )}
          </section>
        ) : null}

        {stepId === "people_eating" ? (
          <section>
            <p style={styles.lead}>See what people are eating around you.</p>
            <p style={styles.body}>
              Explore public, user-generated food activity around you and within Menuply clusters.{" "}
              <strong>
                Subscribe to the clusters that interest you, and Waiter will automatically keep you
                updated on what&apos;s happening with food there.
              </strong>
            </p>
            <p style={styles.soft}>
              Cluster → Subscribe → Food activity → Waiter updates. No separate notification setup
              required.
            </p>
            <div style={styles.card}>
              <p style={styles.example}>“What are people eating around USC?”</p>
              <WhatPeopleAreEating clusterId={DEFAULT_ONBOARDING_CLUSTER.id} />
            </div>
            <Link to={USC_CLUSTER_HREF} style={styles.secondaryLink}>
              Explore
            </Link>
            <Link to="/account/cluster-subscriptions" style={styles.secondaryLink}>
              Manage cluster subscriptions
            </Link>
            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() => settle("people_eating", "done")}
            >
              Continue
            </button>
          </section>
        ) : null}

        {stepId === "im_eating" ? (
          <section>
            <p style={styles.lead}>Share what you&apos;re eating to help others discover food.</p>
            <p style={styles.body}>
              Tell Menuply what you&apos;re eating and help other diners discover restaurants,
              dishes, and food experiences.
            </p>
            <p style={styles.soft}>
              Food reports are <strong>user-reported</strong> and are not represented as verified
              purchases or orders.
            </p>

            {sharedOk ? (
              <div style={styles.card}>
                <p style={styles.body}>Thanks for sharing.</p>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  onClick={() => settle("im_eating", "done")}
                >
                  Continue
                </button>
              </div>
            ) : (
              <>
                {!showImEating ? (
                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    onClick={() => setShowImEating(true)}
                  >
                    I&apos;m Eating
                  </button>
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
                <button
                  type="button"
                  style={styles.skipBtn}
                  disabled={busy}
                  onClick={() => settle("im_eating", "skipped")}
                >
                  Skip
                </button>
              </>
            )}
          </section>
        ) : null}

        {stepId === "waiter" ? (
          <section>
            <p style={styles.body}>
              <strong>
                Ask about food, restaurants, menus, dishes, deals, and what&apos;s happening around
                you.
              </strong>
            </p>
            <p style={styles.body}>You can even ask:</p>
            <div style={styles.card}>
              <p style={styles.example}>“What are people eating around USC?”</p>
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
                    "Ask Waiter anytime as food activity grows around you."}
                </p>
              )}
            </div>
            <p style={styles.body}>
              Waiter can also keep you updated about the <strong>Menuply clusters you subscribe to</strong>.
            </p>
            <Link
              to="/waiter"
              style={styles.secondaryLink}
              onClick={() => settle("waiter", "done")}
            >
              Ask Waiter
            </Link>
            <button type="button" style={styles.primaryBtn} onClick={() => settle("waiter", "done")}>
              Continue
            </button>
          </section>
        ) : null}

        <button
          type="button"
          style={styles.skipAllBtn}
          disabled={busy}
          onClick={skipEntireIntroduction}
          data-testid="skip-entire-introduction"
        >
          Skip introduction
        </button>
      </div>
      {inviteShareData ? (
        <ShareModal
          open={inviteShareOpen}
          onClose={() => setInviteShareOpen(false)}
          modalTitle="Share Dining Crew invite"
          shareData={inviteShareData}
          analyticsContext={{
            pageType: "dining_crew_invite_onboarding",
            crewId: activeCrewId || null,
          }}
        />
      ) : null}
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
  kicker: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 10px",
    fontWeight: 600,
    letterSpacing: "0.01em",
  },
  dots: {
    display: "flex",
    gap: 6,
    marginBottom: 14,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    display: "inline-block",
  },
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
    width: "100%",
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
    width: "100%",
  },
  skipBtn: {
    display: "block",
    width: "100%",
    marginTop: 4,
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: 14,
    fontWeight: 700,
    textDecoration: "underline",
    cursor: "pointer",
    padding: "10px 0",
  },
  skipAllBtn: {
    display: "block",
    width: "100%",
    marginTop: 20,
    border: "none",
    background: "transparent",
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "underline",
    cursor: "pointer",
    padding: "8px 0",
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
    display: "block",
    color: "#15803d",
    fontWeight: 700,
    marginBottom: 10,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    background: "#fafafa",
  },
  example: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "#111827",
    background: "#fff",
    borderRadius: 10,
    padding: 12,
    border: "1px solid #e5e7eb",
    marginBottom: 12,
    fontStyle: "italic",
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
