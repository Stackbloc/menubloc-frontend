import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OWNER_COLORS, PageCard } from "./OwnerLayout.jsx";
import { createMenuConsoleRestaurant } from "../../lib/ownerApi.js";

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: `1px solid ${OWNER_COLORS.line}`,
  fontSize: 13,
  fontFamily: "inherit",
  background: "#fff",
  color: "#101828",
  boxSizing: "border-box",
  outline: "none",
};

const fieldLabel = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: OWNER_COLORS.muted,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const RESTAURANT_TYPES = [
  { value: "", label: "— Select type —" },
  { value: "restaurant", label: "Restaurant" },
  { value: "food_truck", label: "Food Truck" },
  { value: "bar", label: "Bar" },
  { value: "cafe", label: "Cafe" },
  { value: "chain_store", label: "Chain Store" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "— Select category —" },
  { value: "restaurant", label: "Restaurant" },
  { value: "casual_dining", label: "Casual Dining" },
  { value: "fast_casual", label: "Fast Casual" },
  { value: "fast_food", label: "Fast Food" },
  { value: "fine_dining", label: "Fine Dining" },
  { value: "cafe", label: "Cafe" },
  { value: "bar", label: "Bar" },
  { value: "food_truck", label: "Food Truck" },
];

const CUISINE_OPTIONS = [
  { value: "", label: "— Select cuisine —" },
  { value: "american", label: "American" },
  { value: "mexican", label: "Mexican" },
  { value: "italian", label: "Italian" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "thai", label: "Thai" },
  { value: "indian", label: "Indian" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "southern", label: "Southern" },
  { value: "pizza", label: "Pizza" },
];

const EMPTY_FORM = {
  restaurant_name: "",
  address_line1: "",
  city: "",
  state: "",
  postal_code: "",
  phone: "",
  website: "",
  category: "",
  cuisine: "",
  restaurant_type: "",
};

function DuplicateWarning({ matches, onConfirm, onCancel, submitting }) {
  return (
    <div style={{ marginBottom: 14, padding: 14, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 8 }}>
        Similar restaurant{s} found in this city/state
      </div>
      <div style={{ fontSize: 12, color: "#78350f", marginBottom: 10 }}>
        Confirm this is a different location before creating a new record.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {matches.map((m) => (
          <div
            key={m.id}
            style={{ padding: "10px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}` }}
          >
            <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 2 }}>
              {[m.address_line1, m.city, m.state, m.postal_code].filter(Boolean).join(", ")}
              {m.id ? ` · #${m.id}` : ""}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={submitting}
          onClick={onConfirm}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}
        >
          {submitting ? "Creating…" : "Create anyway — different location"}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onCancel}
          style={{
            padding: "8px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`,
            background: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}
        >
          Go back
        </button>
      </div>
    </div>
  );
}

export default function OwnerCreateRestaurantForm({ onClose }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [duplicateMatches, setDuplicateMatches] = useState(null);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErr("");
    setDuplicateMatches(null);
  }

  async function submit(confirmDuplicate = false) {
    setSubmitting(true);
    setErr("");
    try {
      const payload = {
        restaurant_name: form.restaurant_name.trim(),
        address_line1: form.address_line1.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        postal_code: form.postal_code.trim(),
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        category: form.category || undefined,
        cuisine: form.cuisine || undefined,
        restaurant_type: form.restaurant_type || undefined,
        confirm_duplicate: confirmDuplicate || undefined,
      };
      const data = await createMenuConsoleRestaurant(payload);
      const restaurantId = data.restaurant?.id;
      const menuId = data.menu?.id;
      setForm(EMPTY_FORM);
      setDuplicateMatches(null);
      setOpen(false);
      onClose?.();
      if (restaurantId && menuId) {
        navigate(`/owner/restaurants/${restaurantId}/menus/${menuId}/edit?upload=1`);
      } else if (restaurantId) {
        navigate(`/owner/menu-manager?restaurant=${restaurantId}`);
      }
    } catch (ex) {
      if (ex?.status === 409 && ex?.payload?.duplicate_warning) {
        setDuplicateMatches(ex.payload.matches || []);
      } else {
        setErr(ex?.payload?.error || ex?.message || "Could not create restaurant.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.restaurant_name.trim()) { setErr("Restaurant name is required."); return; }
    if (!form.address_line1.trim()) { setErr("Address is required."); return; }
    if (!form.city.trim()) { setErr("City is required."); return; }
    if (!form.state.trim()) { setErr("State is required."); return; }
    if (!form.postal_code.trim()) { setErr("ZIP is required."); return; }
    submit(false);
  }

  function handleClose() {
    setOpen(false);
    setErr("");
    setDuplicateMatches(null);
    setForm(EMPTY_FORM);
    onClose?.();
  }

  if (!open) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          padding: "8px 14px", borderRadius: 10, background: OWNER_COLORS.accent, color: "#fff",
          border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        + Create Restaurant
      </button>
      </div>
    );
  }

  return (
    <PageCard style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: OWNER_COLORS.ink }}>Create Restaurant</div>
          <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
            Add a new restaurant, then upload its menu in the editor.
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          style={{
            padding: "6px 12px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`,
            background: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      {duplicateMatches && (
        <DuplicateWarning
          matches={duplicateMatches}
          submitting={submitting}
          onConfirm={() => submit(true)}
          onCancel={() => setDuplicateMatches(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={fieldLabel}>Restaurant name *</label>
            <input
              value={form.restaurant_name}
              onChange={(e) => updateField("restaurant_name", e.target.value)}
              placeholder="Tom's Watch Bar"
              style={inputStyle}
              autoFocus
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={fieldLabel}>Address *</label>
            <input
              value={form.address_line1}
              onChange={(e) => updateField("address_line1", e.target.value)}
              placeholder="123 Main St"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabel}>City *</label>
            <input value={form.city} onChange={(e) => updateField("city", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={fieldLabel}>State *</label>
            <input
              value={form.state}
              onChange={(e) => updateField("state", e.target.value.toUpperCase().slice(0, 2))}
              placeholder="CA"
              maxLength={2}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={fieldLabel}>ZIP *</label>
            <input value={form.postal_code} onChange={(e) => updateField("postal_code", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={fieldLabel}>Phone</label>
            <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={fieldLabel}>Website</label>
            <input value={form.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://" style={inputStyle} />
          </div>
          <div>
            <label style={fieldLabel}>Category</label>
            <select value={form.category} onChange={(e) => updateField("category", e.target.value)} style={inputStyle}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Cuisine</label>
            <select value={form.cuisine} onChange={(e) => updateField("cuisine", e.target.value)} style={inputStyle}>
              {CUISINE_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Restaurant type</label>
            <select value={form.restaurant_type} onChange={(e) => updateField("restaurant_type", e.target.value)} style={inputStyle}>
              {RESTAURANT_TYPES.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {err && <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 10 }}>{err}</div>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "9px 18px", borderRadius: 9, border: "none",
            background: submitting ? OWNER_COLORS.muted : OWNER_COLORS.accent,
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Creating…" : "Create Restaurant"}
        </button>
      </form>
    </PageCard>
  );
}
