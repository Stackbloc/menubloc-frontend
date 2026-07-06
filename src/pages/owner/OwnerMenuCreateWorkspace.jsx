import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { MenuEditor, StatusChip, inputStyle } from "./ownerMenuEditorComponents.jsx";
import {
  approveReviewItem,
  createMenuConsoleRestaurant,
  getMenuConsoleMenu,
  getMenuConsoleProfileSchema,
  getOwnerMenuUploads,
  getUploadReviewItems,
  publishMenuConsoleMenu,
  rejectReviewItem,
  submitOwnerMenuFilePdf,
  updateMenuConsoleMenu,
} from "../../lib/ownerApi.js";

const fieldLabel = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: OWNER_COLORS.muted,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const STEPS = [
  { key: "profile", label: "1. Restaurant Profile" },
  { key: "attach", label: "2. Attach Menu" },
  { key: "review", label: "3. Review & Publish" },
];

const EMPTY_PROFILE = {
  restaurant_name: "",
  restaurant_type: "",
  address_line1: "",
  city: "",
  state: "",
  postal_code: "",
  country_code: "US",
  cuisine: "",
  price_tier: "",
  service_model: [],
  menu_offering_type: "",
  status: "draft",
  subscription_plan: "unverified",
  phone: "",
  website: "",
};

function StepHeader({ current }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
      {STEPS.map((step, idx) => {
        const active = step.key === current;
        const done = STEPS.findIndex((s) => s.key === current) > idx;
        return (
          <div
            key={step.key}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: active ? 700 : 600,
              background: active ? OWNER_COLORS.accentSoft : done ? "#f0fdf4" : "#fff",
              color: active ? OWNER_COLORS.accent : done ? "#15803d" : OWNER_COLORS.muted,
              border: `1px solid ${active ? OWNER_COLORS.accent : done ? "#bbf7d0" : OWNER_COLORS.line}`,
            }}
          >
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label style={fieldLabel}>{label}{required ? " *" : ""}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} required={required}>
        <option value="">— Select —</option>
        {(options || []).map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function DuplicateWarning({ matches, onConfirm, onCancel, submitting }) {
  return (
    <div style={{ marginBottom: 14, padding: 14, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 8 }}>Similar restaurants found</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {matches.map((m) => (
          <div key={m.id} style={{ padding: "10px 12px", borderRadius: 8, background: "#fff", border: `1px solid ${OWNER_COLORS.line}` }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
              {[m.address_line1, m.city, m.state, m.postal_code].filter(Boolean).join(", ")}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" disabled={submitting} onClick={onConfirm} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          Create anyway — different location
        </button>
        <button type="button" disabled={submitting} onClick={onCancel} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
          Go back
        </button>
      </div>
    </div>
  );
}

function ReviewItemRow({ item, onApprove, onReject }) {
  const [name, setName] = useState(item.parsed_name || item.proposed_item_name || "");
  const [price, setPrice] = useState(item.proposed_price != null ? String(item.proposed_price) : "");
  const [description, setDescription] = useState(item.parsed_description || item.proposed_description || "");
  const [section, setSection] = useState(item.section_name || "");
  const [acting, setActing] = useState(false);

  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={fieldLabel}>Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
        </div>
        <div>
          <label style={fieldLabel}>Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" min="0" style={{ ...inputStyle, fontSize: 12 }} />
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={fieldLabel}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, fontSize: 12, resize: "vertical" }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={fieldLabel}>Section</label>
        <input value={section} onChange={(e) => setSection(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" disabled={acting || !name.trim()} onClick={async () => { setActing(true); await onApprove({ name: name.trim(), price: price === "" ? null : Number(price), description: description.trim() || null, section: section.trim() || null }); setActing(false); }} style={{ padding: "7px 16px", borderRadius: 8, background: "#15803d", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Approve</button>
        <button type="button" disabled={acting} onClick={async () => { setActing(true); await onReject(); setActing(false); }} style={{ padding: "7px 14px", borderRadius: 8, background: "#fff", color: "#991b1b", border: "1px solid #fca5a5", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Reject</button>
      </div>
    </div>
  );
}

export default function OwnerMenuCreateWorkspace() {
  const [schema, setSchema] = useState(null);
  const [schemaError, setSchemaError] = useState("");
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [profileErr, setProfileErr] = useState("");
  const [duplicateMatches, setDuplicateMatches] = useState(null);
  const [creatingProfile, setCreatingProfile] = useState(false);

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [menuDetail, setMenuDetail] = useState(null);

  const [menuName, setMenuName] = useState("Main Menu");
  const [menuType, setMenuType] = useState("main");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const fileRef = useRef(null);

  const [reviewItems, setReviewItems] = useState([]);
  const [actionMsg, setActionMsg] = useState("");
  const [publishing, setPublishing] = useState(false);

  const step = !restaurant ? "profile" : reviewItems.length > 0 || menuDetail?.item_count > 0 ? "review" : "attach";
  const rid = restaurant?.id;
  const mid = menu?.id;

  useEffect(() => {
    getMenuConsoleProfileSchema()
      .then((data) => setSchema(data))
      .catch(() => setSchemaError("Could not load profile options."));
  }, []);

  function updateProfile(key, value) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setProfileErr("");
    setDuplicateMatches(null);
  }

  function toggleServiceModel(value) {
    setProfile((prev) => {
      const set = new Set(prev.service_model || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, service_model: Array.from(set) };
    });
  }

  async function createProfile(confirmDuplicate = false) {
    setCreatingProfile(true);
    setProfileErr("");
    try {
      const payload = {
        ...profile,
        restaurant_name: profile.restaurant_name.trim(),
        address_line1: profile.address_line1.trim(),
        city: profile.city.trim(),
        state: profile.state.trim().toUpperCase(),
        postal_code: profile.postal_code.trim(),
        primary_cuisine: profile.cuisine,
        service_models: profile.service_model,
        menu_name: menuName.trim() || "Main Menu",
        menu_type: menuType,
        confirm_duplicate: confirmDuplicate || undefined,
      };
      const data = await createMenuConsoleRestaurant(payload);
      setRestaurant(data.restaurant);
      setMenu(data.menu);
      setDuplicateMatches(null);
      if (data.menu?.display_name) setMenuName(data.menu.display_name);
      if (data.menu?.menu_type) setMenuType(data.menu.menu_type);
    } catch (ex) {
      if (ex?.status === 409 && ex?.payload?.duplicate_warning) {
        setDuplicateMatches(ex.payload.matches || []);
      } else {
        setProfileErr(ex?.payload?.error || ex?.message || "Could not create restaurant.");
      }
    } finally {
      setCreatingProfile(false);
    }
  }

  async function loadMenuState() {
    if (!rid || !mid) return;
    const detail = await getMenuConsoleMenu(rid, mid);
    setMenuDetail(detail);
    setMenu(detail.menu);
  }

  async function loadReviewItems() {
    if (!rid) return;
    const uploadsRes = await getOwnerMenuUploads({ restaurant_id: rid, limit: 20 });
    const pending = (uploadsRes.uploads || []).filter((u) => (u.human_review_items || 0) > 0);
    const groups = await Promise.all(
      pending.map(async (u) => {
        try {
          const res = await getUploadReviewItems(u.id);
          return (res.items || [])
            .filter((item) => item.status === "open" || item.status === "edited")
            .map((item) => ({ ...item, uploadId: u.id }));
        } catch {
          return [];
        }
      })
    );
    setReviewItems(groups.flat());
  }

  useEffect(() => {
    if (rid && mid) {
      loadMenuState().catch(() => {});
      loadReviewItems().catch(() => {});
    }
  }, [rid, mid]);

  async function handleUpload() {
    if (!file || !rid) {
      setUploadMsg({ ok: false, message: "Choose a PDF or image file first." });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      if (mid && (menuName.trim() || menuType)) {
        await updateMenuConsoleMenu(rid, mid, {
          display_name: menuName.trim() || menu?.display_name,
          menu_type: menuType,
        });
      }
      const json = await submitOwnerMenuFilePdf(rid, file);
      const inserted = (json.inserted_items || json.inserted || 0) + (json.updated_items || json.updated || 0);
      const reviewCount = json.review_count || 0;
      setUploadMsg({
        ok: true,
        message: `Processed — ${inserted} item${inserted !== 1 ? "s" : ""} added${reviewCount ? `, ${reviewCount} need review` : ""}.`,
      });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadMenuState();
      await loadReviewItems();
    } catch (err) {
      setUploadMsg({ ok: false, message: err?.payload?.error || err?.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  }

  async function saveDraft() {
    if (!rid || !mid) return;
    setPublishing(true);
    setActionMsg("");
    try {
      await updateMenuConsoleMenu(rid, mid, { display_name: menuName.trim(), menu_type: menuType });
      setActionMsg("Saved as draft.");
      await loadMenuState();
    } catch (err) {
      setActionMsg(err?.payload?.error || err?.message || "Could not save draft.");
    } finally {
      setPublishing(false);
    }
  }

  async function processForReview() {
    if (!rid || !mid) return;
    setPublishing(true);
    setActionMsg("");
    try {
      await updateMenuConsoleMenu(rid, mid, { display_name: menuName.trim(), menu_type: menuType });
      setActionMsg("Menu saved for review. Approve parsed items below, then publish.");
      await loadMenuState();
      await loadReviewItems();
    } catch (err) {
      setActionMsg(err?.payload?.error || err?.message || "Could not save for review.");
    } finally {
      setPublishing(false);
    }
  }

  async function publishMenu() {
    if (!rid || !mid) return;
    setPublishing(true);
    setActionMsg("");
    try {
      await updateMenuConsoleMenu(rid, mid, { display_name: menuName.trim(), menu_type: menuType });
      await publishMenuConsoleMenu(rid, mid);
      setActionMsg("Menu published.");
      await loadMenuState();
    } catch (err) {
      setActionMsg(err?.payload?.error || err?.message || "Could not publish menu.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <OwnerLayout
      title="Create Restaurant + Menu"
      subtitle="Create a full restaurant profile, attach a menu PDF or photo, review parsed items, then save or publish."
    >
      <StepHeader current={step} />

      {schemaError && (
        <PageCard style={{ padding: 16, marginBottom: 16, color: "#991b1b" }}>{schemaError}</PageCard>
      )}

      {/* ── Step 1: Profile ───────────────────────────────────── */}
      <PageCard style={{ padding: 20, marginBottom: 16, opacity: restaurant ? 0.72 : 1 }}>
        <SectionTitle
          title="Restaurant Profile"
          subtitle="Required fields use schema-controlled dropdowns from the platform catalog."
        />

        {duplicateMatches && (
          <DuplicateWarning
            matches={duplicateMatches}
            submitting={creatingProfile}
            onConfirm={() => createProfile(true)}
            onCancel={() => setDuplicateMatches(null)}
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={fieldLabel}>Restaurant name *</label>
            <input value={profile.restaurant_name} onChange={(e) => updateProfile("restaurant_name", e.target.value)} style={inputStyle} disabled={!!restaurant} />
          </div>
          <SelectField label="Restaurant type" value={profile.restaurant_type} onChange={(v) => updateProfile("restaurant_type", v)} options={schema?.restaurant_types} required />
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={fieldLabel}>Address *</label>
            <input value={profile.address_line1} onChange={(e) => updateProfile("address_line1", e.target.value)} style={inputStyle} disabled={!!restaurant} />
          </div>
          <div>
            <label style={fieldLabel}>City *</label>
            <input value={profile.city} onChange={(e) => updateProfile("city", e.target.value)} style={inputStyle} disabled={!!restaurant} />
          </div>
          <div>
            <label style={fieldLabel}>State *</label>
            <input value={profile.state} onChange={(e) => updateProfile("state", e.target.value.toUpperCase().slice(0, 2))} maxLength={2} style={inputStyle} disabled={!!restaurant} />
          </div>
          <div>
            <label style={fieldLabel}>ZIP *</label>
            <input value={profile.postal_code} onChange={(e) => updateProfile("postal_code", e.target.value)} style={inputStyle} disabled={!!restaurant} />
          </div>
          <SelectField label="Country" value={profile.country_code} onChange={(v) => updateProfile("country_code", v)} options={schema?.countries} required />
          <SelectField label="Primary cuisine" value={profile.cuisine} onChange={(v) => updateProfile("cuisine", v)} options={schema?.cuisines} required />
          <SelectField label="Price tier" value={profile.price_tier} onChange={(v) => updateProfile("price_tier", v)} options={schema?.price_tiers} required />
          <SelectField label="Subscription plan" value={profile.subscription_plan} onChange={(v) => updateProfile("subscription_plan", v)} options={schema?.subscription_plans} required />
          <SelectField label="Alcohol / menu category" value={profile.menu_offering_type} onChange={(v) => updateProfile("menu_offering_type", v)} options={schema?.menu_offering_types} required />
          <SelectField label="Status" value={profile.status} onChange={(v) => updateProfile("status", v)} options={schema?.profile_statuses} required />
          <div>
            <label style={fieldLabel}>Phone</label>
            <input value={profile.phone} onChange={(e) => updateProfile("phone", e.target.value)} style={inputStyle} disabled={!!restaurant} />
          </div>
          <div>
            <label style={fieldLabel}>Website</label>
            <input value={profile.website} onChange={(e) => updateProfile("website", e.target.value)} style={inputStyle} disabled={!!restaurant} />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={fieldLabel}>Service model *</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(schema?.service_models || []).map((opt) => {
              const active = (profile.service_model || []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!!restaurant}
                  onClick={() => toggleServiceModel(opt.value)}
                  style={{
                    padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
                    border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                    background: active ? OWNER_COLORS.accentSoft : "#fff",
                    color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                    cursor: restaurant ? "not-allowed" : "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {profileErr && <div style={{ marginTop: 12, fontSize: 12, color: "#991b1b" }}>{profileErr}</div>}

        {!restaurant && (
          <button
            type="button"
            disabled={creatingProfile || !schema}
            onClick={() => createProfile(false)}
            style={{
              marginTop: 16, padding: "10px 18px", borderRadius: 10, border: "none",
              background: creatingProfile ? OWNER_COLORS.muted : OWNER_COLORS.accent,
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: creatingProfile ? "not-allowed" : "pointer",
            }}
          >
            {creatingProfile ? "Creating profile…" : "Create Restaurant Profile →"}
          </button>
        )}

        {restaurant && (
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, color: "#15803d", fontWeight: 600 }}>
            Profile created: {restaurant.restaurant_name || restaurant.name} (#{restaurant.id})
          </div>
        )}
      </PageCard>

      {/* ── Step 2: Attach menu ───────────────────────────────── */}
      {restaurant && (
        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <SectionTitle title="Attach Menu PDF / Photo" subtitle="Upload a file to parse menu items for this restaurant." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
            <div>
              <label style={fieldLabel}>Menu name</label>
              <input value={menuName} onChange={(e) => setMenuName(e.target.value)} style={inputStyle} />
            </div>
            <SelectField label="Menu type" value={menuType} onChange={setMenuType} options={schema?.menu_types} required />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={fieldLabel}>Upload PDF or photo</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ ...inputStyle, padding: "10px 12px" }}
            />
            {file && <div style={{ marginTop: 6, fontSize: 12, color: OWNER_COLORS.muted }}>Selected: <strong>{file.name}</strong></div>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <button type="button" disabled={uploading} onClick={handleUpload} style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: OWNER_COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: uploading ? "not-allowed" : "pointer" }}>
              {uploading ? "Uploading…" : "Upload & Parse Menu"}
            </button>
            <button type="button" disabled={publishing} onClick={saveDraft} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Save as Draft</button>
            <button type="button" disabled={publishing} onClick={processForReview} style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Process for Review</button>
            <button type="button" disabled={publishing} onClick={publishMenu} style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: "#15803d", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Publish</button>
          </div>
          {(uploadMsg || actionMsg) && (
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: (uploadMsg?.ok ?? true) ? "#f0fdf4" : "#fff1ef", color: (uploadMsg?.ok ?? true) ? "#15803d" : "#991b1b", fontSize: 13, fontWeight: 600 }}>
              {uploadMsg?.message || actionMsg}
            </div>
          )}
        </PageCard>
      )}

      {/* ── Step 3: Review + editor ───────────────────────────── */}
      {restaurant && reviewItems.length > 0 && (
        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <SectionTitle title="Items Needing Review" subtitle="Approve or reject parsed items before publishing." />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {reviewItems.map((item) => (
              <ReviewItemRow
                key={`${item.uploadId}-${item.id}`}
                item={item}
                onApprove={async (edits) => {
                  await approveReviewItem(item.uploadId, item.id, edits);
                  await loadReviewItems();
                  await loadMenuState();
                }}
                onReject={async () => {
                  await rejectReviewItem(item.uploadId, item.id);
                  await loadReviewItems();
                }}
              />
            ))}
          </div>
        </PageCard>
      )}

      {restaurant && menuDetail && (
        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <SectionTitle title="Menu Items" subtitle={`${menuDetail.item_count ?? 0} items on ${menuName}`} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <StatusChip status={menuDetail.menu?.status} />
              </div>
            </div>
            <Link
              to={`/owner/restaurants/${rid}/menus/${mid}/edit`}
              style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}
            >
              Open full editor →
            </Link>
          </div>
          <MenuEditor
            restaurantId={rid}
            menuDetail={menuDetail}
            onMenuUpdated={(updated) => setMenuDetail((prev) => (prev ? { ...prev, menu: { ...prev.menu, ...updated } } : prev))}
            onMenuDeleted={() => {}}
            onReload={loadMenuState}
          />
        </PageCard>
      )}

      {restaurant && (
        <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
          <a href={`/public/restaurants/${rid}/menu`} target="_blank" rel="noopener noreferrer" style={{ color: OWNER_COLORS.accent, fontWeight: 700 }}>
            View public menu ↗
          </a>
        </div>
      )}
    </OwnerLayout>
  );
}
