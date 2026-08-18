/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/consumer/ConsumerProfile.jsx
 * Purpose:
 *   Consumer /account dashboard — four tabs:
 *   Profile, Social & Crew, Wallet & Activity, Security & Account.
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import AccountTabNav from "./accountDashboard/AccountTabNav.jsx";
import ProfileTab from "./accountDashboard/ProfileTab.jsx";
import SocialCrewTab from "./accountDashboard/SocialCrewTab.jsx";
import WalletActivityTab from "./accountDashboard/WalletActivityTab.jsx";
import SecurityAccountTab from "./accountDashboard/SecurityAccountTab.jsx";
import {
  ALLERGEN_NONE_KEY,
  ALLERGEN_OPTIONS,
  DIETARY_OPTIONS,
  FOODS_TO_AVOID_OPTIONS,
  normalizeAccountTab,
} from "./accountDashboard/accountDashboardOptions.js";
import { accountStyles as styles } from "./accountDashboard/accountDashboardStyles.js";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeAccountTab(searchParams.get("tab"));

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [homeZip, setHomeZip] = useState("");
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
  const [unlikeBusyId, setUnlikeBusyId] = useState(null);
  const [unlikeError, setUnlikeError] = useState("");

  const [identitySaving, setIdentitySaving] = useState(false);
  const [identityStatus, setIdentityStatus] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [zipSaving, setZipSaving] = useState(false);
  const [zipStatus, setZipStatus] = useState("");
  const [zipError, setZipError] = useState("");
  const [dietStatus, setDietStatus] = useState("");
  const [dietError, setDietError] = useState("");
  const [allergenStatus, setAllergenStatus] = useState("");
  const [allergenError, setAllergenError] = useState("");
  const [avoidStatus, setAvoidStatus] = useState("");
  const [avoidError, setAvoidError] = useState("");
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
      const {
        profile,
        dietary_preferences,
        allergen_preferences,
        saved_locations,
        coins_wallet,
        consumer: profileConsumer,
      } = data;

      const avoidMap = {};
      for (const key of avoidData?.foods_to_avoid || []) {
        avoidMap[key] = true;
      }
      setFoodsToAvoid(avoidMap);

      setDisplayName(profile.display_name || "");
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setHomeZip(profile.home_zip || "");
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

  function setTab(id) {
    const next = new URLSearchParams(searchParams);
    if (id === "profile") next.delete("tab");
    else next.set("tab", id);
    setSearchParams(next, { replace: true });
  }

  function maybeResetMenuPrefs(nextDiet, nextAllergen, noneSelected) {
    const dietOn = DIETARY_OPTIONS.some(({ key }) => Boolean(nextDiet[key]));
    const allergenOn =
      !noneSelected && ALLERGEN_OPTIONS.some(({ key }) => Boolean(nextAllergen[key]));
    if (dietOn || allergenOn) resetMenuPreferenceSessionForLogin();
  }

  async function handleSaveIdentity() {
    setIdentitySaving(true);
    setIdentityStatus("");
    setIdentityError("");
    try {
      await updateConsumerProfile({
        display_name: displayName.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
      });
      await refreshSession().catch(() => {});
      setIdentityStatus("Saved");
      return true;
    } catch (err) {
      setIdentityError(err.message || "Could not save profile information.");
      return false;
    } finally {
      setIdentitySaving(false);
    }
  }

  async function handleSaveHomeZip() {
    const trimmed = String(homeZip || "").trim();
    if (trimmed && !/^\d{5}(-\d{4})?$/.test(trimmed)) {
      setZipError("Enter a valid 5-digit Zip Code");
      setZipStatus("");
      return false;
    }
    setZipSaving(true);
    setZipStatus("");
    setZipError("");
    try {
      await updateConsumerProfile({ home_zip: trimmed || null });
      setHomeZip(trimmed);
      setZipStatus("Saved");
      return true;
    } catch (err) {
      setZipError(err.message || "Could not save zip.");
      return false;
    } finally {
      setZipSaving(false);
    }
  }

  async function handleToggleDiet(key, value) {
    const previous = dietPrefs;
    const next = { ...dietPrefs, [key]: value };
    setDietPrefs(next);
    setDietStatus("Saving…");
    setDietError("");
    try {
      await updatePreferences({
        dietary_preferences: DIETARY_OPTIONS.map((opt) => ({
          key: opt.key,
          is_enabled: Boolean(next[opt.key]),
        })),
      });
      maybeResetMenuPrefs(next, allergenPrefs, allergenNoneSelected);
      setDietStatus("Saved");
    } catch (err) {
      setDietPrefs(previous);
      setDietStatus("");
      setDietError(err.message || "Could not save dietary preferences.");
    }
  }

  async function handleToggleAllergen(key, value) {
    const previousPrefs = allergenPrefs;
    const previousNone = allergenNoneSelected;
    let nextPrefs = allergenPrefs;
    let nextNone = allergenNoneSelected;

    if (key === ALLERGEN_NONE_KEY) {
      nextNone = value;
      if (value) {
        nextPrefs = Object.fromEntries(ALLERGEN_OPTIONS.map(({ key: k }) => [k, false]));
      }
    } else {
      nextNone = false;
      nextPrefs = { ...allergenPrefs, [key]: value };
    }

    setAllergenNoneSelected(nextNone);
    setAllergenPrefs(nextPrefs);
    setAllergenStatus("Saving…");
    setAllergenError("");
    try {
      await updatePreferences({
        allergen_preferences: ALLERGEN_OPTIONS.map((opt) => ({
          key: opt.key,
          is_enabled: nextNone ? false : Boolean(nextPrefs[opt.key]),
        })),
      });
      maybeResetMenuPrefs(dietPrefs, nextPrefs, nextNone);
      setAllergenStatus("Saved");
    } catch (err) {
      setAllergenPrefs(previousPrefs);
      setAllergenNoneSelected(previousNone);
      setAllergenStatus("");
      setAllergenError(err.message || "Could not save allergen preferences.");
    }
  }

  async function handleToggleFoodToAvoid(key, value) {
    const previous = foodsToAvoid;
    const next = { ...foodsToAvoid, [key]: value };
    setFoodsToAvoid(next);
    setAvoidStatus("Saving…");
    setAvoidError("");
    try {
      const avoid_keys = FOODS_TO_AVOID_OPTIONS.filter(({ key: k }) => Boolean(next[k])).map(
        ({ key: k }) => k
      );
      await updateFoodsToAvoid(avoid_keys);
      setAvoidStatus("Saved");
    } catch (err) {
      setFoodsToAvoid(previous);
      setAvoidStatus("");
      setAvoidError(err.message || "Could not save avoided ingredients.");
    }
  }

  async function handleUnlikeMeal(id) {
    setUnlikeBusyId(id);
    setUnlikeError("");
    try {
      await unlikeMenuItem(id);
      setLikedMeals((prev) => prev.filter((meal) => meal.menu_item_id !== id));
    } catch (err) {
      setUnlikeError(err.message || "Could not remove liked meal.");
    } finally {
      setUnlikeBusyId(null);
    }
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
        <StickyPageHeader title={t("consumer.profile.title", "Settings")} />
        <div style={styles.page}>
          <div style={styles.card}>
            <p style={styles.muted}>Loading your account…</p>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  if (pageError) {
    return (
      <>
        <StickyPageHeader title={t("consumer.profile.title", "Settings")} />
        <div style={styles.page}>
          <div style={styles.card}>
            <p style={styles.statusErr}>{pageError}</p>
            <button onClick={loadProfile} style={styles.retryBtn}>
              Retry
            </button>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  const defaultLoc = savedLocations.find((location) => location.is_default);
  const locationSummary = defaultLoc
    ? [defaultLoc.label || "", [defaultLoc.city, defaultLoc.state].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join(" — ")
    : "";
  const supportContactName = [firstName, lastName].filter(Boolean).join(" ") || displayName.trim();

  return (
    <>
      <StickyPageHeader title={t("consumer.profile.title", "Settings")} />
      <div style={styles.page}>
        <div style={styles.pageInner}>
          <h1 style={styles.pageTitle}>Settings</h1>
          <p style={styles.pageLead}>
            Private preferences, wallet, and account security. Your food life lives on My Menuply.
          </p>
          <AccountTabNav activeTab={activeTab} onChange={setTab} />

          {activeTab === "profile" ? (
            <ProfileTab
              firstName={firstName}
              lastName={lastName}
              displayName={displayName}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onDisplayNameChange={setDisplayName}
              onSaveIdentity={handleSaveIdentity}
              identitySaving={identitySaving}
              identityStatus={identityStatus}
              identityError={identityError}
              homeZip={homeZip}
              onHomeZipChange={setHomeZip}
              onSaveHomeZip={handleSaveHomeZip}
              zipSaving={zipSaving}
              zipStatus={zipStatus}
              zipError={zipError}
              locationSummary={locationSummary}
              dietPrefs={dietPrefs}
              onToggleDiet={handleToggleDiet}
              dietStatus={dietStatus}
              dietError={dietError}
              allergenPrefs={allergenPrefs}
              allergenNoneSelected={allergenNoneSelected}
              onToggleAllergen={handleToggleAllergen}
              allergenStatus={allergenStatus}
              allergenError={allergenError}
              foodsToAvoid={foodsToAvoid}
              onToggleFoodToAvoid={handleToggleFoodToAvoid}
              avoidStatus={avoidStatus}
              avoidError={avoidError}
              eduStatus={eduStatus}
              eduEmailInput={eduEmailInput}
              onEduEmailChange={setEduEmailInput}
              onSendEduVerification={handleSendEduVerification}
              eduBusy={eduBusy}
              eduNotice={eduNotice}
              eduError={eduError}
            />
          ) : null}

          {activeTab === "social" ? <SocialCrewTab /> : null}

          {activeTab === "wallet" ? (
            <WalletActivityTab
              coinsWallet={coinsWallet}
              likedMeals={likedMeals}
              onUnlikeMeal={handleUnlikeMeal}
              unlikeBusyId={unlikeBusyId}
              unlikeError={unlikeError}
              myClusters={myClusters}
            />
          ) : null}

          {activeTab === "security" ? (
            <SecurityAccountTab
              email={consumer?.email}
              phoneNumber={consumer?.phone_number}
              onChangePhone={() => {
                setPhoneChangeNotice("");
                setChangePhoneOpen(true);
              }}
              phoneChangeNotice={phoneChangeNotice}
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmNewPassword={confirmNewPassword}
              onCurrentPasswordChange={setCurrentPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmNewPassword}
              onChangePassword={handleChangePassword}
              passwordSaving={passwordSaving}
              passwordMessage={passwordMessage}
              passwordError={passwordError}
              onLogout={handleLogout}
              onOpenSupport={() => setSupportOpen(true)}
              supportTitle={t("consumer.profile.support", "Support")}
              supportDesc={t(
                "consumer.profile.supportDesc",
                "Need help with your account, search, restaurant information, or the app? Contact Menuply Support."
              )}
              supportButtonLabel={t("consumer.profile.contactSupport", "Contact Support")}
              signOutTitle={t("consumer.profile.signOut", "Sign out")}
            />
          ) : null}
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
