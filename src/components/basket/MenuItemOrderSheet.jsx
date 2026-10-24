/**
 * Tap-to-order item sheet (Andre, 2026-10-23 — "make it feel like Viztango's Square Online").
 * Every orderable dish opens this: big photo ("See N photos"), name, price, description,
 * quantity − 1 +, owner modifier groups (Optional / Required, collapsible, radio or checkbox rows
 * with +$), a note, and a sticky ✕ + "Add to order $X.XX" bar that follows quantity and choices.
 * Required groups and min/max rules must be met before the add button enables; tapping it while
 * blocked jumps to the group that still needs a choice.
 */
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatMenuItemName } from "../../utils/formatMenuItemName.js";
import { findAvoidedInIngredientList } from "../../lib/foodsToAvoidMatch.js";
import { getIngredients } from "./SmartCustomizationSheet.jsx";
import {
  MAX_ITEM_QUANTITY,
  clampQuantity,
  computeSheetTotalCents,
  describeGroupRule,
  firstBlockingGroup,
  formatCents,
  getItemPhotoUrls,
  getSheetGroups,
  groupSelectionStatus,
  isSingleChoiceGroup,
  selectedModifiers,
  toggleGroupSelection,
} from "./itemOrderSheetModel.js";

const SHEET_CSS = `
.mp-ios-backdrop{position:fixed;inset:0;background:rgba(15,23,32,.48);z-index:1180;display:flex;align-items:center;justify-content:center;padding:24px}
.mp-ios-sheet{position:relative;width:min(640px,100%);max-height:calc(100vh - 48px);background:#fff;color:#11181c;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 80px rgba(15,23,32,.32);animation:mp-ios-in .18s ease-out}
.mp-ios-scroll{overflow-y:auto;flex:1 1 auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.mp-ios-photo{position:relative;width:100%;aspect-ratio:3/2;max-height:46vh;background:#eef1f3}
.mp-ios-photo img{width:100%;height:100%;object-fit:cover;display:block}
.mp-ios-pad{padding:22px 26px}
.mp-ios-qty button{width:36px;height:36px;border-radius:999px;border:none;background:#f1f3f5;color:#11181c;font-size:20px;line-height:1;cursor:pointer}
.mp-ios-qty button:disabled{opacity:.4;cursor:default}
.mp-ios-group{border-top:10px solid #f2f4f6}
.mp-ios-ghead{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 26px 6px;background:none;border:none;cursor:pointer;text-align:left;font:inherit;color:inherit}
.mp-ios-opt{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #e6e9ec;cursor:pointer;font-size:16px}
.mp-ios-opt:last-child{border-bottom:none}
.mp-ios-opt input{width:20px;height:20px;margin:0;flex-shrink:0;accent-color:var(--mp-ios-accent)}
.mp-ios-opt.is-off{opacity:.45;cursor:default}
.mp-ios-bar{display:flex;align-items:center;gap:12px;padding:12px 26px calc(12px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #e6e9ec}
.mp-ios-close{width:44px;height:44px;border-radius:999px;border:none;background:#fff;box-shadow:0 2px 10px rgba(15,23,32,.18);font-size:22px;line-height:1;cursor:pointer;flex-shrink:0;color:#11181c}
.mp-ios-add{flex:1;min-height:48px;border:none;border-radius:999px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .08s ease,opacity .12s ease}
.mp-ios-add:active{transform:scale(.98)}
.mp-ios-add[aria-disabled="true"]{opacity:.55}
.mp-ios-flash{animation:mp-ios-flash .9s ease}
.mp-ios-gallery{position:fixed;inset:0;z-index:1190;background:rgba(0,0,0,.92);display:flex;flex-direction:column}
.mp-ios-gallery-strip{flex:1;display:flex;overflow-x:auto;scroll-snap-type:x mandatory}
.mp-ios-gallery-strip img{flex:0 0 100%;width:100%;height:100%;object-fit:contain;scroll-snap-align:center}
@keyframes mp-ios-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes mp-ios-flash{0%,100%{background:transparent}30%{background:#fff4e5}}
@media (max-width:640px){
  .mp-ios-backdrop{padding:0;align-items:flex-end}
  .mp-ios-sheet{width:100%;max-height:calc(100dvh - 24px);border-radius:18px 18px 0 0}
  .mp-ios-photo{max-height:34vh}
  .mp-ios-pad{padding:18px 18px}
  .mp-ios-ghead{padding:16px 18px 4px}
  .mp-ios-bar{padding:10px 14px calc(10px + env(safe-area-inset-bottom))}
}
`;

function Chevron({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
      <path d="M2 5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MenuItemOrderSheet({
  item,
  name,
  description,
  basePriceCents,
  foodsToAvoid = [],
  brand,
  onClose,
  onAdd,
  onOpenDetails,
}) {
  const accent = brand?.accent || "var(--mp-accent, #0f7a24)";
  const onAccent = brand?.onAccent || "#fff";
  const groups = useMemo(() => getSheetGroups(item), [item]);
  const photos = useMemo(() => getItemPhotoUrls(item), [item]);
  const leaveOutOptions = useMemo(
    () => [...new Set(findAvoidedInIngredientList(getIngredients(item), foodsToAvoid).map((hit) => hit.ingredient))],
    [item, foodsToAvoid]
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedByGroup, setSelectedByGroup] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [leftOut, setLeftOut] = useState([]);
  const [note, setNote] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [flashGroupId, setFlashGroupId] = useState(null);
  const groupRefs = useRef({});
  const dialogRef = useRef(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (galleryOpen) setGalleryOpen(false);
      else onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryOpen, onClose]);

  const blocking = firstBlockingGroup(groups, selectedByGroup);
  const totalCents = computeSheetTotalCents(basePriceCents, groups, selectedByGroup, quantity);
  const displayName = formatMenuItemName(name) || "Item";

  function choose(group, optionId) {
    setSelectedByGroup((prev) => ({
      ...prev,
      [group.groupId]: toggleGroupSelection(group, prev[group.groupId], optionId),
    }));
  }

  function handleAdd() {
    if (blocking) {
      setCollapsed((prev) => ({ ...prev, [blocking.groupId]: false }));
      groupRefs.current[blocking.groupId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashGroupId(null);
      window.requestAnimationFrame(() => setFlashGroupId(blocking.groupId));
      return;
    }
    const instructions = [
      leftOut.length ? `No ${leftOut.join(", ")}` : "",
      note.trim(),
    ].filter(Boolean).join(". ");
    onAdd?.({
      quantity: clampQuantity(quantity),
      modifiers: selectedModifiers(groups, selectedByGroup),
      preparationInstructions: instructions || null,
    });
  }

  const blockingHint = blocking
    ? groupSelectionStatus(blocking, selectedByGroup[blocking.groupId]).reason === "max"
      ? `${blocking.name}: too many picked`
      : `Choose ${blocking.name}`
    : null;

  // Portal: menu templates create their own stacking contexts, so render at <body>.
  return createPortal(
    <div
      className="mp-ios-backdrop"
      onClick={onClose}
      data-testid="menu-item-order-sheet"
      style={{ "--mp-ios-accent": accent }}
    >
      <style>{SHEET_CSS}</style>
      <div
        ref={dialogRef}
        className="mp-ios-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={displayName}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mp-ios-scroll">
          {photos.length ? (
            <div className="mp-ios-photo">
              <img src={photos[0]} alt={`${displayName} photo`} />
              {photos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  style={{
                    position: "absolute", right: 14, bottom: 14,
                    padding: "8px 12px", borderRadius: 6,
                    border: "2px solid rgba(17,24,28,.35)", background: "#fff",
                    fontSize: 15, cursor: "pointer", color: "#11181c",
                  }}
                >
                  See {photos.length} photos
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="mp-ios-pad">
            <h2 style={{ margin: 0, fontSize: 26, lineHeight: 1.15, fontWeight: 900, letterSpacing: 0.2, fontFamily: brand?.headingFontFamily || "inherit" }}>
              {displayName}
            </h2>
            <div style={{ marginTop: 10, fontSize: 21 }}>{formatCents(basePriceCents)}</div>
            {description ? (
              <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.55, color: "#2b3338" }}>{description}</p>
            ) : null}
            <div className="mp-ios-qty" style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16 }}>
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => clampQuantity(q - 1))}
              >
                −
              </button>
              <span aria-live="polite" data-testid="item-sheet-quantity" style={{ minWidth: 16, textAlign: "center", fontSize: 18 }}>
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= MAX_ITEM_QUANTITY}
                onClick={() => setQuantity((q) => clampQuantity(q + 1))}
              >
                +
              </button>
            </div>
            {onOpenDetails ? (
              <button
                type="button"
                onClick={onOpenDetails}
                style={{ marginTop: 14, padding: 0, border: "none", background: "none", color: "#4b5560", fontSize: 14, textDecoration: "underline", cursor: "pointer" }}
              >
                Nutrition &amp; dish details
              </button>
            ) : null}
          </div>

          {groups.map((group) => {
            const selectedIds = selectedByGroup[group.groupId] || [];
            const single = isSingleChoiceGroup(group);
            const isOpen = !collapsed[group.groupId];
            const status = groupSelectionStatus(group, selectedIds);
            const full = !single && selectedIds.length >= group.maxSelections;
            const rule = describeGroupRule(group);
            return (
              <section
                key={group.groupId}
                ref={(el) => { groupRefs.current[group.groupId] = el; }}
                className={`mp-ios-group${flashGroupId === group.groupId ? " mp-ios-flash" : ""}`}
                data-testid="item-sheet-group"
              >
                <button
                  type="button"
                  className="mp-ios-ghead"
                  aria-expanded={isOpen}
                  onClick={() => setCollapsed((prev) => ({ ...prev, [group.groupId]: isOpen }))}
                >
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{group.name}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, color: group.required && !status.ok ? "#b42318" : "#2b3338", fontWeight: group.required ? 700 : 400 }}>
                    {group.required ? (status.ok ? "✓ Required" : "Required") : "Optional"}
                    <Chevron open={isOpen} />
                  </span>
                </button>
                {isOpen ? (
                  <div style={{ padding: "0 26px 8px" }} className="mp-ios-gbody">
                    {rule || group.description ? (
                      <div style={{ fontSize: 13, color: "#667085", marginBottom: 2 }}>
                        {[group.description, rule].filter(Boolean).join(" · ")}
                      </div>
                    ) : null}
                    {group.options.map((option) => {
                      const checked = selectedIds.includes(option.optionId);
                      const off = full && !checked;
                      return (
                        <label key={option.optionId} className={`mp-ios-opt${off ? " is-off" : ""}`}>
                          <input
                            type={single ? "radio" : "checkbox"}
                            name={`mp-ios-${group.groupId}`}
                            checked={checked}
                            disabled={off}
                            onChange={() => choose(group, option.optionId)}
                            onClick={() => { if (single && checked) choose(group, option.optionId); }}
                          />
                          <span style={{ flex: 1 }}>{option.name}</span>
                          {option.priceDeltaCents > 0 ? (
                            <span style={{ whiteSpace: "nowrap" }}>+{formatCents(option.priceDeltaCents)}</span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}

          {leaveOutOptions.length ? (
            <section className="mp-ios-group">
              <div className="mp-ios-ghead" style={{ cursor: "default" }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>Leave out</span>
                <span style={{ fontSize: 15, color: "#2b3338" }}>Optional</span>
              </div>
              <div style={{ padding: "0 26px 8px" }} className="mp-ios-gbody">
                {leaveOutOptions.map((ingredient) => (
                  <label key={ingredient} className="mp-ios-opt">
                    <input
                      type="checkbox"
                      checked={leftOut.includes(ingredient)}
                      onChange={() =>
                        setLeftOut((prev) => (prev.includes(ingredient) ? prev.filter((x) => x !== ingredient) : [...prev, ingredient]))
                      }
                    />
                    <span style={{ flex: 1 }}>No {ingredient}</span>
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mp-ios-group">
            <label className="mp-ios-pad" style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                Special instructions <span style={{ fontWeight: 400, fontSize: 14, color: "#667085" }}>(optional)</span>
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={280}
                rows={2}
                placeholder="Example: sauce on the side"
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid #d0d5dd", fontSize: 16, fontFamily: "inherit", resize: "none", color: "#11181c", background: "#fff" }}
              />
            </label>
          </section>
        </div>

        <div className="mp-ios-bar">
          <button type="button" className="mp-ios-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {blockingHint ? (
              <div role="status" style={{ fontSize: 12, color: "#b42318", textAlign: "center", fontWeight: 600 }}>
                {blockingHint}
              </div>
            ) : null}
            <button
              type="button"
              className="mp-ios-add"
              data-testid="item-sheet-add"
              aria-disabled={blocking ? "true" : "false"}
              onClick={handleAdd}
              style={{ background: accent, color: onAccent }}
            >
              <span>Add to order</span>
              <span>{formatCents(totalCents)}</span>
            </button>
          </div>
        </div>
      </div>

      {galleryOpen ? (
        <div className="mp-ios-gallery" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`${displayName} photos`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, color: "#fff" }}>
            <span style={{ fontSize: 15 }}>{photos.length} photos · swipe</span>
            <button type="button" aria-label="Close photos" onClick={() => setGalleryOpen(false)} className="mp-ios-close">
              ✕
            </button>
          </div>
          <div className="mp-ios-gallery-strip">
            {photos.map((url, index) => (
              <img key={url} src={url} alt={`${displayName} photo ${index + 1}`} />
            ))}
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}
