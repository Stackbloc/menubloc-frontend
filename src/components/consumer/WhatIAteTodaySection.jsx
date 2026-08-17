/**
 * Optional What I Ate Today profile section.
 * Owner: add / edit / remove / visibility. Viewer: read-only if the owner opted in.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createWhatIAteToday,
  deleteWhatIAteToday,
  listPeerWhatIAteToday,
  listWhatIAteToday,
  resolveConsumerMediaUrl,
  setWhatIAteTodayVisibility,
  suggestWhatIAteTodayMenuItems,
  updateWhatIAteToday,
  uploadWhatIAteTodayPhoto,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import { accountStyles as styles } from "../../pages/consumer/accountDashboard/accountDashboardStyles.js";

function entryHref(entry) {
  if (entry?.href) return entry.href;
  if (entry?.menu_item_id) return `/menu-items/${encodeURIComponent(String(entry.menu_item_id))}`;
  return null;
}

export default function WhatIAteTodaySection({
  mode = "owner",
  peerUserId = null,
  last = false,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [visible, setVisible] = useState(false);
  const [entries, setEntries] = useState([]);
  const [foodName, setFoodName] = useState("");
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [linked, setLinked] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editComment, setEditComment] = useState("");
  const suggestTimer = useRef(null);
  const suggestAbort = useRef(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const eatenOn = whatIAteTodayLocalDate();
      const data =
        mode === "viewer"
          ? await listPeerWhatIAteToday(peerUserId, eatenOn)
          : await listWhatIAteToday(eatenOn);
      setVisible(data.visible === true);
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (err) {
      setEntries([]);
      setError(err.message || "Unable to load What I Ate Today");
    } finally {
      setLoading(false);
    }
  }, [mode, peerUserId]);

  useEffect(() => {
    load();
  }, [load]);

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
        comment: comment.trim() || undefined,
        photo_url: photoUrl || undefined,
        eaten_on: whatIAteTodayLocalDate(),
      });
      setFoodName("");
      setComment("");
      setPhotoUrl("");
      setLinked(null);
      setSuggestions([]);
      setNotice("Added to What I Ate Today.");
      await load();
    } catch (err) {
      setError(err.message || "Unable to add food");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(entry) {
    setBusy(true);
    setError("");
    try {
      await updateWhatIAteToday(entry.id, {
        food_name: editName.trim() || entry.food_name,
        comment: editComment,
      });
      setEditingId(null);
      await load();
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
      await load();
    } catch (err) {
      setError(err.message || "Unable to remove");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "viewer") {
    if (loading) return null;
    if (!visible || entries.length === 0) return null;
    return (
      <section style={{ marginTop: 16 }} data-testid="what-i-ate-today">
        <h2 style={{ ...styles.sectionTitle, marginBottom: 8 }}>What I Ate Today</h2>
        <EntryList entries={entries} />
      </section>
    );
  }

  if (loading) {
    return <p style={styles.muted}>Loading What I Ate Today…</p>;
  }

  return (
    <section
      style={{ ...styles.section, ...(last ? styles.sectionLast : null) }}
      data-testid="what-i-ate-today"
    >
      <div style={styles.sectionHead}>
        <h2 style={styles.sectionTitle}>What I Ate Today</h2>
      </div>
      <p style={styles.sectionDesc}>
        Optional. Add what you ate — restaurant food, something at home, a snack, leftovers.
        Link a Menuply menu item when it applies. Lookup never blocks posting.
      </p>
      {error ? <p style={styles.statusErr}>{error}</p> : null}
      {notice ? <p style={styles.statusOk}>{notice}</p> : null}

      <label style={styles.checkLabel || localStyles.check}>
        <input
          type="checkbox"
          checked={visible}
          disabled={busy}
          onChange={handleToggleVisible}
        />
        Show this section on my profile
      </label>

      <EntryList
        entries={entries}
        owner
        busy={busy}
        editingId={editingId}
        editName={editName}
        editComment={editComment}
        onEditName={setEditName}
        onEditComment={setEditComment}
        onStartEdit={(entry) => {
          setEditingId(entry.id);
          setEditName(entry.food_name || "");
          setEditComment(entry.comment || "");
        }}
        onCancelEdit={() => setEditingId(null)}
        onSaveEdit={handleSaveEdit}
        onRemove={handleRemove}
      />

      <form onSubmit={handlePost} style={localStyles.form}>
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
              runSuggest(next);
            }}
            placeholder="Chicken sandwich, banana, leftover pasta…"
            maxLength={160}
            autoComplete="off"
          />
        </div>
        {linked ? (
          <p style={styles.muted}>
            Linked: {linked.item_name}
            {linked.restaurant_name ? ` · ${linked.restaurant_name}` : ""}
            {" "}
            <button type="button" style={styles.textBtn} onClick={() => setLinked(null)}>
              Unlink
            </button>
          </p>
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
          {busy ? "Posting…" : "Add food"}
        </button>
      </form>
    </section>
  );
}

function EntryList({
  entries,
  owner = false,
  busy = false,
  editingId = null,
  editName = "",
  editComment = "",
  onEditName,
  onEditComment,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
}) {
  if (!entries.length) {
    return owner ? <p style={styles.muted}>Nothing added today yet.</p> : null;
  }
  return (
    <ul style={localStyles.list}>
      {entries.map((entry) => {
        const href = entryHref(entry);
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
                  {entry.restaurant_name ? (
                    <p style={styles.muted}>{entry.restaurant_name}</p>
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
  list: { listStyle: "none", padding: 0, margin: "0 0 12px", display: "grid", gap: 10 },
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
