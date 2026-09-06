import React, { useState } from "react";
import { Link } from "react-router-dom";
import PrimaryLocationPicker from "../../../components/consumer/PrimaryLocationPicker.jsx";
import {
  ALLERGEN_NONE_KEY,
  ALLERGEN_OPTIONS,
  DIETARY_OPTIONS,
  FOODS_TO_AVOID_OPTIONS,
  formatSummaryList,
  selectedLabels,
} from "./accountDashboardOptions.js";
import { accountStyles as styles } from "./accountDashboardStyles.js";
import AccountActionLink from "./AccountActionLink.jsx";
import PreferenceChips from "./PreferenceChips.jsx";
import SummaryEditSection from "./SummaryEditSection.jsx";
import { summarizePersonalContext, FIELD_MAX, HOBBIES_MAX } from "../../../lib/dinerPersonalContext.js";
import {
  DISCOVERABILITY_UI_OPTIONS,
  discoverabilityLabel,
  discoverabilityForEditor,
  canonicalizeDiscoverability,
} from "../../../lib/dinerProfileDiscoverability.js";
import {
  ALL_FAVORITE_FOOD_OPTIONS,
  MAX_FAVORITES,
  summarizeFavoriteFoods,
  normalizeFavoriteFoods,
} from "../../../lib/dinerFavoriteFoods.js";
import { labelWithFoodIcon } from "../../../lib/foodInterestIcons.js";
import {
  DINER_SEX_OPTIONS,
  dinerSexLabel,
  summarizeDob,
} from "../../../lib/dinerDateOfBirth.js";

function SaveStatus({ status, isError }) {
  if (!status) return null;
  return (
    <p style={isError ? styles.statusErr : styles.statusOk} role="status">
      {status}
    </p>
  );
}

export default function ProfileTab({
  firstName,
  lastName,
  displayName,
  onFirstNameChange,
  onLastNameChange,
  onDisplayNameChange,
  onSaveIdentity,
  identitySaving,
  identityStatus,
  identityError,
  homeZip,
  onHomeZipChange,
  onSaveHomeZip,
  zipSaving,
  zipStatus,
  zipError,
  locationSummary,
  dietPrefs,
  onToggleDiet,
  dietStatus,
  dietError,
  allergenPrefs,
  allergenNoneSelected,
  onToggleAllergen,
  allergenStatus,
  allergenError,
  foodsToAvoid,
  onToggleFoodToAvoid,
  avoidStatus,
  avoidError,
  eduStatus,
  eduEmailInput,
  onEduEmailChange,
  onSendEduVerification,
  eduBusy,
  eduNotice,
  eduError,
  primaryLocation,
  onPrimaryLocationChange,
  primaryNeighborhood,
  onPrimaryNeighborhoodChange,
  primaryPostalCode,
  onPrimaryPostalCodeChange,
  onSavePrimaryLocation,
  primaryLocationSaving,
  primaryLocationStatus,
  primaryLocationError,
  discoverability,
  onDiscoverabilityChange,
  onSaveDiscoverability,
  discoverabilitySaving,
  discoverabilityStatus,
  discoverabilityError,
  showConnectionFoodActivity,
  onShowConnectionFoodActivityChange,
  onSaveConnectionFoodActivity,
  connectionFoodActivitySaving,
  connectionFoodActivityStatus,
  connectionFoodActivityError,
  dinerEducationStatus,
  onDinerEducationStatusChange,
  dinerFieldOfStudy,
  onDinerFieldOfStudyChange,
  dinerOccupation,
  onDinerOccupationChange,
  dinerHometown,
  onDinerHometownChange,
  dinerHobbies,
  onDinerHobbiesChange,
  onSavePersonalContext,
  personalContextSaving,
  personalContextStatus,
  personalContextError,
  dinerSex,
  onDinerSexChange,
  dateOfBirth,
  onDateOfBirthChange,
  onSaveBasicProfile,
  basicProfileSaving,
  basicProfileStatus,
  basicProfileError,
  favoriteFoods,
  onToggleFavoriteFood,
  onSaveFavoriteFoods,
  favoriteFoodsSaving,
  favoriteFoodsStatus,
  favoriteFoodsError,
}) {
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [editingZip, setEditingZip] = useState(false);
  const [editingDiet, setEditingDiet] = useState(false);
  const [editingAllergens, setEditingAllergens] = useState(false);
  const [editingAvoid, setEditingAvoid] = useState(false);
  const [editingEdu, setEditingEdu] = useState(false);
  const [editingPrimaryLocation, setEditingPrimaryLocation] = useState(false);
  const [editingDiscoverability, setEditingDiscoverability] = useState(false);
  const [editingConnectionFoodActivity, setEditingConnectionFoodActivity] = useState(false);
  const [editingPersonalContext, setEditingPersonalContext] = useState(false);
  const [editingBasicProfile, setEditingBasicProfile] = useState(false);
  const [editingFavoriteFoods, setEditingFavoriteFoods] = useState(false);

  const discoverabilityEditorValue = discoverabilityForEditor(discoverability);

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const identitySummary = [displayName || fullName || "Add your name", fullName && displayName ? fullName : ""]
    .filter(Boolean)
    .join(" · ");

  const dietSummary = formatSummaryList(selectedLabels(dietPrefs, DIETARY_OPTIONS));
  const allergenSummary = allergenNoneSelected
    ? "None"
    : formatSummaryList(selectedLabels(allergenPrefs, ALLERGEN_OPTIONS));
  const avoidSummary = formatSummaryList(selectedLabels(foodsToAvoid, FOODS_TO_AVOID_OPTIONS));
  const personalContextSummary = summarizePersonalContext({
    diner_education_status: dinerEducationStatus,
    diner_field_of_study: dinerFieldOfStudy,
    diner_occupation: dinerOccupation,
    diner_hometown: dinerHometown,
    diner_hobbies: dinerHobbies,
  });
  const basicProfileSummary = [
    dinerSexLabel(dinerSex) || null,
    summarizeDob(dateOfBirth) !== "Not set" ? summarizeDob(dateOfBirth) : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Optional — unlocks birthday social later";
  const favoriteFoodsSummary = summarizeFavoriteFoods(favoriteFoods);
  const normalizedFavorites = normalizeFavoriteFoods(favoriteFoods);
  const favoriteKeySet = new Set(normalizedFavorites.map((f) => f.key));

  return (
    <div>
      <SummaryEditSection
        title="Profile information"
        id="profile-information"
        summary={identitySummary}
        editing={editingIdentity}
        onEdit={() => setEditingIdentity(true)}
        onDone={async () => {
          const ok = await onSaveIdentity();
          if (ok !== false) setEditingIdentity(false);
        }}
        status={identityError || identityStatus}
        statusError={Boolean(identityError)}
      >
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              style={styles.input}
              placeholder="First name"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              style={styles.input}
              placeholder="Last name"
            />
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.fieldLabel}>
            Screen name <span style={styles.optText}>(optional)</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            style={styles.input}
            placeholder="Choose a screen name"
          />
          <p style={styles.fieldHint}>
            If blank, friends see your first name and last initial (for example, Andre B.).
          </p>
        </div>
        <button
          type="button"
          onClick={onSaveIdentity}
          style={styles.primaryBtn}
          disabled={identitySaving}
        >
          {identitySaving ? "Saving…" : "Save name"}
        </button>
      </SummaryEditSection>

      <SummaryEditSection
        title="Sex & birthday"
        id="basic-profile"
        summary={basicProfileSummary}
        description="Optional. Birthday unlocks birthday-related social moments later — we store your date of birth and derive age (no separate age field)."
        editing={editingBasicProfile}
        onEdit={() => setEditingBasicProfile(true)}
        onDone={async () => {
          const ok = await onSaveBasicProfile();
          if (ok !== false) setEditingBasicProfile(false);
        }}
        editLabel={basicProfileSummary.startsWith("Optional") ? "Add" : "Edit"}
        status={basicProfileError || basicProfileStatus}
        statusError={Boolean(basicProfileError)}
      >
        <div style={styles.field}>
          <label style={styles.fieldLabel}>
            Sex <span style={styles.optText}>(optional)</span>
          </label>
          <select
            data-testid="diner-sex-select"
            value={dinerSex || ""}
            onChange={(e) => onDinerSexChange(e.target.value || "")}
            style={styles.input}
          >
            <option value="">Prefer not to set</option>
            {DINER_SEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.fieldLabel}>
            Date of birth <span style={styles.optText}>(optional)</span>
          </label>
          <input
            type="date"
            data-testid="diner-dob-input"
            value={dateOfBirth || ""}
            onChange={(e) => onDateOfBirthChange(e.target.value)}
            style={styles.input}
          />
          <p style={styles.fieldHint}>
            Used only to derive age and birthday moments. Full date stays private on your account.
          </p>
        </div>
        <button
          type="button"
          onClick={onSaveBasicProfile}
          style={styles.primaryBtn}
          disabled={basicProfileSaving}
        >
          {basicProfileSaving ? "Saving…" : "Save"}
        </button>
      </SummaryEditSection>

      <SummaryEditSection
        title="Favorite foods"
        id="favorite-foods"
        summary={favoriteFoodsSummary}
        description="Tap foods you love. Menuply uses these to surface better nearby food activity and discovery — not to build a preference database for its own sake."
        editing={editingFavoriteFoods}
        onEdit={() => setEditingFavoriteFoods(true)}
        onDone={async () => {
          const ok = await onSaveFavoriteFoods();
          if (ok !== false) setEditingFavoriteFoods(false);
        }}
        editLabel={normalizedFavorites.length ? "Edit" : "Add"}
        status={favoriteFoodsError || favoriteFoodsStatus}
        statusError={Boolean(favoriteFoodsError)}
      >
        <p style={{ ...styles.muted, fontSize: 13, margin: "0 0 10px" }}>
          Select up to {MAX_FAVORITES}. Icons are visual only — we save structured food keys.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_FAVORITE_FOOD_OPTIONS.map((opt) => {
            const on = favoriteKeySet.has(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                data-testid={`favorite-food-${opt.key}`}
                onClick={() => onToggleFavoriteFood(opt)}
                style={{
                  ...styles.chip,
                  ...(on ? styles.chipSelected : null),
                }}
              >
                {labelWithFoodIcon(opt.key, opt.label)}
              </button>
            );
          })}
        </div>
        <p style={{ ...styles.fieldHint, marginTop: 10 }}>
          Saving favorites personalizes what Menuply shows you next. Saying what you wanna eat will
          immediately open nearby discovery (Phase 2).
        </p>
        <button
          type="button"
          onClick={onSaveFavoriteFoods}
          style={styles.primaryBtn}
          disabled={favoriteFoodsSaving}
        >
          {favoriteFoodsSaving ? "Saving…" : "Save favorites"}
        </button>
      </SummaryEditSection>

      <SummaryEditSection
        title="Personal context"
        id="personal-context"
        summary={personalContextSummary}
        description="Optional short lines on your diner profile — class year, field, job, hometown, or hobbies. Shown beneath your name; not a full bio."
        editing={editingPersonalContext}
        onEdit={() => setEditingPersonalContext(true)}
        onDone={async () => {
          const ok = await onSavePersonalContext();
          if (ok !== false) setEditingPersonalContext(false);
        }}
        editLabel={personalContextSummary === "None added" ? "Add" : "Edit"}
        status={personalContextError || personalContextStatus}
        statusError={Boolean(personalContextError)}
      >
        <div style={styles.field}>
          <label style={styles.fieldLabel}>
            Occupation or profession <span style={styles.optText}>(optional)</span>
          </label>
          <input
            type="text"
            value={dinerOccupation}
            onChange={(e) => onDinerOccupationChange(e.target.value.slice(0, FIELD_MAX))}
            style={styles.input}
            placeholder="Software designer"
            maxLength={FIELD_MAX}
          />
          <p style={styles.fieldHint}>
            When set, this shows instead of school/class details below.
          </p>
        </div>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>
              Class year or status <span style={styles.optText}>(optional)</span>
            </label>
            <input
              type="text"
              value={dinerEducationStatus}
              onChange={(e) => onDinerEducationStatusChange(e.target.value.slice(0, FIELD_MAX))}
              style={styles.input}
              placeholder="Freshman"
              maxLength={FIELD_MAX}
              disabled={Boolean(String(dinerOccupation || "").trim())}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>
              Major or field <span style={styles.optText}>(optional)</span>
            </label>
            <input
              type="text"
              value={dinerFieldOfStudy}
              onChange={(e) => onDinerFieldOfStudyChange(e.target.value.slice(0, FIELD_MAX))}
              style={styles.input}
              placeholder="Biology"
              maxLength={FIELD_MAX}
              disabled={Boolean(String(dinerOccupation || "").trim())}
            />
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.fieldLabel}>
            Hometown <span style={styles.optText}>(optional)</span>
          </label>
          <input
            type="text"
            value={dinerHometown}
            onChange={(e) => onDinerHometownChange(e.target.value.slice(0, FIELD_MAX))}
            style={styles.input}
            placeholder="Houston, TX"
            maxLength={FIELD_MAX}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.fieldLabel}>
            Hobbies <span style={styles.optText}>(optional)</span>
          </label>
          <input
            type="text"
            value={dinerHobbies}
            onChange={(e) => onDinerHobbiesChange(e.target.value.slice(0, HOBBIES_MAX))}
            style={styles.input}
            placeholder="Hiking, live music, cooking"
            maxLength={HOBBIES_MAX}
          />
        </div>
        <button
          type="button"
          onClick={onSavePersonalContext}
          style={styles.primaryBtn}
          disabled={personalContextSaving}
        >
          {personalContextSaving ? "Saving…" : "Save personal context"}
        </button>
      </SummaryEditSection>

      <SummaryEditSection
        title="Location"
        summary={
          primaryLocation?.public_label
            ? `📍 ${primaryLocation.public_label}`
            : "Add where you're generally based"
        }
        description="Your primary location is where you're generally based — not live GPS. Only city and state appear on your public profile."
        editing={editingPrimaryLocation}
        onEdit={() => setEditingPrimaryLocation(true)}
        onDone={async () => {
          const ok = await onSavePrimaryLocation();
          if (ok !== false) setEditingPrimaryLocation(false);
        }}
        editLabel={primaryLocation?.public_label ? "Change" : "Add"}
        status={primaryLocationError || primaryLocationStatus}
        statusError={Boolean(primaryLocationError)}
      >
        <PrimaryLocationPicker
          value={primaryLocation}
          onChange={onPrimaryLocationChange}
          neighborhood={primaryNeighborhood}
          onNeighborhoodChange={onPrimaryNeighborhoodChange}
          postalCode={primaryPostalCode}
          onPostalCodeChange={onPrimaryPostalCodeChange}
          disabled={primaryLocationSaving}
        />
        <button
          type="button"
          onClick={onSavePrimaryLocation}
          style={styles.primaryBtn}
          disabled={primaryLocationSaving}
        >
          {primaryLocationSaving ? "Saving…" : "Save location"}
        </button>
      </SummaryEditSection>

      <SummaryEditSection
        title="Make my profile discoverable by"
        summary={discoverabilityLabel(discoverability)}
        description="Audience preference for activity surfaces (for example dining intent). Find Diners already lets signed-in members search by name, phone, email, hometown, or city. (A future .edu-only audience may be added later.)"
        editing={editingDiscoverability}
        onEdit={() => setEditingDiscoverability(true)}
        onDone={async () => {
          const ok = await onSaveDiscoverability();
          if (ok !== false) setEditingDiscoverability(false);
        }}
        status={discoverabilityError || discoverabilityStatus}
        statusError={Boolean(discoverabilityError)}
      >
        {canonicalizeDiscoverability(discoverability) === "nobody" ? (
          <p style={{ ...styles.statusErr, marginBottom: 8 }} role="status">
            Your profile still has a legacy hidden setting. Choose an audience below to update it.
          </p>
        ) : null}
        <div style={{ display: "grid", gap: 8 }}>
          {DISCOVERABILITY_UI_OPTIONS.map((opt) => (
            <label key={opt.value} style={styles.choiceRow}>
              <input
                type="radio"
                name="discoverability"
                value={opt.value}
                checked={discoverabilityEditorValue === opt.value}
                onChange={() => onDiscoverabilityChange(opt.value)}
              />
              <span>
                <span style={{ display: "block" }}>{opt.label}</span>
                <span style={{ ...styles.muted, fontSize: 12 }}>{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={onSaveDiscoverability}
          style={styles.primaryBtn}
          disabled={discoverabilitySaving || !discoverabilityEditorValue}
        >
          {discoverabilitySaving ? "Saving…" : "Save privacy setting"}
        </button>
      </SummaryEditSection>

      <SummaryEditSection
        title="Show my connections’ food activity"
        summary={showConnectionFoodActivity !== false ? "On" : "Off"}
        description="See which restaurants and menu items your Menuply connections like, have eaten, or plan to eat."
        editing={editingConnectionFoodActivity}
        onEdit={() => setEditingConnectionFoodActivity(true)}
        onDone={async () => {
          const ok = await onSaveConnectionFoodActivity();
          if (ok !== false) setEditingConnectionFoodActivity(false);
        }}
        status={connectionFoodActivityError || connectionFoodActivityStatus}
        statusError={Boolean(connectionFoodActivityError)}
      >
        <label style={styles.choiceRow}>
          <input
            type="checkbox"
            checked={showConnectionFoodActivity !== false}
            onChange={(e) => onShowConnectionFoodActivityChange(e.target.checked)}
          />
          <span>
            <span style={{ display: "block" }}>Show connection food activity</span>
            <span style={{ ...styles.muted, fontSize: 12 }}>
              Default is ON. Turn off to hide connection signals on restaurant and menu item pages.
            </span>
          </span>
        </label>
        <button
          type="button"
          onClick={onSaveConnectionFoodActivity}
          style={styles.primaryBtn}
          disabled={connectionFoodActivitySaving}
        >
          {connectionFoodActivitySaving ? "Saving…" : "Save preference"}
        </button>
      </SummaryEditSection>

      <section style={styles.section}>
        <AccountActionLink
          to="/account/diner-qr"
          title="My Diner QR"
          description="Your personal Menuply QR — others scan to connect with you."
          last
        />
      </section>
      <section style={styles.section}>
        <AccountActionLink
          to="/account/diner-qr?share=1"
          title="Share My Menuply"
          description="Opens your Diner Card share sheet — Copy Link is primary."
          actionLabel="Share"
          last
        />
      </section>

      <SummaryEditSection
        title="Dining preferences"
        summary={
          [locationSummary || "No default search location", homeZip ? `Zip ${homeZip}` : ""]
            .filter(Boolean)
            .join(" · ")
        }
        description="Home zip helps Menuply place you near food. Default search location is set from Discovery."
        editing={editingZip}
        onEdit={() => setEditingZip(true)}
        onDone={async () => {
          const ok = await onSaveHomeZip();
          if (ok !== false) setEditingZip(false);
        }}
        editLabel="Edit zip"
        status={zipError || zipStatus}
        statusError={Boolean(zipError)}
      >
        {locationSummary ? (
          <p style={styles.sectionDesc}>{locationSummary}</p>
        ) : (
          <p style={styles.sectionDesc}>No default search location yet.</p>
        )}
        <p style={{ margin: "0 0 12px" }}>
          <Link to="/" style={styles.textBtn}>
            Set location on Discovery
          </Link>
        </p>
        <div style={styles.field}>
          <label style={styles.fieldLabel}>Home zip</label>
          <input
            type="text"
            inputMode="numeric"
            value={homeZip}
            onChange={(e) => onHomeZipChange(e.target.value)}
            style={styles.input}
            placeholder="90210"
            maxLength={10}
          />
        </div>
        <button type="button" onClick={onSaveHomeZip} style={styles.primaryBtn} disabled={zipSaving}>
          {zipSaving ? "Saving…" : "Save zip"}
        </button>
      </SummaryEditSection>

      <SummaryEditSection
        title="Dietary preferences"
        summary={dietSummary}
        editing={editingDiet}
        onEdit={() => setEditingDiet(true)}
        onDone={() => setEditingDiet(false)}
        status={dietError || dietStatus}
        statusError={Boolean(dietError)}
      >
        <p style={styles.sectionDesc}>Tap a preference to save it immediately.</p>
        <PreferenceChips options={DIETARY_OPTIONS} selectedMap={dietPrefs} onToggle={onToggleDiet} />
      </SummaryEditSection>

      <SummaryEditSection
        id="allergen-preferences"
        title="Allergens"
        summary={allergenSummary}
        description="These exclusions control the allergen filter shown across discovery."
        editing={editingAllergens}
        onEdit={() => setEditingAllergens(true)}
        onDone={() => setEditingAllergens(false)}
        status={allergenError || allergenStatus}
        statusError={Boolean(allergenError)}
      >
        <p style={styles.sectionDesc}>Tap to save immediately. Choose None if you do not want exclusions.</p>
        <PreferenceChips
          options={ALLERGEN_OPTIONS}
          selectedMap={allergenPrefs}
          onToggle={onToggleAllergen}
          disabled={allergenNoneSelected}
          extraStart={
            <button
              type="button"
              aria-pressed={allergenNoneSelected}
              onClick={() => onToggleAllergen(ALLERGEN_NONE_KEY, !allergenNoneSelected)}
              style={{
                ...styles.chip,
                ...(allergenNoneSelected ? styles.chipSelected : null),
              }}
            >
              None
            </button>
          }
        />
      </SummaryEditSection>

      <SummaryEditSection
        title="Avoided ingredients"
        summary={avoidSummary}
        description="Tell Waiter what you usually do not want recommended. These are not hard filters — items stay on the menu."
        editing={editingAvoid}
        onEdit={() => setEditingAvoid(true)}
        onDone={() => setEditingAvoid(false)}
        status={avoidError || avoidStatus}
        statusError={Boolean(avoidError)}
      >
        <p style={styles.sectionDesc}>Tap to save immediately.</p>
        <PreferenceChips
          options={FOODS_TO_AVOID_OPTIONS}
          selectedMap={foodsToAvoid}
          onToggle={onToggleFoodToAvoid}
        />
      </SummaryEditSection>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>What I Ate Today</h2>
        <p style={styles.sectionDesc}>
          Optional dated food diary by meal — open the full calendar to log and browse your eating
          patterns.
        </p>
        <AccountActionLink
          to="/account/what-i-ate"
          title="Open food diary"
          description="Calendar, meal slots, and Connections-only sharing."
          actionLabel="Open"
          last
        />
      </section>

      <section style={{ ...styles.section, ...styles.sectionLast }}>
        <div style={styles.sectionHead}>
          <h2 style={styles.sectionTitle}>School verification</h2>
          {!eduStatus?.edu_verified ? (
            <button
              type="button"
              onClick={() => setEditingEdu((v) => !v)}
              style={styles.textBtn}
            >
              {editingEdu ? "Done" : "Add .edu"}
            </button>
          ) : null}
        </div>
        {eduStatus?.edu_verified ? (
          <>
            <p style={styles.summary}>{eduStatus.badge}</p>
            <p style={styles.sectionDesc}>
              Shows school affiliation only. Does not prove current enrollment. Your .edu email is
              never shown publicly.
            </p>
          </>
        ) : (
          <>
            <p style={styles.summary}>Not verified</p>
            {editingEdu ? (
              <>
                <p style={styles.sectionDesc}>
                  Optionally verify a school email ending in .edu. This is an affiliation signal — not
                  enrollment proof.
                </p>
                <div style={styles.phoneRow}>
                  <input
                    type="email"
                    value={eduEmailInput}
                    onChange={(e) => onEduEmailChange(e.target.value)}
                    style={styles.input}
                    placeholder="you@school.edu"
                    aria-label="School .edu email"
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    onClick={onSendEduVerification}
                    disabled={eduBusy || !eduEmailInput.trim()}
                    style={styles.secondaryBtn}
                  >
                    {eduBusy ? "Sending…" : "Send link"}
                  </button>
                </div>
                <SaveStatus status={eduNotice} />
                <SaveStatus status={eduError} isError />
              </>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
