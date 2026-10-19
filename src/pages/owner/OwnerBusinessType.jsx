import React, { useEffect, useState } from "react";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { inputStyle } from "./ownerMenuEditorComponents.jsx";
import { listMenuConsoleFranchiseBrands, setMenuConsoleBusinessType } from "../../lib/ownerApi.js";

/**
 * Restaurant Manager → business type (2026-10-19).
 *   Stand-alone · MLE (one restaurant, several kitchens under Locations) ·
 *   Franchise (a store of a chain: pick the brand or add a new one).
 * Create mode is controlled (value/onChange, sent with Add Restaurant);
 * existing mode converts the saved restaurant through the API.
 */

export const EMPTY_BUSINESS_TYPE = { business_type: "standalone", chain_id: null, chain_name: "", company_owned: false };

const TYPES = [
  { value: "standalone", label: "Stand-alone", hint: "One restaurant, one location." },
  { value: "mle", label: "MLE", hint: "One restaurant with several kitchens (add them under Locations)." },
  { value: "franchise", label: "Franchise", hint: "A store of a chain. Shares the chain menu with every store." },
];

const CURRENT_LABEL = {
  standalone: "Stand-alone",
  mle: "MLE",
  franchise: "Franchise store",
  company_owned: "Company-owned chain store",
  brand_record: "Franchise brand record",
};

const label = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: OWNER_COLORS.muted,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

function TypeButtons({ value, onChange, disabled }) {
  return (
    <div role="radiogroup" aria-label="Business type" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {TYPES.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`business-type-${t.value}`}
            disabled={disabled}
            onClick={() => onChange(t.value)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
              border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
              background: active ? OWNER_COLORS.accentSoft : "#fff",
              color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** Pick an existing franchise brand or type a new one. */
function BrandPicker({ value, onChange, disabled, defaultQuery }) {
  const [q, setQ] = useState(value.chain_name || defaultQuery || "");
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);

  // The prefilled name (the restaurant's own) counts as typed, so Convert/Add can use it.
  useEffect(() => {
    if (!value.chain_id && !value.chain_name && q.trim()) onChange({ ...value, chain_name: q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await listMenuConsoleFranchiseBrands(q.trim());
        if (alive) setBrands(data?.brands || []);
      } catch (_) {
        if (alive) setBrands([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [q]);

  const exact = brands.find((b) => b.name.toLowerCase().replace(/[^a-z0-9]/g, "") === q.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const picked = value.chain_id ? brands.find((b) => b.id === value.chain_id) || { id: value.chain_id, name: value.chain_label } : null;

  return (
    <div style={{ marginTop: 10 }}>
      <label style={label}>Franchise brand *</label>
      <input
        value={q}
        disabled={disabled}
        placeholder="Search brands, or type a new brand name"
        data-testid="business-type-brand-search"
        onChange={(e) => {
          setQ(e.target.value);
          onChange({ ...value, chain_id: null, chain_label: "", chain_name: e.target.value });
        }}
        style={inputStyle}
      />
      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {brands.slice(0, 8).map((b) => {
          const active = value.chain_id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...value, chain_id: b.id, chain_label: b.name, chain_name: "" })}
              style={{
                padding: "4px 10px", borderRadius: 14, fontSize: 12,
                border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                background: active ? OWNER_COLORS.accentSoft : "#fff",
                color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {b.name} · {b.store_count} store{b.store_count === 1 ? "" : "s"}
            </button>
          );
        })}
        {loading && <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>Searching…</span>}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>
        {picked
          ? `Joins ${picked.name}: this restaurant shows the ${picked.name} chain menu.`
          : q.trim().length >= 2
            ? exact
              ? `${exact.name} already exists — pick it above.`
              : `New brand "${q.trim()}": this restaurant's menu becomes the ${q.trim()} chain menu.`
            : "Pick a brand, or type a new brand name."}
      </div>
      {!value.chain_id && q.trim().length >= 2 && !exact && (
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12, color: OWNER_COLORS.ink }}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={!!value.company_owned}
            onChange={(e) => onChange({ ...value, company_owned: e.target.checked })}
          />
          Company-owned brand (not franchised, e.g. CAVA)
        </label>
      )}
    </div>
  );
}

/** Body for the API from the picker state. */
export function businessTypePayload(v) {
  if (!v || !v.business_type) return {};
  if (v.business_type !== "franchise") return { business_type: v.business_type };
  return v.chain_id
    ? { business_type: "franchise", chain_id: v.chain_id }
    : { business_type: "franchise", chain_name: String(v.chain_name || "").trim(), company_owned: !!v.company_owned };
}

export function businessTypeMissing(v) {
  if (v?.business_type !== "franchise") return null;
  if (v.chain_id || String(v.chain_name || "").trim().length >= 2) return null;
  return "Franchise brand";
}

/** Create mode: controlled picker sent with Add Restaurant. */
export function BusinessTypeCreateField({ value, onChange, disabled, restaurantName }) {
  const hint = TYPES.find((t) => t.value === value.business_type)?.hint;
  return (
    <div data-testid="business-type-create">
      <label style={label}>Business type *</label>
      <TypeButtons value={value.business_type} disabled={disabled} onChange={(t) => onChange({ ...value, business_type: t })} />
      {hint && <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>{hint}</div>}
      {value.business_type === "franchise" && (
        <BrandPicker value={value} onChange={onChange} disabled={disabled} defaultQuery={restaurantName} />
      )}
    </div>
  );
}

/** Existing restaurant: current type + convert. */
export function BusinessTypeConvertPanel({ restaurant, onConverted }) {
  const current = restaurant?.business_type || null;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(EMPTY_BUSINESS_TYPE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    setDone("");
  }, [restaurant?.id]);

  useEffect(() => {
    setOpen(false);
    setError("");
    setValue({ ...EMPTY_BUSINESS_TYPE, business_type: current?.business_type === "mle" ? "franchise" : "mle" });
  }, [restaurant?.id, current?.business_type]);

  if (!restaurant?.id || !current) return null;
  const isChainStore = current.chain != null;
  const kind = current.business_type;

  async function convert() {
    const missing = businessTypeMissing(value);
    if (missing) {
      setError(`Choose the ${missing.toLowerCase()}.`);
      return;
    }
    setBusy(true);
    setError("");
    setDone("");
    try {
      const data = await setMenuConsoleBusinessType(restaurant.id, businessTypePayload(value));
      const after = data?.business_type;
      const parts = [`Now: ${CURRENT_LABEL[after?.business_type] || after?.business_type}`];
      if (after?.chain) parts.push(`${after.chain.name} (${after.chain.store_count} store${after.chain.store_count === 1 ? "" : "s"})`);
      if (data?.result?.canonical_menu?.copied) parts.push(`${data.result.canonical_menu.copied} menu items became the chain menu`);
      if (data?.stores_published != null) parts.push(`chain menu published to ${data.stores_published} store${data.stores_published === 1 ? "" : "s"}`);
      if (data?.store_failures?.length) parts.push(`${data.store_failures.length} store(s) need attention`);
      setDone(parts.join(" · "));
      setOpen(false);
      onConverted?.(data);
    } catch (ex) {
      setError(ex?.payload?.error || ex?.message || "Could not change the business type.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="business-type-panel" style={{ border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={label}>Business type</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: OWNER_COLORS.ink }} data-testid="business-type-current">
            {CURRENT_LABEL[kind] || kind}
            {current.chain ? ` · ${current.chain.name} (${current.chain.store_count} store${current.chain.store_count === 1 ? "" : "s"})` : ""}
            {kind === "mle" && current.location_count ? ` · ${current.location_count} location${current.location_count === 1 ? "" : "s"}` : ""}
          </div>
        </div>
        {!isChainStore && kind !== "brand_record" && !open && (
          <button
            type="button"
            data-testid="business-type-change"
            onClick={() => setOpen(true)}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            Convert to MLE or franchise
          </button>
        )}
      </div>
      {isChainStore && (
        <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>
          Menu comes from the {current.chain.name} chain menu. Add more stores with Franchise Bot.
        </div>
      )}
      {open && (
        <div style={{ marginTop: 10 }}>
          <TypeButtons value={value.business_type} disabled={busy} onChange={(t) => setValue({ ...value, business_type: t })} />
          <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>
            {TYPES.find((t) => t.value === value.business_type)?.hint}
          </div>
          {value.business_type === "franchise" && (
            <>
              <BrandPicker value={value} onChange={setValue} disabled={busy} defaultQuery={restaurant.restaurant_name} />
              <div style={{ marginTop: 8, fontSize: 12, color: OWNER_COLORS.muted }}>
                This restaurant's own menu rows are hidden (not deleted) once the chain menu replaces them.
              </div>
            </>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              data-testid="business-type-save"
              disabled={busy || value.business_type === kind}
              onClick={convert}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700,
                background: OWNER_COLORS.accent, color: "#fff", cursor: busy ? "wait" : "pointer",
                opacity: value.business_type === kind ? 0.5 : 1,
              }}
            >
              {busy ? "Converting…" : "Convert"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontSize: 12, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b" }}>{error}</div>}
      {done && <div data-testid="business-type-done" style={{ marginTop: 8, fontSize: 12, color: "#166534" }}>{done}</div>}
    </div>
  );
}
