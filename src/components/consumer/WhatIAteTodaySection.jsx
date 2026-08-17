/**
 * Optional What I Ate Today profile section with calendar + meal slots.
 * Owner: add / edit / remove / visibility. Viewer: read-only if the owner opted in.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  suggestWhatIAteTodayMenuItems,
  updateWhatIAteToday,
  uploadWhatIAteTodayPhoto,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  defaultWhatIAteMealPeriod,
  groupEntriesByMealPeriod,
  mealPeriodLabel,
} from "../../lib/whatIAteTodayMealPeriod.js";
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
  const [foodName, setFoodName] = useState("");
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [mealPeriod, setMealPeriod] = useState(() => defaultWhatIAteMealPeriod());
  const [linked, setLinked] = useState(null);
  const [tagRestaurant, setTagRestaurant] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editMealPeriod, setEditMealPeriod] = useState("lunch");
  const suggestTimer = useRef(null);
  const suggestAbort = useRef(null);

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

  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (suggestAbort.current) suggestAbort.current.abort();
    };
  }, []);

  function runSuggest(q) {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (suggestAbort.current) suggestAbort.current.abort();
    const query = String(q || "").trim();
    if (query.length < 2) {
      setSuggestions([]);
      setSuggesting(false);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      const controller = new AbortController();
      suggestAbort.current = controller;
      const kill = setTimeout(() => controller.abort(), 800);
      setSuggesting(true);
      try {
        const data = await suggestWhatIAteTodayMenuItems(query, { signal: controller.signal });
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setSuggestions([]);
      } finally {
        clearTimeout(kill);
        setSuggesting(false);
      }
    }, 150);
  }

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

  async function handlePhoto(file) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await uploadWhatIAteTodayPhoto(file);
      setPhotoUrl(data.photo_url || "");
    } catch (err) {
      setError(err.message || "Photo upload failed — you can still post without a photo.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePost(e) {
    e.preventDefault();
    const name = foodName.trim() || linked?.item_name || "";
    if (!name) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createWhatIAteToday({
        food_name: name,
        menu_item_id: linked?.menu_item_id || undefined,
        restaurant_id: linked?.menu_item_id ? undefined : tagRestaurant?.restaurant_id || undefined,
        comment: comment.trim() || undefined,
        photo_url: photoUrl || undefined,
        eaten_on: selectedDate,
        meal_period: mealPeriod,
      });
      setFoodName("");
      setComment("");
      setPhotoUrl("");
      setLinked(null);
      setTagRestaurant(null);
      setSuggestions([]);
      setNotice("Added to your food diary.");
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
    setSelectedDate(ymd || whatIAteTodayLocalDate());
    setViewMonth(parseSelectedMonth(ymd));
    setLoading(true);
  }

  function handleViewMonthChange(nextMonth) {
    setViewMonth(nextMonth);
    setSelectedDate((prev) => {
      if (isYmdInViewMonth(prev, nextMonth)) return prev;
      return defaultYmdForViewMonth(nextMonth);
    });
    setLoading(true);
  }

  const grouped = groupEntriesByMealPeriod(entries);
  const isToday = selectedDate === whatIAteTodayLocalDate();

  const calendarBlock = (
    <WhatIAteTodayCalendar
      selectedDate={selectedDate}
      onSelectDate={handleSelectDate}
      viewMonth={viewMonth}
      onViewMonthChange={handleViewMonthChange}
      dayCounts={calendarDays}
      readOnly={mode === "viewer"}
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
      emptyLabel={
        mode === "owner"
          ? isToday
            ? "Nothing added today yet."
            : "Nothing logged for this day."
          : "Nothing logged for this day."
      }
    />
  );

  const addForm =
    mode === "owner" ? (
      <form onSubmit={handlePost} style={localStyles.form}>
        <MealPeriodPicker value={mealPeriod} onChange={setMealPeriod} disabled={busy} />
        <div style={styles.field}>
          <label style={styles.fieldLabel} htmlFor="what-i-ate-food-name">
            What did you eat?
          </label>
          <input
            id="what-i-ate-food-name"
            style={styles.input}
            value={foodName}
            onChange={(e) => {
              const next = e.target.value;
              setFoodName(next);
              if (linked && next.trim() !== String(linked.item_name || "").trim()) {
                setLinked(null);
              }
              if (tagRestaurant) setTagRestaurant(null);
              runSuggest(next);
            }}
            placeholder="Chicken sandwich, banana, leftover pasta…"
            maxLength={160}
            autoComplete="off"
          />
        </div>
        {linked ? (
          <p style={styles.muted}>
            Menu item: {linked.item_name}
            {linked.restaurant_name ? ` · ${linked.restaurant_name}` : ""}{" "}
            <button
              type="button"
              style={styles.textBtn}
              onClick={() => {
                setLinked(null);
              }}
            >
              Unlink
            </button>
          </p>
        ) : null}
        {!linked ? (
          <WhatIAteTagPicker
            restaurant={tagRestaurant}
            onRestaurantChange={(next) => {
              setTagRestaurant(next);
              if (next?.restaurant_id) setLinked(null);
            }}
            disabled={busy}
          />
        ) : null}
        {suggesting ? <p style={styles.muted}>Looking up menu items…</p> : null}
        {suggestions.length > 0 ? (
          <ul style={localStyles.suggestList}>
            {suggestions.map((s) => (
              <li key={s.menu_item_id}>
                <button
                  type="button"
                  style={localStyles.suggestBtn}
                  onClick={() => {
                    setLinked(s);
                    setTagRestaurant(null);
                    setFoodName(s.item_name || "");
                    setSuggestions([]);
                  }}
                >
                  <span style={styles.actionTitle}>{s.item_name}</span>
                  <span style={styles.muted}>{s.restaurant_name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div style={styles.field}>
          <label style={styles.fieldLabel} htmlFor="what-i-ate-comment">
            Comment <span style={styles.optText}>(optional)</span>
          </label>
          <input
            id="what-i-ate-comment"
            style={styles.input}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            placeholder="Optional note"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.fieldLabel} htmlFor="what-i-ate-photo">
            Photo <span style={styles.optText}>(optional)</span>
          </label>
          <input
            id="what-i-ate-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
          />
        </div>
        {photoUrl ? <p style={styles.muted}>Photo attached.</p> : null}
        <button
          type="submit"
          style={styles.primaryBtn}
          disabled={busy || !(foodName.trim() || linked)}
        >
          {busy ? "Posting…" : `Add to ${mealPeriodLabel(mealPeriod)}`}
        </button>
      </form>
    ) : null;

  const diaryBody = isPage ? (
    <div className="what-i-ate-page-grid">
      <div>{calendarBlock}</div>
      <div className="what-i-ate-diary-col">
        {entriesBlock}
        {addForm}
      </div>
    </div>
  ) : (
    <>
      {calendarBlock}
      {entriesBlock}
    </>
  );

  const ownerIntro = (
    <p style={styles.sectionDesc}>
      Optional food diary. Pick a day on the calendar, log by meal slot, and let Connections browse
      your eating patterns when you turn sharing on. Just what you ate — not nutrition tracking.
    </p>
  );

  const viewerIntro = (
    <p style={styles.sectionDesc}>
      A dated food diary by meal — breakfast through late night. Connections only when shared.
    </p>
  );

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
      {addForm}
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
  emptyLabel,
}) {
  const hasAny =
    WHAT_I_ATE_MEAL_PERIODS.some(({ id }) => grouped.buckets[id]?.length) || grouped.other.length > 0;
  if (!hasAny && !showEmptyMealSlots) {
    return owner || emptyLabel ? <p style={styles.muted}>{emptyLabel}</p> : null;
  }
  return (
    <div style={localStyles.grouped}>
      {WHAT_I_ATE_MEAL_PERIODS.map(({ id, label }) => {
        const items = grouped.buckets[id] || [];
        if (!items.length && !showEmptyMealSlots) return null;
        return (
          <section key={id} style={localStyles.mealBlock} data-testid={`what-i-ate-meal-${id}`}>
            <h3 style={localStyles.mealTitle}>{label}</h3>
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
              <div style={localStyles.mealEmpty} aria-hidden />
            )}
          </section>
        );
      })}
      {grouped.other.length > 0 ? (
        <section style={localStyles.mealBlock}>
          <h3 style={localStyles.mealTitle}>Other</h3>
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
          <Link to={href} style={localStyles.itemLink}>
            {entry.food_name}
          </Link>
        ) : (
          <span style={styles.actionTitle}>{entry.food_name}</span>
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
