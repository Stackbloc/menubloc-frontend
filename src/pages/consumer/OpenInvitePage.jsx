/**
 * Post an Open Invite, or edit one with ?edit=<token> (Andre 2026-11-09). Posts nowhere else.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import DiningCrewFoodEntityPicker from "../../components/diningCrews/DiningCrewFoodEntityPicker.jsx";
import {
  audienceChips,
  createOpenInvite,
  getHostOptions,
  getOpenInvite,
  startsAtIso,
  updateOpenInvite,
} from "../../lib/openInvitesApi.js";

const SPOTS = [1, 2, 3, 4, 5, 6, 7];
const ORDER = ["connects_only", "connects_of_connects", "confirmed_students", "anyone"];

export default function OpenInvitePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const edit = params.get("edit");
  const [options, setOptions] = useState(null);
  const [messageType, setMessageType] = useState("restaurant");
  const [selected, setSelected] = useState(null);
  const [existing, setExisting] = useState(null);
  const [changingPlace, setChangingPlace] = useState(!edit);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [spots, setSpots] = useState(2);
  const [note, setNote] = useState("");
  const [audience, setAudience] = useState("connects_only");
  const [minAudience, setMinAudience] = useState("connects_only");
  const [confirmed, setConfirmed] = useState(false);
  const [askAnyone, setAskAnyone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getHostOptions().then(setOptions).catch(() => setOptions(null));
  }, []);

  useEffect(() => {
    if (!edit) return;
    getOpenInvite(edit)
      .then((i) => {
        setExisting(i);
        setCity(i.restaurant_city || "");
        setState(i.restaurant_state || "");
        setDate(i.scheduled_date);
        setTime(i.scheduled_time);
        setSpots(i.join_capacity);
        setNote(i.note || "");
        setAudience(i.audience);
        setMinAudience(i.audience);
        setConfirmed(i.audience === "anyone");
      })
      .catch((err) => setError(err?.message || "This invite isn’t available"));
  }, [edit]);

  const pickedId = selected?.restaurant_id || selected?.id || null;
  const typedName = !pickedId && selected?.unlisted ? String(selected?.restaurant_name || "").trim() : "";
  const keptPlace = !changingPlace && existing;
  const placeIsTyped = keptPlace ? existing.restaurant_id == null : Boolean(typedName);
  const hasPlace = keptPlace || pickedId || typedName;
  const chips = useMemo(
    () => audienceChips(options).filter((c) => ORDER.indexOf(c.value) >= ORDER.indexOf(minAudience)),
    [options, minAudience]
  );
  const helper = chips.find((c) => c.value === audience)?.helper || "";
  const ready = hasPlace && date && time && (!placeIsTyped || city.trim()) && !busy;

  function placeBody() {
    if (keptPlace) {
      return existing.restaurant_id
        ? { restaurant_id: existing.restaurant_id }
        : { place_name: existing.restaurant_name, place_city: city.trim(), place_state: state.trim() };
    }
    return pickedId ? { restaurant_id: pickedId } : { place_name: typedName, place_city: city.trim(), place_state: state.trim() };
  }

  async function submit(e) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    const body = {
      ...placeBody(),
      starts_at: startsAtIso(date, time),
      scheduled_date: date,
      scheduled_time: time,
      join_capacity: spots,
      audience,
      note: note.trim(),
      anyone_confirmed: confirmed,
    };
    try {
      const saved = edit ? await updateOpenInvite(edit, body) : await createOpenInvite(body);
      navigate(`/invite/${encodeURIComponent(saved.token)}`, { replace: true });
    } catch (err) {
      setError(err?.message || "That didn’t work. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  function pickAudience(value) {
    if (value === "anyone" && !confirmed) setAskAnyone(true);
    else setAudience(value);
  }

  return (
    <div style={styles.shell}>
      <StickyPageHeader title={edit ? "Edit Open Invite" : "Open Invite"} />
      <form style={styles.page} onSubmit={submit} data-testid="open-invite-form">
        <div style={styles.step}>Where?</div>
        {keptPlace ? (
          <div style={styles.chosen}>
            <strong>{existing.restaurant_name}</strong>
            <button type="button" style={styles.textBtn} onClick={() => setChangingPlace(true)}>Change</button>
          </div>
        ) : (
          <DiningCrewFoodEntityPicker
            messageType={messageType}
            onMessageTypeChange={setMessageType}
            selected={selected}
            onSelectedChange={setSelected}
            forceRestaurantOnly
            allowUnlisted
            hideNote
            restaurantHint="Pick the restaurant, or type its name."
          />
        )}
        {placeIsTyped ? (
          <div style={styles.row}>
            <input aria-label="City" placeholder="City" value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} style={{ ...styles.input, flex: 2 }} data-testid="open-invite-city" />
            <input aria-label="State" placeholder="State" value={state} maxLength={40} onChange={(e) => setState(e.target.value)} style={{ ...styles.input, flex: 1 }} data-testid="open-invite-state" />
          </div>
        ) : null}

        <div style={styles.step}>When?</div>
        <div style={styles.row}>
          <input type="date" aria-label="Day" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...styles.input, flex: 2 }} data-testid="open-invite-date" />
          <input type="time" aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...styles.input, flex: 1 }} data-testid="open-invite-time" />
        </div>

        <div style={styles.step}>How many people can join?</div>
        <div style={styles.chips}>
          {SPOTS.map((n) => (
            <button key={n} type="button" onClick={() => setSpots(n)} aria-pressed={spots === n} style={spots === n ? styles.chipOn : styles.chip} data-testid={`open-invite-spots-${n}`}>{n}</button>
          ))}
        </div>

        <div style={styles.step}>Note (optional)</div>
        <input aria-label="Note" placeholder="Grabbing tacos after class" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} style={styles.input} data-testid="open-invite-note" />

        <div style={styles.step}>Who can join?</div>
        <div style={styles.chips}>
          {chips.map((c) => (
            <button key={c.value} type="button" onClick={() => pickAudience(c.value)} aria-pressed={audience === c.value} style={audience === c.value ? styles.chipOn : styles.chip} data-testid={`open-invite-audience-${c.value}`}>{c.label}</button>
          ))}
        </div>
        <div style={styles.muted} data-testid="open-invite-audience-helper">{helper}</div>

        {askAnyone ? (
          <div style={styles.confirm} role="dialog" aria-label="Confirm Anyone" data-testid="open-invite-anyone-sheet">
            <strong>Anyone on Menuply can join. Meet in public places.</strong>
            <div style={styles.confirmRow}>
              <button type="button" style={styles.textMuted} onClick={() => setAskAnyone(false)}>Not now</button>
              <button type="button" style={styles.textBtn} data-testid="open-invite-anyone-yes" onClick={() => { setConfirmed(true); setAudience("anyone"); setAskAnyone(false); }}>Confirm</button>
            </div>
          </div>
        ) : null}

        {error ? <div role="alert" style={styles.error}>{error}</div> : null}
        <button type="submit" disabled={!ready} style={{ ...styles.textBtn, alignSelf: "end", justifySelf: "end", opacity: ready ? 1 : 0.4 }} data-testid="open-invite-post">
          {edit ? "Save ›" : "Post ›"}
        </button>
      </form>
      <BottomNav />
    </div>
  );
}

const chip = { border: "1px solid #d1d5db", borderRadius: 999, padding: "6px 14px", background: "#fff", color: "#111827", fontSize: 14, cursor: "pointer" };
const styles = {
  shell: { minHeight: "100vh", background: "#f9fafb", paddingBottom: 88 },
  page: { maxWidth: 560, margin: "0 auto", padding: 16, display: "grid", gap: 10, color: "#111827" },
  step: { fontSize: 13, fontWeight: 700, color: "#15803d" },
  chosen: { display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fff" },
  row: { display: "flex", gap: 8 },
  input: { border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px", fontSize: 16, minWidth: 0 },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip,
  chipOn: { ...chip, background: "#111827", borderColor: "#111827", color: "#fff", fontWeight: 700 },
  muted: { fontSize: 13, color: "#6b7280" },
  error: { color: "#b91c1c" },
  textBtn: { border: "none", background: "none", color: "#15803d", fontWeight: 700, fontSize: 15, cursor: "pointer", padding: 4 },
  textMuted: { border: "none", background: "none", color: "#6b7280", fontWeight: 700, fontSize: 15, cursor: "pointer", padding: 4 },
  confirm: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff", display: "grid", gap: 10 },
  confirmRow: { display: "flex", justifyContent: "flex-end", gap: 16 },
};
