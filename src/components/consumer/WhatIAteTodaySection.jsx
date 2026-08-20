/**
 * Optional What I Ate Today profile section with calendar + meal slots.
 * Owner: add / edit / remove / visibility. Viewer: read-only if the owner opted in.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { searchReportPlaces } from "../../lib/foodActivityApi.js";
import { restaurantPath } from "../../lib/canonicalUrlCore.js";
import {
  createWhatIAteToday,
  deleteWhatIAteToday,
  listPeerWhatIAteToday,
  listPeerWhatIAteTodayCalendar,
  listWhatIAteToday,
  listWhatIAteTodayCalendar,
  resolveConsumerMediaUrl,
  setWhatIAteTodayVisibility,
  updateWhatIAteToday,
  uploadWhatIAteTodayPhoto,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import { eatingMediaFromUpload } from "../../lib/eatingMediaUtils.js";
import QuickCompose from "../../pages/consumer/myMenuply/QuickCompose.jsx";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  defaultWhatIAteMealPeriod,
  groupEntriesByMealPeriod,
} from "../../lib/whatIAteTodayMealPeriod.js";
import {
  clampEatingLookbackDate,
  eatingHistoryStart,
} from "../../pages/consumer/myMenuply/eatingHubUtils.js";
import WhatIAteTodayCalendar, {
  calendarRangeForMonth,
  defaultYmdForViewMonth,
  isYmdInViewMonth,
} from "./WhatIAteTodayCalendar.jsx";
import "./whatIAteTodayPage.css";
import { accountStyles as styles } from "../../pages/consumer/accountDashboard/accountDashboardStyles.js";

function entryHref(entry) {
  if (entry?.menu_item_id) {
    return `/menu-items/${encodeURIComponent(String(entry.menu_item_id))}`;
  }
  return restaurantPath({
    slug: entry?.restaurant_slug,
    city: entry?.restaurant_city,
    state: entry?.restaurant_state,
  });
}

function entryRestaurantHref(entry) {
  if (!entry?.restaurant_id) return null;
  return restaurantPath({
    slug: entry?.restaurant_slug,
    city: entry?.restaurant_city,
    state: entry?.restaurant_state,
  });
}

function parseSelectedMonth(selectedDate) {
  const [y, m] = String(selectedDate || "").split("-").map(Number);
  if (!y || !m) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  return new Date(y, m - 1, 1);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toMonthFirstYmd(viewMonth) {
  return `${viewMonth.getFullYear()}-${pad2(viewMonth.getMonth() + 1)}-01`;
}

function toMonthLastYmd(viewMonth) {
  const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  return `${last.getFullYear()}-${pad2(last.getMonth() + 1)}-${pad2(last.getDate())}`;
}

export default function WhatIAteTodaySection({
  mode = "owner",
  peerUserId = null,
  layout = "section",
  last = false,
}) {
  const isPage = layout === "page";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => whatIAteTodayLocalDate());
  const [viewMonth, setViewMonth] = useState(() => parseSelectedMonth(whatIAteTodayLocalDate()));
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editMealPeriod, setEditMealPeriod] = useState("lunch");

  const loadCalendar = useCallback(async () => {
    const { from, to } = calendarRangeForMonth(viewMonth);
    try {
      const data =
        mode === "viewer"
          ? await listPeerWhatIAteTodayCalendar(peerUserId, from, to)
          : await listWhatIAteTodayCalendar(from, to);
      setCalendarDays(Array.isArray(data.days) ? data.days : []);
      if (mode === "viewer") setVisible(data.visible === true);
    } catch {
      setCalendarDays([]);
    }
  }, [mode, peerUserId, viewMonth]);

  const loadDay = useCallback(async () => {
    setError("");
    try {
      const data =
        mode === "viewer"
          ? await listPeerWhatIAteToday(peerUserId, selectedDate)
          : await listWhatIAteToday(selectedDate);
      setVisible(data.visible === true);
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (err) {
      setEntries([]);
      setError(err.message || "Unable to load What I Ate Today");
    } finally {
      setLoading(false);
    }
  }, [mode, peerUserId, selectedDate]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  async function handleToggleVisible() {
    const next = !visible;
    setBusy(true);
    setError("");
    try {
      await setWhatIAteTodayVisibility(next);
      setVisible(next);
    } catch (err) {
      setError(err.message || "Unable to update visibility");
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickAdd(mealId, { text, file }) {
    const name = String(text || "").trim() || (file ? "Food" : "");
    if (!name) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let photo_url;
      let video_url;
      if (file) {
        const up = await uploadWhatIAteTodayPhoto(file);
        ({ photo_url, video_url } = eatingMediaFromUpload(up));
      }
      await createWhatIAteToday({
        food_name: name,
        photo_url,
        video_url,
        eaten_on: selectedDate,
        meal_period: mealId || defaultWhatIAteMealPeriod(),
      });
      await Promise.all([loadDay(), loadCalendar()]);
    } catch (err) {
      setError(err.message || "Unable to add food");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(entry) {
    const nextName = editName.trim() || entry.food_name;
    const nextComment = editComment;
    const nextPeriod = editMealPeriod;
    setBusy(true);
    setError("");
    try {
      await updateWhatIAteToday(entry.id, {
        food_name: nextName,
        comment: nextComment,
        meal_period: nextPeriod,
      });
      setEntries((prev) =>
        prev.map((row) =>
          row.id === entry.id
            ? { ...row, food_name: nextName, comment: nextComment, meal_period: nextPeriod }
            : row
        )
      );
      setEditingId(null);
      await loadCalendar();
    } catch (err) {
      setError(err.message || "Unable to update");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id) {
    setBusy(true);
    setError("");
    try {
      await deleteWhatIAteToday(id);
      await Promise.all([loadDay(), loadCalendar()]);
    } catch (err) {
      setError(err.message || "Unable to remove");
    } finally {
      setBusy(false);
    }
  }

  function handleSelectDate(ymd) {
    const today = whatIAteTodayLocalDate();
    const next = clampEatingLookbackDate(ymd, today);
    setSelectedDate(next);
    setViewMonth(parseSelectedMonth(next));
    setLoading(true);
  }

  function handleViewMonthChange(nextMonth) {
    const today = whatIAteTodayLocalDate();
    const lookback = eatingHistoryStart(today);
    const first = toMonthFirstYmd(nextMonth);
    const last = toMonthLastYmd(nextMonth);
    if (last < lookback) {
      setViewMonth(parseSelectedMonth(lookback));
      setSelectedDate(lookback);
      setLoading(true);
      return;
    }
    if (first > today) {
      setViewMonth(parseSelectedMonth(today));
      setSelectedDate(today);
      setLoading(true);
      return;
    }
    setViewMonth(nextMonth);
    setSelectedDate((prev) => {
      if (isYmdInViewMonth(prev, nextMonth)) {
        return clampEatingLookbackDate(prev, today);
      }
      return clampEatingLookbackDate(defaultYmdForViewMonth(nextMonth, today), today);
    });
    setLoading(true);
  }

  const grouped = groupEntriesByMealPeriod(entries);
  const isToday = selectedDate === whatIAteTodayLocalDate();
  const diaryLookbackStart = eatingHistoryStart();
  const diaryMaxYmd = whatIAteTodayLocalDate();

  const calendarBlock = (
    <WhatIAteTodayCalendar
      selectedDate={selectedDate}
      onSelectDate={handleSelectDate}
      viewMonth={viewMonth}
      onViewMonthChange={handleViewMonthChange}
      dayCounts={calendarDays}
      readOnly={mode === "viewer"}
      minYmd={diaryLookbackStart}
      maxYmd={diaryMaxYmd}
    />
  );

  const entriesBlock = (
    <GroupedEntryList
      grouped={grouped}
      owner={mode === "owner"}
      busy={busy}
      showEmptyMealSlots={isPage}
      editingId={editingId}
      editName={editName}
      editComment={editComment}
      editMealPeriod={editMealPeriod}
      onEditName={setEditName}
      onEditComment={setEditComment}
      onEditMealPeriod={setEditMealPeriod}
      onStartEdit={(entry) => {
        setEditingId(entry.id);
        setEditName(entry.food_name || "");
        setEditComment(entry.comment || "");
        setEditMealPeriod(entry.meal_period || defaultWhatIAteMealPeriod());
      }}
      onCancelEdit={() => setEditingId(null)}
      onSaveEdit={handleSaveEdit}
      onRemove={handleRemove}
      onQuickAdd={mode === "owner" ? handleQuickAdd : null}
      emptyLabel={
        mode === "owner"
          ? isToday
            ? "Nothing yet."
            : "Nothing logged for this day."
          : "Nothing logged for this day."
      }
    />
  );

  const diaryBody = isPage ? (
    <div className="what-i-ate-page-grid">
      <div>{calendarBlock}</div>
      <div className="what-i-ate-diary-col">{entriesBlock}</div>
    </div>
  ) : (
    <>
      {calendarBlock}
      {entriesBlock}
    </>
  );

  const ownerIntro = null;

  const viewerIntro = null;

  if (mode === "viewer") {
    if (loading) {
      return isPage ? <p style={styles.muted}>Loading food diary…</p> : null;
    }
    if (!visible) {
      if (isPage) {
        return (
          <div className="what-i-ate-page-root" data-testid="what-i-ate-today">
            <p style={styles.muted}>This Connection has not turned on food diary sharing.</p>
          </div>
        );
      }
      return null;
    }
    const hasAnyHistory = calendarDays.some((d) => (d.entry_count || 0) > 0);
    if (!hasAnyHistory && entries.length === 0 && !isPage) return null;
    if (isPage) {
      return (
        <div className="what-i-ate-page-root" data-testid="what-i-ate-today">
          {viewerIntro}
          {error ? <p style={styles.statusErr}>{error}</p> : null}
          {diaryBody}
        </div>
      );
    }
    return (
      <section style={{ marginTop: 16 }} data-testid="what-i-ate-today">
        <h2 style={{ ...styles.sectionTitle, marginBottom: 8 }}>What I Ate Today</h2>
        {viewerIntro}
        {diaryBody}
      </section>
    );
  }

  if (loading) {
    return <p style={styles.muted}>Loading What I Ate Today…</p>;
  }

  if (isPage) {
    return (
      <div
        className="what-i-ate-page-root"
        data-testid="what-i-ate-today"
        style={last ? { marginBottom: 0 } : undefined}
      >
        {ownerIntro}
        {error ? <p style={styles.statusErr}>{error}</p> : null}
        {notice ? <p style={styles.statusOk}>{notice}</p> : null}
        <label style={localStyles.check}>
          <input
            type="checkbox"
            checked={visible}
            disabled={busy}
            onChange={handleToggleVisible}
          />
          Show my food diary to Connections and on tagged restaurant profiles
        </label>
        {diaryBody}
      </div>
    );
  }

  return (
    <section
      style={{ ...styles.section, ...(last ? styles.sectionLast : null) }}
      data-testid="what-i-ate-today"
    >
      <div style={styles.sectionHead}>
        <h2 style={styles.sectionTitle}>What I Ate Today</h2>
      </div>
      {ownerIntro}
      {error ? <p style={styles.statusErr}>{error}</p> : null}
      {notice ? <p style={styles.statusOk}>{notice}</p> : null}
      <label style={localStyles.check}>
        <input
          type="checkbox"
          checked={visible}
          disabled={busy}
          onChange={handleToggleVisible}
        />
        Show my food diary to Connections and on tagged restaurant profiles
      </label>
      {diaryBody}
    </section>
  );
}

function WhatIAteTagPicker({ restaurant, onRestaurantChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setResults([]);
      return undefined;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchReportPlaces({ type: "restaurant", q, limit: 8 });
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [open, query]);

  if (restaurant?.restaurant_id) {
    return (
      <p style={styles.muted} data-testid="what-i-ate-tag-restaurant">
        Restaurant: {restaurant.restaurant_name}{" "}
        <button
          type="button"
          style={styles.textBtn}
          disabled={disabled}
          onClick={() => onRestaurantChange(null)}
        >
          Unlink
        </button>
      </p>
    );
  }

  return (
    <div style={localStyles.tagPicker} data-testid="what-i-ate-tag-picker">
      {!open ? (
        <button
          type="button"
          style={styles.textBtn}
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          Tag a restaurant (optional)
        </button>
      ) : (
        <>
          <label style={styles.fieldLabel} htmlFor="what-i-ate-tag-restaurant">
            Tag restaurant
          </label>
          <input
            id="what-i-ate-tag-restaurant"
            style={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurants…"
            autoComplete="off"
          />
          {loading ? <p style={styles.muted}>Searching…</p> : null}
          {results.length > 0 ? (
            <ul style={localStyles.suggestList}>
              {results.map((row) => (
                <li key={row.restaurant_id}>
                  <button
                    type="button"
                    style={localStyles.suggestBtn}
                    onClick={() => {
                      onRestaurantChange(row);
                      setOpen(false);
                      setQuery("");
                      setResults([]);
                    }}
                  >
                    <span style={styles.actionTitle}>{row.restaurant_name}</span>
                    <span style={styles.muted}>
                      {[row.city, row.state].filter(Boolean).join(", ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button type="button" style={styles.textBtn} onClick={() => setOpen(false)}>
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

function MealPeriodPicker({ value, onChange, disabled = false }) {
  return (
    <div style={localStyles.mealPicker} data-testid="what-i-ate-meal-period">
      <p style={styles.fieldLabel}>Meal</p>
      <div style={styles.chipWrap}>
        {WHAT_I_ATE_MEAL_PERIODS.map((period) => (
          <button
            key={period.id}
            type="button"
            disabled={disabled}
            aria-pressed={value === period.id}
            onClick={() => onChange(period.id)}
            style={{
              ...styles.chip,
              ...(value === period.id ? styles.chipSelected : null),
            }}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GroupedEntryList({
  grouped,
  owner,
  busy,
  showEmptyMealSlots = false,
  editingId,
  editName,
  editComment,
  editMealPeriod,
  onEditName,
  onEditComment,
  onEditMealPeriod,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
  onQuickAdd,
  emptyLabel,
}) {
  const hasAny =
    WHAT_I_ATE_MEAL_PERIODS.some(({ id }) => grouped.buckets[id]?.length) || grouped.other.length > 0;
  if (!hasAny && !showEmptyMealSlots) {
    return owner || emptyLabel ? <p style={styles.muted}>{emptyLabel}</p> : null;
  }
  return (
    <div className="what-i-ate-meal-list">
      {WHAT_I_ATE_MEAL_PERIODS.map(({ id, label }) => {
        const items = grouped.buckets[id] || [];
        if (!items.length && !showEmptyMealSlots && !onQuickAdd) return null;
        return (
          <section key={id} className="what-i-ate-meal-card" data-testid={`what-i-ate-meal-${id}`}>
            <h3 className="what-i-ate-meal-heading">{label}</h3>
            {items.length ? (
              <EntryList
                entries={items}
                owner={owner}
                busy={busy}
                editingId={editingId}
                editName={editName}
                editComment={editComment}
                editMealPeriod={editMealPeriod}
                onEditName={onEditName}
                onEditComment={onEditComment}
                onEditMealPeriod={onEditMealPeriod}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onRemove={onRemove}
              />
            ) : (
              <div className="what-i-ate-meal-empty" style={localStyles.mealEmpty} />
            )}
            {onQuickAdd ? (
              <div style={{ padding: "0 10px 10px" }}>
                <QuickCompose
                  testId={`compose-meal-${id}`}
                  placeholder="What did you eat?"
                  acceptPhoto
                  acceptVideo
                  busy={busy}
                  onSubmit={(payload) => onQuickAdd(id, payload)}
                />
              </div>
            ) : null}
          </section>
        );
      })}
      {grouped.other.length > 0 ? (
        <section className="what-i-ate-meal-card">
          <h3 className="what-i-ate-meal-heading">Other</h3>
          <EntryList
            entries={grouped.other}
            owner={owner}
            busy={busy}
            editingId={editingId}
            editName={editName}
            editComment={editComment}
            editMealPeriod={editMealPeriod}
            onEditName={onEditName}
            onEditComment={onEditComment}
            onEditMealPeriod={onEditMealPeriod}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onRemove={onRemove}
          />
        </section>
      ) : null}
    </div>
  );
}

function EntryList({
  entries,
  owner = false,
  busy = false,
  editingId = null,
  editName = "",
  editComment = "",
  editMealPeriod = "lunch",
  onEditName,
  onEditComment,
  onEditMealPeriod,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
}) {
  return (
    <ul style={localStyles.list}>
      {entries.map((entry) => {
        const href = entryHref(entry);
        const restaurantHref = entryRestaurantHref(entry);
        const nameNode = href ? (
          <Link to={href} className="what-i-ate-food-name" style={localStyles.itemLink}>
            {entry.food_name}
          </Link>
        ) : (
          <span className="what-i-ate-food-name" style={styles.actionTitle}>{entry.food_name}</span>
        );
        return (
          <li key={entry.id} style={localStyles.row}>
            {editingId === entry.id ? (
              <div style={{ display: "grid", gap: 8, flex: 1 }}>
                <MealPeriodPicker value={editMealPeriod} onChange={onEditMealPeriod} disabled={busy} />
                <input
                  style={styles.input}
                  value={editName}
                  onChange={(e) => onEditName(e.target.value)}
                  maxLength={160}
                />
                <input
                  style={styles.input}
                  value={editComment}
                  onChange={(e) => onEditComment(e.target.value)}
                  maxLength={500}
                  placeholder="Optional comment"
                />
                <div style={styles.actions}>
                  <button type="button" style={styles.primaryBtn} disabled={busy} onClick={() => onSaveEdit(entry)}>
                    Save
                  </button>
                  <button type="button" style={styles.secondaryBtn} onClick={onCancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0 }}>{nameNode}</p>
                  {entry.item_name && entry.menu_item_id ? (
                    <p style={styles.muted}>
                      Menu item:{" "}
                      <Link
                        to={`/menu-items/${encodeURIComponent(String(entry.menu_item_id))}`}
                        style={localStyles.itemLink}
                      >
                        {entry.item_name}
                      </Link>
                    </p>
                  ) : null}
                  {entry.restaurant_name ? (
                    <p style={styles.muted}>
                      {entry.menu_item_id ? "at " : "Restaurant: "}
                      {restaurantHref ? (
                        <Link to={restaurantHref} style={localStyles.itemLink}>
                          {entry.restaurant_name}
                        </Link>
                      ) : (
                        entry.restaurant_name
                      )}
                    </p>
                  ) : null}
                  {entry.comment ? <p style={styles.muted}>{entry.comment}</p> : null}
                  {entry.photo_url ? (
                    <img
                      src={resolveConsumerMediaUrl(entry.photo_url)}
                      alt=""
                      style={localStyles.thumb}
                    />
                  ) : null}
                </div>
                {owner ? (
                  <div style={styles.actions}>
                    <button
                      type="button"
                      style={styles.secondaryBtn}
                      disabled={busy}
                      onClick={() => onStartEdit(entry)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={styles.secondaryBtn}
                      disabled={busy}
                      onClick={() => onRemove(entry.id)}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const localStyles = {
  check: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#334155",
    margin: "0 0 14px",
  },
  form: { display: "grid", gap: 10, marginTop: 12 },
  mealPicker: { marginBottom: 4 },
  grouped: { display: "grid", gap: 14, margin: "0 0 12px" },
  mealBlock: { padding: "0 0 4px" },
  mealTitle: {
    margin: "0 0 6px",
    fontSize: 14,
    fontWeight: 800,
    color: "#334155",
    letterSpacing: "-0.01em",
  },
  mealEmpty: {
    minHeight: 4,
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  itemLink: {
    color: "#0f172a",
    fontWeight: 800,
    textDecoration: "none",
  },
  thumb: {
    display: "block",
    marginTop: 8,
    width: 72,
    height: 72,
    objectFit: "cover",
    borderRadius: 8,
  },
  suggestList: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 },
  tagPicker: { margin: "0 0 8px" },
  suggestBtn: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "8px 10px",
    background: "#fff",
    cursor: "pointer",
    display: "grid",
    gap: 2,
  },
};
