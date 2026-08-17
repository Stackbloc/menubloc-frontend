import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import WhatIAteTodaySection from "../../../components/consumer/WhatIAteTodaySection.jsx";

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
}) {
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [editingZip, setEditingZip] = useState(false);
  const [editingDiet, setEditingDiet] = useState(false);
  const [editingAllergens, setEditingAllergens] = useState(false);
  const [editingAvoid, setEditingAvoid] = useState(false);
  const [editingEdu, setEditingEdu] = useState(false);

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const identitySummary = [displayName || fullName || "Add your name", fullName && displayName ? fullName : ""]
    .filter(Boolean)
    .join(" · ");

  const dietSummary = formatSummaryList(selectedLabels(dietPrefs, DIETARY_OPTIONS));
  const allergenSummary = allergenNoneSelected
    ? "None"
    : formatSummaryList(selectedLabels(allergenPrefs, ALLERGEN_OPTIONS));
  const avoidSummary = formatSummaryList(selectedLabels(foodsToAvoid, FOODS_TO_AVOID_OPTIONS));

  return (
    <div>
      <SummaryEditSection
        title="Profile information"
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
            Display name <span style={styles.optText}>(optional)</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            style={styles.input}
            placeholder="How you want to be known"
          />
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

      <WhatIAteTodaySection />

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
