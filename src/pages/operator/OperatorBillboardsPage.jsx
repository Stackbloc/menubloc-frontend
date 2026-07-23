/**
 * Operator Billboards — graphic-first deal splash for restaurant profile.
 * Creates/updates deals so text terms also appear on Deals.
 * Dual path: start here (graphic + terms) or start on Deals → Feature as Billboard.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const INPUT = {
  border: "1.5px solid #e4e9f0",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
  color: "#0f1720",
  outline: "none",
  boxSizing: "border-box",
};

const LABEL = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 6,
};

const PRIMARY_BTN = {
  border: "none",
  borderRadius: 10,
  background: "#1F4E3D",
  color: "#fff",
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
};

const SECONDARY_BTN = {
  border: "1px solid #e4e9f0",
  borderRadius: 10,
  background: "#fff",
  color: "#0f1720",
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

function defaultDates() {
  const start = new Date();
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  };
}

function menuItemDetailPath(itemId) {
  return `/menu-items/${itemId}`;
}

function MenuItemPicker({ allItems, selectedId, selectedName, onSelect, onClear, required }) {
  const [search, setSearch] = useState(selectedName || "");
  useEffect(() => {
    if (selectedName) setSearch(selectedName);
  }, [selectedName]);

  const filtered = allItems.filter((i) => {
    if (!search.trim() || selectedId) return false;
    const q = search.toLowerCase();
    return (
      String(i.name || "").toLowerCase().includes(q) ||
      String(i.item_number || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <label style={LABEL}>
        Menu item {required ? "*" : ""}{" "}
        <span style={{ fontWeight: 400, color: "#b0bbc8", textTransform: "none" }}>
          {required ? "Required for offers" : "Optional"}
        </span>
      </label>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          style={{ ...INPUT, flex: 1 }}
          value={selectedId ? selectedName || search : search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (selectedId) onClear();
          }}
          placeholder="Search by name or item number…"
        />
        {selectedId ? (
          <button type="button" onClick={() => { onClear(); setSearch(""); }} style={SECONDARY_BTN}>
            ✕
          </button>
        ) : null}
      </div>
      {!selectedId && search && filtered.length > 0 ? (
        <div
          style={{
            border: "1px solid #e4e9f0",
            borderRadius: 8,
            background: "#fff",
            maxHeight: 140,
            overflowY: "auto",
            marginTop: 4,
          }}
        >
          {filtered.slice(0, 8).map((i) => (
            <div
              key={i.id}
              onClick={() => {
                onSelect(i.id, i.name);
                setSearch(i.name);
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 13,
                borderBottom: "1px solid #f4f3ef",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{i.name}</span>
              <span style={{ color: "#8a9ab0", fontSize: 11 }}>
                {i.item_number}
                {i.price != null ? ` · $${Number(i.price).toFixed(2)}` : ""}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {selectedId ? (
        <div style={{ fontSize: 12, color: "#1F4E3D", fontWeight: 600, marginTop: 4 }}>
          ✓ {selectedName || search}
        </div>
      ) : null}
    </div>
  );
}

function BillboardEditor({
  allItems,
  initialDeal = null,
  initialBillboard = null,
  onCancel,
  onSaved,
}) {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const photoRef = useRef(null);
  const dates = defaultDates();

  const [title, setTitle] = useState(initialDeal?.title || "");
  const [description, setDescription] = useState(initialDeal?.description || "");
  const [headline, setHeadline] = useState(initialBillboard?.headline_override || "");
  const [imageUrl, setImageUrl] = useState(initialBillboard?.image_url || "");
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [splashOn, setSplashOn] = useState(() => {
    const status = initialBillboard?.status || initialBillboard?.billboard_status;
    if (!initialBillboard) return true;
    return status === "active";
  });
  const [slideOrder, setSlideOrder] = useState(() => {
    const order = Number(initialBillboard?.display_order);
    return Number.isInteger(order) && order >= 0 ? Math.min(order + 1, 6) : 1;
  });
  const [displaySeconds, setDisplaySeconds] = useState(() => {
    const ms = Number(initialBillboard?.display_duration_ms);
    if (Number.isFinite(ms) && ms >= 1000) return Math.round(ms / 1000);
    return 3.5;
  });
  const [imageFit, setImageFit] = useState(() => {
    const fit = String(initialBillboard?.image_fit || "contain").toLowerCase();
    return ["cover", "contain", "fill"].includes(fit) ? fit : "contain";
  });
  const [isOffer, setIsOffer] = useState(Boolean(initialDeal?.menu_item_id));
  const [menuItemId, setMenuItemId] = useState(initialDeal?.menu_item_id || "");
  const [menuItemName, setMenuItemName] = useState(initialDeal?.item_name || "");
  const [startDate, setStartDate] = useState(
    initialDeal?.starts_at ? String(initialDeal.starts_at).slice(0, 10) : dates.start_date
  );
  const [endDate, setEndDate] = useState(
    initialDeal?.expires_at ? String(initialDeal.expires_at).slice(0, 10) : dates.end_date
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = pendingPhoto
    ? URL.createObjectURL(pendingPhoto)
    : imageUrl || null;

  async function handleSave(event) {
    event.preventDefault();
    if (!rid) return;
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Title and text terms are required (they also appear on Deals).");
      return;
    }
    if (isOffer && !menuItemId) {
      setError("Select the menu item this offer sells.");
      return;
    }
    if (!initialDeal?.id && !pendingPhoto && !imageUrl) {
      setError("Upload a graphic for this billboard.");
      return;
    }

    setBusy(true);
    try {
      const dealPayload = {
        title: title.trim(),
        description: description.trim(),
        deal_type: "other",
        start_date: startDate,
        end_date: endDate,
        starts_at: `${startDate}T00:00:00.000Z`,
        expires_at: `${endDate}T23:59:59.999Z`,
        menu_item_id: isOffer ? menuItemId : null,
        allow_null_menu_item: !isOffer,
      };

      let dealId = initialDeal?.id || null;
      if (dealId) {
        await api.updateDeal(rid, dealId, dealPayload);
      } else {
        const created = await api.createDeal(rid, dealPayload);
        dealId = created?.deal?.id;
        if (!dealId) throw new Error("Deal was not created.");
        try {
          await api.publishDeal(rid, dealId);
        } catch {
          // Non-fatal if already visible as draft for operators
        }
      }

      let finalImageUrl = imageUrl || null;
      if (pendingPhoto) {
        const uploaded = await api.uploadBillboardPhoto(rid, dealId, pendingPhoto);
        if (uploaded?.photo_url) finalImageUrl = uploaded.photo_url;
        else if (uploaded?.ok === false) throw new Error(uploaded.error || "Photo upload failed");
      }

      if (splashOn) {
        await api.upsertDealBillboard(rid, dealId, {
          enabled: true,
          headline_override: headline.trim() || title.trim(),
          image_url: finalImageUrl,
          cta_label: isOffer ? "View item" : null,
          cta_url: isOffer && menuItemId ? menuItemDetailPath(menuItemId) : null,
          is_primary_search_billboard: false,
          display_order: Math.max(0, Math.min(5, Number(slideOrder) - 1)),
          image_fit: imageFit,
          display_duration_ms: Math.round(Number(displaySeconds) * 1000),
        });
      } else if (initialDeal?.id || dealId) {
        // Ensure billboard exists then pause, or just pause if present
        if (finalImageUrl || headline || imageUrl) {
          await api.upsertDealBillboard(rid, dealId, {
            enabled: true,
            headline_override: headline.trim() || title.trim(),
            image_url: finalImageUrl,
            cta_label: isOffer ? "View item" : null,
            cta_url: isOffer && menuItemId ? menuItemDetailPath(menuItemId) : null,
            is_primary_search_billboard: false,
            display_order: Math.max(0, Math.min(5, Number(slideOrder) - 1)),
            image_fit: imageFit,
            display_duration_ms: Math.round(Number(displaySeconds) * 1000),
          });
        }
        await api.removeDealBillboard(rid, dealId);
      }

      onSaved();
    } catch (err) {
      setError(err.message || "Unable to save billboard.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      data-testid="billboard-editor"
      style={{
        background: "#fff",
        border: "1px solid #e4e9f0",
        borderRadius: 14,
        padding: 18,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 15, color: "#0f1720" }}>
        {initialDeal?.id ? "Edit billboard" : "New billboard"}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
        Upload a graphic, enter the text terms (also listed on Deals), then turn profile splash On or Off.
        Up to 6 active billboards rotate on the profile splash.
      </p>

      {error ? (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", fontWeight: 700, fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      <div>
        <label style={LABEL}>Graphic *</label>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Billboard preview"
            style={{
              width: "100%",
              maxWidth: 420,
              height: 220,
              objectFit: imageFit,
              background: "#0b0b0f",
              borderRadius: 12,
              border: "1px solid #e4e9f0",
              display: "block",
              marginBottom: 10,
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              height: 120,
              borderRadius: 12,
              border: "1px dashed #cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: 13,
              marginBottom: 10,
            }}
          >
            No graphic yet
          </div>
        )}
        <input
          ref={photoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setPendingPhoto(e.target.files?.[0] || null)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={LABEL}>Slide order (1–6)</label>
          <select
            style={{ ...INPUT, width: "100%" }}
            value={slideOrder}
            onChange={(e) => setSlideOrder(Number(e.target.value))}
            data-testid="billboard-slide-order"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL}>Display time (seconds)</label>
          <input
            type="number"
            min={1}
            max={15}
            step={0.5}
            style={{ ...INPUT, width: "100%" }}
            value={displaySeconds}
            onChange={(e) => setDisplaySeconds(e.target.value)}
            data-testid="billboard-display-seconds"
          />
        </div>
        <div>
          <label style={LABEL}>Image fit</label>
          <select
            style={{ ...INPUT, width: "100%" }}
            value={imageFit}
            onChange={(e) => setImageFit(e.target.value)}
            data-testid="billboard-image-fit"
          >
            <option value="contain">Contain (recommended mobile)</option>
            <option value="cover">Cover</option>
            <option value="fill">Fill</option>
          </select>
        </div>
      </div>

      <div>
        <label style={LABEL}>Title *</label>
        <input style={{ ...INPUT, width: "100%" }} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Billboard / deal title" />
      </div>

      <div>
        <label style={LABEL}>Text terms * <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(shown on Deals)</span></label>
        <textarea
          style={{ ...INPUT, width: "100%", minHeight: 72, resize: "vertical" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Terms that apply to this billboard"
        />
      </div>

      <div>
        <label style={LABEL}>Headline on graphic <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(optional)</span></label>
        <input style={{ ...INPUT, width: "100%" }} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Defaults to title" />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13 }}>
        <input type="checkbox" checked={splashOn} onChange={(e) => setSplashOn(e.target.checked)} />
        Show on restaurant profile load (On / Off)
      </label>

      <div style={{ borderTop: "1px solid #e4e9f0", paddingTop: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>Is this billboard an offer to sell a menu item?</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
            <input type="radio" checked={isOffer} onChange={() => setIsOffer(true)} />
            Yes — link a menu item
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
            <input
              type="radio"
              checked={!isOffer}
              onChange={() => {
                setIsOffer(false);
                setMenuItemId("");
                setMenuItemName("");
              }}
            />
            No — graphic only (not selling a product)
          </label>
        </div>
        {isOffer ? (
          <MenuItemPicker
            allItems={allItems}
            selectedId={menuItemId}
            selectedName={menuItemName}
            required
            onSelect={(id, name) => {
              setMenuItemId(id);
              setMenuItemName(name);
            }}
            onClear={() => {
              setMenuItemId("");
              setMenuItemName("");
            }}
          />
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={LABEL}>Starts</label>
          <input type="date" style={{ ...INPUT, width: "100%" }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label style={LABEL}>Ends</label>
          <input type="date" style={{ ...INPUT, width: "100%" }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="submit" disabled={busy} style={{ ...PRIMARY_BTN, opacity: busy ? 0.7 : 1 }}>
          {busy ? "Saving…" : "Save billboard"}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} style={SECONDARY_BTN}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function OperatorBillboardsPage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const [deals, setDeals] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("list"); // list | create | edit
  const [editingDeal, setEditingDeal] = useState(null);
  const [editingBillboard, setEditingBillboard] = useState(null);

  const load = useCallback(async () => {
    if (!rid) {
      setDeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.getDeals(rid, {});
      const list = Array.isArray(data?.deals) ? data.deals : [];
      // Prefer deals that already have a billboard, then others (can still feature)
      setDeals(list);
    } catch (err) {
      setError(err.message || "Unable to load billboards.");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!rid) return;
    api.getMenus(rid).then(async (d) => {
      const menus = d.menus || [];
      const itemArrays = await Promise.all(
        menus.map((m) => api.getMenuItems(rid, m.id).then((r) => r.items || []).catch(() => []))
      );
      const all = itemArrays.flat();
      const seen = new Set();
      setAllItems(all.filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      }));
    }).catch(() => setAllItems([]));
  }, [rid]);

  const featured = useMemo(
    () => deals.filter((d) => d.billboard_status === "active" || d.billboard_status === "paused" || d.billboard_status === "draft"),
    [deals]
  );

  async function openEdit(deal) {
    setMode("edit");
    setEditingDeal(deal);
    setEditingBillboard(null);
    try {
      const data = await api.getDealBillboard(rid, deal.id);
      setEditingBillboard(data.billboard || null);
    } catch {
      setEditingBillboard(null);
    }
  }

  if (!rid) {
    return (
      <OperatorLayout title="Billboards">
        <p style={{ color: "#64748b" }}>Select a restaurant to manage billboards.</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Billboards">
      <div style={{ maxWidth: 820, display: "grid", gap: 16 }} data-testid="operator-billboards-page">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f1720" }}>Restaurant billboards</div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5, maxWidth: 560 }}>
              Graphic splash for your public profile (up to 6 active slides). Text terms also appear on{" "}
              <Link to="/operator/deals" style={{ color: "#1F4E3D", fontWeight: 700 }}>Deals</Link>.
              Start here with a graphic, or start on Deals and choose “Feature as Billboard”.
              Some billboards can be tied to offers (menu items).
            </p>
          </div>
          {mode === "list" ? (
            <button type="button" style={PRIMARY_BTN} onClick={() => setMode("create")} data-testid="billboard-create">
              New billboard
            </button>
          ) : null}
        </div>

        {error ? (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
            {error}
          </div>
        ) : null}

        {mode === "create" ? (
          <BillboardEditor
            allItems={allItems}
            onCancel={() => setMode("list")}
            onSaved={() => {
              setMode("list");
              load();
            }}
          />
        ) : null}

        {mode === "edit" && editingDeal ? (
          <BillboardEditor
            allItems={allItems}
            initialDeal={editingDeal}
            initialBillboard={editingBillboard}
            onCancel={() => {
              setMode("list");
              setEditingDeal(null);
              setEditingBillboard(null);
            }}
            onSaved={() => {
              setMode("list");
              setEditingDeal(null);
              setEditingBillboard(null);
              load();
            }}
          />
        ) : null}

        {mode === "list" ? (
          <div style={{ display: "grid", gap: 10 }}>
            {loading ? (
              <div style={{ color: "#64748b", fontSize: 14 }}>Loading…</div>
            ) : featured.length === 0 && deals.length === 0 ? (
              <div style={{ padding: 20, borderRadius: 12, border: "1px solid #e4e9f0", background: "#fff", color: "#64748b", fontSize: 14 }}>
                No billboards yet. Create one with a graphic and text terms, or feature a deal from Deals.
              </div>
            ) : (
              deals.map((deal) => {
                const status = deal.billboard_status || "none";
                const isFeatured = status === "active";
                return (
                  <div
                    key={deal.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e4e9f0",
                      borderRadius: 12,
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#0f1720" }}>{deal.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        {deal.description || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                        Billboard: {status === "none" ? "not featured" : status}
                        {deal.menu_item_id ? " · linked menu item" : " · no product link"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" style={SECONDARY_BTN} onClick={() => openEdit(deal)}>
                        {isFeatured || status === "paused" ? "Edit" : "Make billboard"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </OperatorLayout>
  );
}
