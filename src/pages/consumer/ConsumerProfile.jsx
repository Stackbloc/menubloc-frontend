/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/consumer/ConsumerProfile.jsx
 * Purpose:
 *   Consumer account settings page.
 *   Single-save profile/preferences workflow.
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { DinerSupportDialog } from "../../components/grubbid/DiscoveryDrawer.jsx";
import {
  getConsumerProfile,
  updateConsumerProfile,
  updatePreferences,
  getFoodsToAvoid,
  updateFoodsToAvoid,
  changePassword,
  getLikedMenuItems,
  unlikeMenuItem,
  sendEduVerification,
} from "../../lib/consumerApi.js";
import { resetMenuPreferenceSessionForLogin } from "../../lib/menuCatalogBrowsePreferences.js";
import { fetchMyClusters } from "../../lib/clusterApi.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import SmsAuthModal from "../../components/auth/SmsAuthModal.jsx";
import { getEduVerificationFromConsumer } from "../../lib/eduVerificationDisplay.js";

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten_free", label: "Gluten-free" },
  { key: "dairy_free", label: "Dairy-free" },
  { key: "low_carb", label: "Low-carb" },
  { key: "high_protein", label: "High protein" },
  { key: "low_sodium", label: "Low sodium" },
  { key: "diabetic_friendly", label: "Diabetic-friendly" },
  { key: "nut_free", label: "Nut-free" },
  { key: "keto", label: "Keto" },
];

const ALLERGEN_OPTIONS = [
  { key: "peanuts", label: "Peanuts" },
  { key: "tree_nuts", label: "Tree nuts" },
  { key: "dairy", label: "Dairy" },
  { key: "gluten", label: "Gluten" },
  { key: "shellfish", label: "Shellfish" },
  { key: "soy", label: "Soy" },
  { key: "eggs", label: "Eggs" },
  { key: "fish", label: "Fish" },
  { key: "sesame", label: "Sesame" },
  { key: "wheat", label: "Wheat" },
];
const ALLERGEN_NONE_KEY = "__none__";

const FOODS_TO_AVOID_OPTIONS = [
  { key: "spicy_foods",  label: "Spicy Foods" },
  { key: "mushrooms",    label: "Mushrooms" },
  { key: "onions",       label: "Onions" },
  { key: "tomatoes",     label: "Tomatoes" },
  { key: "olives",       label: "Olives" },
  { key: "cilantro",     label: "Cilantro" },
  { key: "seafood",      label: "Seafood" },
  { key: "anchovies",    label: "Anchovies" },
  { key: "blue_cheese",  label: "Blue Cheese" },
  { key: "coconut",      label: "Coconut" },
  { key: "pickles",      label: "Pickles" },
  { key: "organ_meats",  label: "Organ Meats" },
  { key: "fried_foods",  label: "Fried Foods" },
];

function PreferenceToggle({ label, checked, onChange, disabled = false }) {
  return (
    <label style={{ ...styles.prefToggle, ...(disabled ? styles.prefToggleDisabled : null) }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={styles.checkbox}
      />
      <span style={styles.prefLabel}>{label}</span>
    </label>
  );
}

function Section({ title, children, id }) {
  return (
    <div id={id} style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  );
}

function SaveStatus({ status, isError = false }) {
  if (!status) return null;
  return (
    <span style={{ ...styles.saveStatus, color: isError ? "#F87171" : "#22C55E" }}>
      {status}
    </span>
  );
}

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export default function ConsumerProfile() {
  const { t } = useLanguage();
  const {
    consumer,
    logout,
    isAuthenticated,
    loading: authLoading,
    refreshSession,
    sendPhoneChangeCode,
    verifyPhoneChangeCode,
  } = useConsumer();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [changePhoneOpen, setChangePhoneOpen] = useState(false);
  const [phoneChangeNotice, setPhoneChangeNotice] = useState("");
  const [eduEmailInput, setEduEmailInput] = useState("");
  const [eduBusy, setEduBusy] = useState(false);
  const [eduNotice, setEduNotice] = useState("");
  const [eduError, setEduError] = useState("");
  const [eduStatus, setEduStatus] = useState(null);

  const [dietPrefs, setDietPrefs] = useState({});
  const [allergenPrefs, setAllergenPrefs] = useState({});
  const [allergenNoneSelected, setAllergenNoneSelected] = useState(false);
  const [foodsToAvoid, setFoodsToAvoid] = useState({});
  const [savedLocations, setSavedLocations] = useState([]);
  const [myClusters, setMyClusters] = useState([]);
  const [coinsWallet, setCoinsWallet] = useState({
    balance_cents: 0,
    lifetime_earned_cents: 0,
    lifetime_redeemed_cents: 0,
  });

  const [likedMeals, setLikedMeals] = useState([]);
  const [mealsToUnlike, setMealsToUnlike] = useState(new Set());

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setPageError(null);
      const [data, avoidData, likedData, clusterData] = await Promise.all([
        getConsumerProfile(),
        getFoodsToAvoid().catch(() => ({ foods_to_avoid: [] })),
        getLikedMenuItems().catch(() => ({ likes: [] })),
        fetchMyClusters().catch(() => ({ clusters: [] })),
      ]);
      const { profile, dietary_preferences, allergen_preferences, saved_locations, coins_wallet, consumer: profileConsumer } = data;

      const avoidMap = {};
      for (const key of avoidData?.foods_to_avoid || []) {
        avoidMap[key] = true;
      }
      setFoodsToAvoid(avoidMap);

      setDisplayName(profile.display_name || "");
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEduStatus(getEduVerificationFromConsumer(profileConsumer || {}));
      setEduNotice("");
      setEduError("");

      const dietMap = {};
      for (const pref of dietary_preferences || []) {
        dietMap[pref.preference_key] = pref.is_enabled;
      }
      setDietPrefs(dietMap);

      const allergenMap = {};
      for (const pref of allergen_preferences || []) {
        allergenMap[pref.allergen_key] = pref.is_enabled;
      }
      setAllergenPrefs(allergenMap);
      setAllergenNoneSelected(
        Array.isArray(allergen_preferences) &&
        allergen_preferences.length > 0 &&
        !allergen_preferences.some((pref) => pref.is_enabled)
      );

      setLikedMeals(likedData?.likes || []);
      setMealsToUnlike(new Set());
      setSavedLocations(saved_locations || []);
      setMyClusters(Array.isArray(clusterData?.clusters) ? clusterData.clusters : []);
      setCoinsWallet({
        balance_cents: Number(coins_wallet?.balance_cents || 0),
        lifetime_earned_cents: Number(coins_wallet?.lifetime_earned_cents || 0),
        lifetime_redeemed_cents: Number(coins_wallet?.lifetime_redeemed_cents || 0),
      });
    } catch (err) {
      setPageError(err.message || "Failed to load profile");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/account/login", { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated) {
      loadProfile();
    }
  }, [authLoading, isAuthenticated, navigate, loadProfile]);

  function toggleDiet(key, value) {
    setDietPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFoodToAvoid(key, value) {
    setFoodsToAvoid((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAllergen(key, value) {
    if (key === ALLERGEN_NONE_KEY) {
      setAllergenNoneSelected(value);
      if (value) {
        setAllergenPrefs(
          Object.fromEntries(ALLERGEN_OPTIONS.map(({ key: allergenKey }) => [allergenKey, false]))
        );
      }
      return;
    }
    setAllergenNoneSelected(false);
    setAllergenPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSendEduVerification() {
    setEduBusy(true);
    setEduNotice("");
    setEduError("");
    try {
      const result = await sendEduVerification(eduEmailInput.trim());
      setEduNotice(result.message || "Check your .edu inbox for a verification link.");
      setEduEmailInput("");
    } catch (err) {
      setEduError(err.message || "Unable to start .edu verification");
    } finally {
      setEduBusy(false);
    }
  }

  async function saveProfilePreferences() {
    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const dietary_preferences = DIETARY_OPTIONS.map(({ key }) => ({
        key,
        is_enabled: Boolean(dietPrefs[key]),
      }));
      const allergen_preferences = ALLERGEN_OPTIONS.map(({ key }) => ({
        key,
        is_enabled: allergenNoneSelected ? false : Boolean(allergenPrefs[key]),
      }));
      const avoid_keys = FOODS_TO_AVOID_OPTIONS
        .filter(({ key }) => Boolean(foodsToAvoid[key]))
        .map(({ key }) => key);

      const unlikes = [...mealsToUnlike].map((id) => unlikeMenuItem(id));
      await Promise.all([
        updateConsumerProfile({
          display_name: displayName.trim() || null,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
        }),
        updatePreferences({
          dietary_preferences,
          allergen_preferences,
        }),
        updateFoodsToAvoid(avoid_keys),
        ...unlikes,
      ]);

      const likedData = await getLikedMenuItems().catch(() => ({ likes: [] }));
      setLikedMeals(likedData?.likes || []);
      setMealsToUnlike(new Set());
      await refreshSession().catch(() => {});
      const hasEnabledPrefs =
        dietary_preferences.some((row) => row.is_enabled) ||
        allergen_preferences.some((row) => row.is_enabled);
      if (hasEnabledPrefs) resetMenuPreferenceSessionForLogin();
      setSaveMessage("Profile preferences saved.");
    } catch (err) {
      setSaveError(err.message || "Could not save profile preferences.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (authLoading || pageLoading) {
    return (
      <>
      <StickyPageHeader title={t("consumer.profile.title", "My account")} />
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.subheading}>Loading your account…</p>
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  if (pageError) {
    return (
      <>
      <StickyPageHeader title={t("consumer.profile.title", "My account")} />
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.errorBlock}>{pageError}</p>
          <button onClick={loadProfile} style={styles.retryBtn}>Retry</button>
        </div>
      </div>
      <BottomNav />
      </>
    );
  }

  const defaultLoc = savedLocations.find((location) => location.is_default);
  const locationSummary = defaultLoc
    ? [
        defaultLoc.label || "",
        [defaultLoc.city, defaultLoc.state].filter(Boolean).join(", "),
      ].filter(Boolean).join(" — ")
    : "";
  const supportContactName =
    [firstName, lastName].filter(Boolean).join(" ") || displayName.trim();

  return (
    <>
    <StickyPageHeader title={t("consumer.profile.title", "My account")} />
    <div style={styles.page}>
      <div style={styles.pageInner}>
        <h1 style={styles.pageTitle}>Account Settings</h1>

        <Section title="Send Feedback">
          <p style={styles.sectionDesc}>
            Tell a restaurant privately how a recent Menuply order went. You can
            send feedback anytime within 45 days of a completed order.
          </p>
          <Link to="/account/feedback" style={styles.followingLink}>
            Send Feedback
          </Link>
        </Section>

        <Section title="Following">
          <p style={styles.sectionDesc}>
            See the restaurants you follow and remove them from one place.
          </p>
          <Link to="/account/following" style={styles.followingLink}>Open Following feed</Link>
        </Section>

        <Section title="My Clusters">
          {myClusters.length === 0 ? (
            <p style={styles.sectionDesc}>You have not created any clusters yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {myClusters.map((cluster) => (
                <div key={cluster.id} style={styles.currentLocation}>
                  <div style={{ flex: 1 }}>
                    <strong>{cluster.name}</strong>
                    <div style={styles.locationHint}>
                      {cluster.visibility} · {cluster.status} · {cluster.restaurant_count || 0} restaurants
                    </div>
                    <div style={styles.locationHint}>
                      <Link to={`/clusters`}>Open directory</Link>
                      {" · "}
                      <span>{cluster.share_token ? "Share link ready" : "Share link unavailable"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Account">
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Email</label>
            <p style={styles.readOnly}>{consumer?.email}</p>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={styles.input}
                placeholder="First name"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={styles.input}
                placeholder="Last name"
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>Display name <span style={styles.optText}>(optional)</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={styles.input}
              placeholder="How you want to be known"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>
              Phone <span style={styles.optText}>(verified)</span>
            </label>
            <div style={styles.phoneRow}>
              <input
                type="tel"
                value={consumer?.phone_number || ""}
                readOnly
                style={{ ...styles.input, ...styles.inputReadonly }}
                placeholder="No verified phone"
                aria-label="Verified phone number"
              />
              <button
                type="button"
                onClick={() => {
                  setPhoneChangeNotice("");
                  setChangePhoneOpen(true);
                }}
                style={styles.changePhoneBtn}
              >
                Change phone
              </button>
            </div>
            {phoneChangeNotice ? (
              <div style={{ marginTop: 8, fontSize: 13, color: "#14532d", fontWeight: 700 }}>
                {phoneChangeNotice}
              </div>
            ) : null}
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>
              School verification <span style={styles.optText}>(optional .edu)</span>
            </label>
            {eduStatus?.edu_verified ? (
              <>
                <p style={{ ...styles.readOnly, color: "#14532d", fontWeight: 700 }}>
                  {eduStatus.badge}
                </p>
                <p style={styles.sectionDesc}>
                  Shows school affiliation only. Does not prove current enrollment.
                  Your .edu email is never shown publicly.
                </p>
              </>
            ) : (
              <>
                <p style={styles.sectionDesc}>
                  Optionally verify a school email ending in .edu. This is an affiliation signal —
                  not enrollment proof — and is not required to use Menuply.
                </p>
                <div style={styles.phoneRow}>
                  <input
                    type="email"
                    value={eduEmailInput}
                    onChange={(e) => setEduEmailInput(e.target.value)}
                    style={styles.input}
                    placeholder="you@school.edu"
                    aria-label="School .edu email"
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    onClick={handleSendEduVerification}
                    disabled={eduBusy || !eduEmailInput.trim()}
                    style={styles.changePhoneBtn}
                  >
                    {eduBusy ? "Sending…" : "Send link"}
                  </button>
                </div>
                {eduNotice ? (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#14532d", fontWeight: 700 }}>
                    {eduNotice}
                  </div>
                ) : null}
                {eduError ? (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#b91c1c", fontWeight: 700 }}>
                    {eduError}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </Section>

        <Section title="Food Preferences">
          <p style={styles.sectionDesc}>
            Select your dietary preferences. These personalize discovery without needing a separate save step.
          </p>
          <div style={styles.prefGrid}>
            {DIETARY_OPTIONS.map(({ key, label }) => (
              <PreferenceToggle
                key={key}
                label={label}
                checked={Boolean(dietPrefs[key])}
                onChange={(value) => toggleDiet(key, value)}
              />
            ))}
          </div>
        </Section>

        <Section title="Foods I Avoid">
          <p style={styles.sectionDesc}>
            Tell Waiter what you usually do not want recommended. These are not hard filters — items stay on the menu and show a soft “may contain” notice when relevant. Searching for a food you avoid will still show it.
          </p>
          <div style={styles.prefGrid}>
            {FOODS_TO_AVOID_OPTIONS.map(({ key, label }) => (
              <PreferenceToggle
                key={key}
                label={label}
                checked={Boolean(foodsToAvoid[key])}
                onChange={(value) => toggleFoodToAvoid(key, value)}
              />
            ))}
          </div>
        </Section>

        <Section title="Allergen Exclusions" id="allergen-preferences">
          <p style={styles.sectionDesc}>
            Select allergens you want to avoid. Choose None if you do not want any allergen exclusions. These settings control the allergen filter status shown across discovery.
          </p>
          <div style={styles.prefGrid}>
            <PreferenceToggle
              key={ALLERGEN_NONE_KEY}
              label="None"
              checked={allergenNoneSelected}
              onChange={(value) => toggleAllergen(ALLERGEN_NONE_KEY, value)}
            />
            {ALLERGEN_OPTIONS.map(({ key, label }) => (
              <PreferenceToggle
                key={key}
                label={label}
                checked={Boolean(allergenPrefs[key])}
                disabled={allergenNoneSelected}
                onChange={(value) => toggleAllergen(key, value)}
              />
            ))}
          </div>
        </Section>

        <Section title="Meals You've Liked" id="meals-liked">
          <p style={styles.sectionDesc}>
            Uncheck any meal to remove it from your liked list.
          </p>
          {likedMeals.length === 0 ? (
            <p style={styles.sectionDesc}>No liked meals yet. Like dishes from any menu to see them here.</p>
          ) : (
            <div style={styles.prefGrid}>
              {likedMeals.map((meal) => (
                <PreferenceToggle
                  key={meal.menu_item_id}
                  label={`${meal.item_name} — ${meal.restaurant_name}`}
                  checked={!mealsToUnlike.has(meal.menu_item_id)}
                  onChange={(checked) => {
                    setMealsToUnlike((prev) => {
                      const next = new Set(prev);
                      if (!checked) next.add(meal.menu_item_id);
                      else next.delete(meal.menu_item_id);
                      return next;
                    });
                  }}
                />
              ))}
            </div>
          )}
        </Section>

        <Section title="Default Location">
          {locationSummary ? (
            <div style={styles.currentLocation}>
              <span style={styles.locationIcon}>📍</span>
              <div>
                <strong>{locationSummary}</strong>
                <div style={styles.locationHint}>
                  Change your default search location from Discovery.
                </div>
              </div>
            </div>
          ) : (
            <p style={styles.sectionDesc}>
              Default search location can be set or changed from the Discovery screen.
            </p>
          )}
        </Section>

        <Section title="Mx Coins">
          <p style={styles.sectionDesc}>
            Platform credit applied automatically toward qualifying Menuply Checkout orders.
          </p>
          <div style={styles.coinsGrid}>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Available balance</span>
              <strong style={styles.coinValue}>{formatMoney(coinsWallet.balance_cents)}</strong>
            </div>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Lifetime earned</span>
              <strong style={styles.coinValue}>{formatMoney(coinsWallet.lifetime_earned_cents)}</strong>
            </div>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Lifetime redeemed</span>
              <strong style={styles.coinValue}>{formatMoney(coinsWallet.lifetime_redeemed_cents)}</strong>
            </div>
          </div>
        </Section>

        <Section title="Change Your Password">
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={styles.input}
              placeholder="Current password"
              autoComplete="current-password"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
              placeholder="New password"
              autoComplete="new-password"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Confirm new password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              style={styles.input}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>
          <div style={styles.saveRow}>
            <button
              type="button"
              onClick={handleChangePassword}
              style={{ ...styles.saveBtn, ...(passwordSaving ? styles.saveBtnDisabled : null) }}
              disabled={passwordSaving}
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
            <SaveStatus status={passwordError || passwordMessage} isError={Boolean(passwordError)} />
          </div>
        </Section>

        <Section title={t("consumer.profile.support", "Support")}>
          <p style={styles.sectionDesc}>
            {t(
              "consumer.profile.supportDesc",
              "Need help with your account, search, restaurant information, or the app? Contact Menuply Support."
            )}
          </p>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            style={styles.supportBtn}
          >
            {t("consumer.profile.contactSupport", "Contact Support")}
          </button>
        </Section>

        <Section title="Save">
          <p style={styles.sectionDesc}>
            Save all profile preferences in one action.
          </p>
          <div style={styles.saveRow}>
            <button
              type="button"
              onClick={saveProfilePreferences}
              style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : null) }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile Preferences"}
            </button>
            <SaveStatus status={saveError || saveMessage} isError={Boolean(saveError)} />
          </div>
          {saveMessage ? (
            <div style={styles.discoveryCtaRow}>
              <button type="button" onClick={() => navigate("/")} style={styles.discoveryBtn}>
                Go to Discovery
              </button>
            </div>
          ) : null}
        </Section>
        <Section title={t("consumer.profile.signOut", "Sign out")}>
          <button type="button" onClick={handleLogout} style={styles.logoutBtn}>Log out</button>
        </Section>
      </div>
    </div>
    <BottomNav />
    {supportOpen ? (
      <DinerSupportDialog
        open
        onClose={() => setSupportOpen(false)}
        initialName={supportContactName}
        initialEmail={consumer?.email || ""}
      />
    ) : null}
    <SmsAuthModal
      open={changePhoneOpen}
      purpose="changePhone"
      sendSmsCode={sendPhoneChangeCode}
      verifySmsCode={verifyPhoneChangeCode}
      onClose={() => setChangePhoneOpen(false)}
      onSuccess={async () => {
        setPhoneChangeNotice("Phone number updated.");
        await refreshSession().catch(() => {});
      }}
    />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "0 0 calc(80px + env(safe-area-inset-bottom, 0px))",
  },
  pageInner: {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "0 16px",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 0",
    borderBottom: "1px solid #1F2937",
    marginBottom: "32px",
  },
  brand: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#22C55E",
    textDecoration: "none",
  },
  logoutBtn: {
    background: "none",
    border: "1.5px solid #374151",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    color: "#9CA3AF",
    fontFamily: "inherit",
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: "32px",
  },
  section: {
    background: "#121A14",
    borderRadius: "14px",
    padding: "28px",
    marginBottom: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#FFFFFF",
    margin: "0 0 16px",
  },
  sectionDesc: {
    fontSize: "14px",
    color: "#9CA3AF",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
    marginBottom: "14px",
  },
  row: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  fieldLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#D1D5DB",
  },
  optText: {
    fontWeight: 400,
    color: "#6B7280",
    fontSize: "12px",
  },
  readOnly: {
    fontSize: "15px",
    color: "#FFFFFF",
    margin: 0,
    padding: "10px 14px",
    background: "#0B0F0C",
    borderRadius: "8px",
    border: "1.5px solid #1F2937",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #374151",
    background: "#1A2419",
    color: "#FFFFFF",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  phoneRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  inputReadonly: {
    background: "#0B0F0C",
    borderColor: "#1F2937",
    color: "#D1D5DB",
    cursor: "default",
    flex: "1 1 180px",
  },
  changePhoneBtn: {
    border: "1.5px solid #374151",
    borderRadius: "8px",
    background: "#11211a",
    color: "#fff",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  saveRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginTop: "6px",
    flexWrap: "wrap",
  },
  saveBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontSize: "14px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  saveBtnDisabled: {
    opacity: 0.72,
    cursor: "default",
  },
  saveStatus: {
    fontSize: "13px",
    fontWeight: 600,
  },
  prefGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "10px",
  },
  prefToggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#22C55E",
    flexShrink: 0,
  },
  prefLabel: {
    fontSize: "14px",
    color: "#FFFFFF",
  },
  coinsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  prefToggleDisabled: {
    opacity: 0.52,
    cursor: "not-allowed",
  },
  coinTile: {
    borderRadius: "12px",
    border: "1px solid #1F2937",
    background: "#1A2419",
    padding: "14px 16px",
    display: "grid",
    gap: "6px",
  },
  coinLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  coinValue: {
    fontSize: "22px",
    color: "#FFFFFF",
  },
  currentLocation: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "14px 16px",
    background: "#0B0F0C",
    borderRadius: "10px",
  },
  locationIcon: {
    fontSize: "18px",
    lineHeight: 1,
  },
  locationHint: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#9CA3AF",
    fontWeight: 500,
  },
  discoveryCtaRow: {
    marginTop: "14px",
    display: "flex",
    alignItems: "center",
  },
  discoveryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #374151",
    background: "#121A14",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  followingLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "10px",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  supportBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "1.5px solid #374151",
    background: "#1A2419",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  card: {
    maxWidth: "520px",
    margin: "80px auto 0",
    padding: "28px",
    background: "#121A14",
    borderRadius: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  subheading: {
    fontSize: "15px",
    color: "#9CA3AF",
    marginTop: "14px",
  },
  errorBlock: {
    fontSize: "15px",
    color: "#F87171",
    marginTop: "14px",
    lineHeight: 1.6,
  },
  retryBtn: {
    marginTop: "16px",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
