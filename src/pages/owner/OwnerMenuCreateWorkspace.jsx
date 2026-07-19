import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { MenuEditor, StatusChip, inputStyle } from "./ownerMenuEditorComponents.jsx";
import OwnerMenuRestaurantFinder, { saveRecentRestaurant } from "./OwnerMenuRestaurantFinder.jsx";
import OcrEditSplitLayout from "./OcrEditSplitLayout.jsx";
import {
  bulkReviewItems,
  createMenuConsoleMenu,
  createMenuConsoleRestaurant,
  getMenuConsoleMenu,
  getMenuConsoleProfileSchema,
  getMenuConsoleRestaurant,
  getMenuConsoleRestaurantMenus,
  getOwnerMenuUpload,
  getOwnerMenuUploads,
  getUploadReviewItems,
  publishUpload,
  submitOwnerMenuFilePdf,
  unpublishMenuConsoleMenu,
  updateMenuConsoleMenu,
  updateMenuConsoleRestaurant,
  deleteMenuConsoleMenu,
  deleteMenuConsoleRestaurant,
  getMenuConsoleRestaurantDeleteImpact,
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
  { key: "attach", label: "2. Upload Menu" },
  { key: "review", label: "3. Review & Edit" },
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
  status: "draft",
  subscription_plan: "unverified",
  phone: "",
  website: "",
  lat: "",
  lng: "",
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

function profileFromRestaurant(r = {}) {
  const serviceModel = r.service_model;
  return {
    ...EMPTY_PROFILE,
    restaurant_name: r.restaurant_name || r.name || "",
    restaurant_type: r.restaurant_type || "",
    address_line1: r.address_line1 || "",
    city: r.city || "",
    state: r.state || "",
    postal_code: r.postal_code || "",
    country_code: r.country_code || "US",
    cuisine: r.cuisine || "",
    price_tier: r.price_tier || "",
    service_model: Array.isArray(serviceModel)
      ? serviceModel
      : String(serviceModel || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    status: r.status || "draft",
    subscription_plan: r.subscription_plan || "unverified",
    phone: r.phone || "",
    website: r.website || r.website_url || "",
    lat: r.lat != null ? String(r.lat) : "",
    lng: r.lng != null ? String(r.lng) : "",
  };
}

export default function OwnerMenuCreateWorkspace({ embedded = false } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schema, setSchema] = useState(null);
  const [schemaError, setSchemaError] = useState("");
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [profileErr, setProfileErr] = useState("");
  const [duplicateMatches, setDuplicateMatches] = useState(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteImpact, setDeleteImpact] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingRestaurant, setDeletingRestaurant] = useState(false);

  const [restaurant, setRestaurant] = useState(null);
  const [existingRestaurant, setExistingRestaurant] = useState(false);
  const [availableMenus, setAvailableMenus] = useState([]);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);
  const [loadRestaurantErr, setLoadRestaurantErr] = useState("");
  const [menu, setMenu] = useState(null);
  const [menuDetail, setMenuDetail] = useState(null);

  const [menuName, setMenuName] = useState("Main Menu");
  const [menuType, setMenuType] = useState("main");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [pendingUploadId, setPendingUploadId] = useState(null);
  const [importingParsed, setImportingParsed] = useState(false);
  const fileRef = useRef(null);

  const [reviewItems, setReviewItems] = useState([]);
  const [reviewSessions, setReviewSessions] = useState([]);
  const [sourcePages, setSourcePages] = useState([]);
  const [bulkActing, setBulkActing] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  const loadGenerationRef = useRef(0);
  const suppressUrlLoadRef = useRef(false);
  const prefillAppliedRef = useRef(false);
  const menuEditorRef = useRef(null);

  const step = !restaurant ? "profile" : reviewItems.length > 0 || menuDetail?.item_count > 0 ? "review" : "attach";
  const rid = restaurant?.id;
  const mid = menu?.id;

  function scrollToMenuEditor() {
    requestAnimationFrame(() => {
      menuEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function patchWorkspaceParams(mutator) {
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.set("tab", "workspace");
      mutator(next);
      return next;
    }, { replace: true });
  }

  useEffect(() => {
    getMenuConsoleProfileSchema()
      .then((data) => setSchema(data))
      .catch(() => setSchemaError("Could not load profile options."));
  }, []);

  useEffect(() => {
    if (prefillAppliedRef.current || restaurant) return;
    const wantsCreate = searchParams.get("create") === "1";
    const name = String(searchParams.get("name") || "").trim();
    const city = String(searchParams.get("city") || "").trim();
    const state = String(searchParams.get("state") || "").trim();
    if (!wantsCreate && !name && !city && !state) return;
    prefillAppliedRef.current = true;
    setProfile((prev) => ({
      ...prev,
      restaurant_name: name || prev.restaurant_name,
      city: city || prev.city,
      state: state || prev.state,
    }));
  }, [searchParams, restaurant]);

  async function loadExistingRestaurant(restaurantId, seed = null) {
    const ridNum = Number(restaurantId);
    if (!Number.isFinite(ridNum)) return;
    const generation = ++loadGenerationRef.current;
    setLoadingRestaurant(true);
    setLoadRestaurantErr("");
    setDuplicateMatches(null);
    setProfileErr("");
    setUploadMsg(null);
    setPendingUploadId(null);
    setActionMsg("");
    try {
      const data = await getMenuConsoleRestaurantMenus(ridNum);
      if (generation !== loadGenerationRef.current) return;
      const loadedRestaurant = data.restaurant || seed || { id: ridNum };
      let fullProfile = loadedRestaurant;
      try {
        const profileRes = await getMenuConsoleRestaurant(ridNum);
        if (generation !== loadGenerationRef.current) return;
        if (profileRes?.restaurant) fullProfile = { ...loadedRestaurant, ...profileRes.restaurant };
      } catch {
        // menus payload is enough for minimal load
      }
      const normalizedRestaurant = {
        ...fullProfile,
        id: fullProfile.id || ridNum,
        restaurant_name: fullProfile.restaurant_name || fullProfile.name,
      };
      const menus = Array.isArray(data.menus) ? data.menus : [];
      let activeMenu = menus.find((m) => m.is_primary) || menus.find((m) => m.menu_type === "main") || menus[0] || null;
      if (!activeMenu) {
        const created = await createMenuConsoleMenu(ridNum, {
          display_name: menuName.trim() || "Main Menu",
          menu_type: menuType || "main",
        });
        activeMenu = created.menu;
        menus.push(activeMenu);
      }
      setRestaurant(normalizedRestaurant);
      setExistingRestaurant(true);
      setAvailableMenus(menus);
      setProfile(profileFromRestaurant(normalizedRestaurant));
      setMenu(activeMenu);
      if (activeMenu?.display_name) setMenuName(activeMenu.display_name);
      if (activeMenu?.menu_type) setMenuType(activeMenu.menu_type);
      saveRecentRestaurant(normalizedRestaurant);
      patchWorkspaceParams((next) => {
        next.set("restaurant", String(ridNum));
        next.delete("create");
        next.delete("name");
        next.delete("city");
        next.delete("state");
      });
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      setLoadRestaurantErr(err?.payload?.error || err?.message || "Could not load restaurant.");
    } finally {
      if (generation === loadGenerationRef.current) {
        setLoadingRestaurant(false);
      }
    }
  }

  useEffect(() => {
    const restaurantParam = searchParams.get("restaurant");
    if (!restaurantParam) {
      suppressUrlLoadRef.current = false;
      return;
    }
    if (restaurant || suppressUrlLoadRef.current) return;
    loadExistingRestaurant(restaurantParam);
  }, [searchParams, restaurant]);

  function clearSelectedRestaurant() {
    suppressUrlLoadRef.current = true;
    loadGenerationRef.current += 1;
    setRestaurant(null);
    setExistingRestaurant(false);
    setAvailableMenus([]);
    setMenu(null);
    setMenuDetail(null);
    setReviewItems([]);
    setReviewSessions([]);
    setProfile(EMPTY_PROFILE);
    setMenuName("Main Menu");
    setMenuType("main");
    setFile(null);
    setUploadMsg(null);
    setPendingUploadId(null);
    setActionMsg("");
    setProfileErr("");
    setDuplicateMatches(null);
    setLoadRestaurantErr("");
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      next.set("tab", "workspace");
      next.delete("restaurant");
      return next;
    }, { replace: true });
  }

  async function selectExistingRestaurant(row) {
    await loadExistingRestaurant(row.id, row);
  }

  async function reloadMenus(preferredMenuId = null) {
    if (!rid) return;
    const data = await getMenuConsoleRestaurantMenus(rid);
    const menus = Array.isArray(data.menus) ? data.menus : [];
    setAvailableMenus(menus);
    const nextMenu = menus.find((m) => m.id === preferredMenuId)
      || menus.find((m) => m.id === mid)
      || menus.find((m) => m.is_primary)
      || menus[0]
      || null;
    if (nextMenu) {
      await switchMenu(nextMenu);
    } else {
      setMenu(null);
      setMenuDetail(null);
    }
    return menus;
  }

  async function handleMenuDeleted(deletedMenuId) {
    setActionMsg("Menu deleted.");
    const menus = await reloadMenus();
    if (!menus.length) {
      setMenuName("Main Menu");
      setMenuType("main");
    }
  }

  async function handleAddMenu() {
    if (!rid) return;
    setPublishing(true);
    setActionMsg("");
    try {
      const created = await createMenuConsoleMenu(rid, {
        display_name: menuName.trim() || "New Menu",
        menu_type: menuType || "main",
      });
      await reloadMenus(created.menu?.id);
      setActionMsg(`Menu "${created.menu?.display_name || "New Menu"}" created.`);
    } catch (err) {
      setActionMsg(err?.payload?.error || err?.message || "Could not create menu.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeleteMenuRow(targetMenu) {
    if (!rid || !targetMenu?.id) return;
    if (targetMenu.is_primary) {
      setActionMsg("Cannot delete the primary menu.");
      return;
    }
    const label = targetMenu.display_name || targetMenu.name || `Menu #${targetMenu.id}`;
    if (!window.confirm(`Delete "${label}" and its items? This cannot be undone.`)) return;
    setPublishing(true);
    try {
      await deleteMenuConsoleMenu(rid, targetMenu.id);
      await handleMenuDeleted(targetMenu.id);
    } catch (err) {
      setActionMsg(err?.payload?.error || err?.message || "Could not delete menu.");
    } finally {
      setPublishing(false);
    }
  }

  async function switchMenu(nextMenu) {
    if (!nextMenu?.id || !rid) return;
    const alreadyActive = Number(nextMenu.id) === Number(mid);
    if (alreadyActive && menuDetail) {
      scrollToMenuEditor();
      return;
    }
    setMenu(nextMenu);
    if (nextMenu.display_name) setMenuName(nextMenu.display_name);
    if (nextMenu.menu_type) setMenuType(nextMenu.menu_type);
    if (!alreadyActive) setMenuDetail(null);
    try {
      const detail = await getMenuConsoleMenu(rid, nextMenu.id);
      setMenuDetail(detail);
      setMenu(detail.menu || nextMenu);
      scrollToMenuEditor();
    } catch (err) {
      setMenuDetail(null);
      setActionMsg(err?.payload?.error || err?.message || "Could not load menu items.");
    }
  }

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

  useEffect(() => {
    if (!existingRestaurant || !rid) {
      setDeleteImpact(null);
      return;
    }
    getMenuConsoleRestaurantDeleteImpact(rid)
      .then((res) => setDeleteImpact(res.impact || null))
      .catch(() => setDeleteImpact(null));
  }, [existingRestaurant, rid]);

  async function handleDeleteRestaurant() {
    if (!rid || !deleteImpact) return;
    const expected = `DELETE ${rid}`;
    if (deleteConfirm.trim() !== expected) {
      setProfileErr(`Type "${expected}" to confirm.`);
      return;
    }
    const mode = deleteImpact.recommended_mode || "quarantine";
    const label = mode === "hard" ? "permanently delete" : "quarantine (hide from discovery)";
    if (!window.confirm(`${label} restaurant #${rid} (${restaurant?.restaurant_name || restaurant?.name})?`)) return;

    setDeletingRestaurant(true);
    setProfileErr("");
    try {
      await deleteMenuConsoleRestaurant(rid, { mode, confirm: expected });
      clearSelectedRestaurant();
      setActionMsg(mode === "hard" ? "Restaurant permanently deleted." : "Restaurant quarantined and hidden from discovery.");
    } catch (ex) {
      setProfileErr(ex?.payload?.error || ex?.message || "Could not delete restaurant.");
    } finally {
      setDeletingRestaurant(false);
    }
  }

  async function saveExistingProfile() {
    if (!rid) return;
    setSavingProfile(true);
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
        lat: profile.lat === "" ? null : Number(profile.lat),
        lng: profile.lng === "" ? null : Number(profile.lng),
        geo_source: profile.lat !== "" && profile.lng !== "" ? "manual" : undefined,
      };
      const data = await updateMenuConsoleRestaurant(rid, payload);
      setRestaurant(data.restaurant);
      setProfile(profileFromRestaurant(data.restaurant));
      setActionMsg("Restaurant profile saved.");
    } catch (ex) {
      setProfileErr(ex?.payload?.error || ex?.message || "Could not save restaurant profile.");
    } finally {
      setSavingProfile(false);
    }
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
        lat: profile.lat === "" ? null : Number(profile.lat),
        lng: profile.lng === "" ? null : Number(profile.lng),
        geo_source: profile.lat !== "" && profile.lng !== "" ? "manual" : undefined,
        menu_name: menuName.trim() || "Main Menu",
        menu_type: menuType,
        confirm_duplicate: confirmDuplicate || undefined,
      };
      const data = await createMenuConsoleRestaurant(payload);
      setRestaurant(data.restaurant);
      setExistingRestaurant(false);
      setMenu(data.menu);
      setAvailableMenus(data.menu ? [data.menu] : []);
      setDuplicateMatches(null);
      if (data.menu?.display_name) setMenuName(data.menu.display_name);
      if (data.menu?.menu_type) setMenuType(data.menu.menu_type);
      setSearchParams((params) => {
        const next = new URLSearchParams(params);
        next.set("tab", "workspace");
        next.set("restaurant", String(data.restaurant.id));
        next.delete("create");
        next.delete("name");
        next.delete("city");
        next.delete("state");
        return next;
      }, { replace: true });
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
    const uploads = uploadsRes.uploads || [];
    const pending = uploads.filter((u) => (u.human_review_items || 0) > 0);
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
    const flat = groups.flat();
    setReviewItems(flat);
    const sessions = await Promise.all(
      pending.map(async (u) => {
        try {
          const detail = await getOwnerMenuUpload(u.id);
          return {
            id: u.id,
            pages: detail.upload?.pages || detail.pages || [],
            human_review_items: u.human_review_items,
          };
        } catch {
          return { id: u.id, pages: [], human_review_items: u.human_review_items };
        }
      })
    );
    setReviewSessions(sessions);
    if (!pendingUploadId && pending[0]?.id) setPendingUploadId(pending[0].id);

    // OCR companion rail: prefer pending upload pages, else most recent upload with pages
    let pagesForRail = [];
    const preferredId = pendingUploadId || pending[0]?.id;
    const preferredSession = sessions.find((s) => s.id === preferredId);
    if (preferredSession?.pages?.length) {
      pagesForRail = preferredSession.pages;
    } else {
      for (const u of uploads.slice(0, 8)) {
        const fromSession = sessions.find((s) => s.id === u.id);
        if (fromSession?.pages?.length) {
          pagesForRail = fromSession.pages;
          break;
        }
        try {
          const detail = await getOwnerMenuUpload(u.id);
          const pages = detail.upload?.pages || detail.pages || [];
          if (pages.length) {
            pagesForRail = pages;
            break;
          }
        } catch {
          /* skip */
        }
      }
    }
    setSourcePages(pagesForRail);
  }

  async function runBulkReview(action) {
    if (!reviewItems.length) return;
    setBulkActing(true);
    setActionMsg("");
    try {
      const byUpload = new Map();
      for (const item of reviewItems) {
        const list = byUpload.get(item.uploadId) || [];
        list.push(item.id);
        byUpload.set(item.uploadId, list);
      }
      for (const [uploadId, itemIds] of byUpload.entries()) {
        await bulkReviewItems(uploadId, { action, item_ids: itemIds });
      }
      await loadReviewItems();
      await loadMenuState();
      setActionMsg(
        action === "approve"
          ? "Accepted all pending review items."
          : "Rejected all pending review items. Public menu items below remain editable."
      );
    } catch (err) {
      setActionMsg(err?.payload?.error || err?.message || `Bulk ${action} failed.`);
    } finally {
      setBulkActing(false);
    }
  }

  useEffect(() => {
    if (rid && mid) {
      loadMenuState().catch(() => {});
      loadReviewItems().catch(() => {});
    }
  }, [rid, mid]);

  async function importParsedToMenuDraft(uploadId) {
    if (!uploadId || !rid || !mid) return false;
    setImportingParsed(true);
    setActionMsg("");
    try {
      await publishUpload(uploadId);
      await unpublishMenuConsoleMenu(rid, mid);
      await loadMenuState();
      await reloadMenus();
      setPendingUploadId(null);
      setActionMsg("Parsed items saved to this menu. Edit below, then publish when ready.");
      return true;
    } catch (err) {
      setActionMsg(err?.payload?.error || err?.message || "Could not save parsed items to menu.");
      return false;
    } finally {
      setImportingParsed(false);
    }
  }

  async function handleUpload() {
    if (!file || !rid) {
      setUploadMsg({ ok: false, message: "Choose a PDF or image file first." });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    setPendingUploadId(null);
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
      const uploadId = json.upload_id || null;
      if (uploadId) setPendingUploadId(uploadId);

      if (reviewCount === 0 && uploadId && inserted > 0) {
        const saved = await importParsedToMenuDraft(uploadId);
        setUploadMsg({
          ok: saved,
          message: saved
            ? `Parsed ${inserted} item${inserted !== 1 ? "s" : ""} — saved to menu below. Edit, then publish when ready.`
            : `Parsed ${inserted} item${inserted !== 1 ? "s" : ""}, but saving to the menu editor failed. Use Save to Menu after fixing any errors.`,
        });
      } else {
        setUploadMsg({
          ok: true,
          message: reviewCount > 0
            ? `Parsed ${inserted} item${inserted !== 1 ? "s" : ""} — ${reviewCount} need review below before saving to the menu.`
            : `Parsed ${inserted} item${inserted !== 1 ? "s" : ""}.`,
        });
      }
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

  const content = (
    <>
      {embedded ? (
        <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: "#f8fafc", border: `1px solid ${OWNER_COLORS.line}`, fontSize: 13, color: OWNER_COLORS.ink, lineHeight: 1.5 }}>
          <strong>Edit Menus</strong> is for a restaurant’s live menu (add/edit dishes, then publish).
          For camera OCR corrections with source photos, use the <strong>OCR Uploads</strong> tab → Review Queue.
        </div>
      ) : null}
      <OwnerMenuRestaurantFinder
        key={restaurant?.id || "finder"}
        selectedRestaurant={restaurant}
        loading={loadingRestaurant}
        onSelect={selectExistingRestaurant}
        onClear={clearSelectedRestaurant}
      />

      {loadRestaurantErr ? (
        <PageCard style={{ padding: 16, marginBottom: 16, color: "#991b1b" }}>{loadRestaurantErr}</PageCard>
      ) : null}

      {!existingRestaurant ? <StepHeader current={step} /> : null}

      {schemaError && (
        <PageCard style={{ padding: 16, marginBottom: 16, color: "#991b1b" }}>{schemaError}</PageCard>
      )}

      {/* Create flow: profile first. Existing restaurant: menus + editor first (profile below). */}
      {(!existingRestaurant || showProfilePanel) && (
      <PageCard style={{ padding: 20, marginBottom: 16, opacity: restaurant && !existingRestaurant ? 0.72 : 1 }}>
        <SectionTitle
          title={existingRestaurant ? "Restaurant Profile" : "Create New Restaurant"}
          subtitle={existingRestaurant
            ? "Update platform-owned restaurant fields. Changes are audit-logged."
            : "Required fields use schema-controlled dropdowns from the platform catalog."}
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
            <input value={profile.restaurant_name} onChange={(e) => updateProfile("restaurant_name", e.target.value)} style={inputStyle} disabled={!!restaurant && !existingRestaurant} />
          </div>
          <SelectField label="Restaurant type" value={profile.restaurant_type} onChange={(v) => updateProfile("restaurant_type", v)} options={schema?.restaurant_types} required />
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={fieldLabel}>Address *</label>
            <input value={profile.address_line1} onChange={(e) => updateProfile("address_line1", e.target.value)} style={inputStyle} disabled={!!restaurant && !existingRestaurant} />
          </div>
          <div>
            <label style={fieldLabel}>City *</label>
            <input value={profile.city} onChange={(e) => updateProfile("city", e.target.value)} style={inputStyle} disabled={!!restaurant && !existingRestaurant} />
          </div>
          <div>
            <label style={fieldLabel}>State *</label>
            <input value={profile.state} onChange={(e) => updateProfile("state", e.target.value.toUpperCase().slice(0, 2))} maxLength={2} style={inputStyle} disabled={!!restaurant && !existingRestaurant} />
          </div>
          <div>
            <label style={fieldLabel}>ZIP *</label>
            <input value={profile.postal_code} onChange={(e) => updateProfile("postal_code", e.target.value)} style={inputStyle} disabled={!!restaurant && !existingRestaurant} />
          </div>
          <SelectField label="Country" value={profile.country_code} onChange={(v) => updateProfile("country_code", v)} options={schema?.countries} required />
          <SelectField label="Primary cuisine" value={profile.cuisine} onChange={(v) => updateProfile("cuisine", v)} options={schema?.cuisines} required />
          <SelectField label="Price tier" value={profile.price_tier} onChange={(v) => updateProfile("price_tier", v)} options={schema?.price_tiers} required />
          <SelectField label="Subscription plan" value={profile.subscription_plan} onChange={(v) => updateProfile("subscription_plan", v)} options={schema?.subscription_plans} required />
          <SelectField label="Status" value={profile.status} onChange={(v) => updateProfile("status", v)} options={schema?.profile_statuses} required />
          <div>
            <label style={fieldLabel}>Phone</label>
            <input value={profile.phone} onChange={(e) => updateProfile("phone", e.target.value)} style={inputStyle} disabled={!!restaurant && !existingRestaurant} />
          </div>
          <div>
            <label style={fieldLabel}>Website</label>
            <input value={profile.website} onChange={(e) => updateProfile("website", e.target.value)} style={inputStyle} disabled={!!restaurant && !existingRestaurant} />
          </div>
          <div>
            <label style={fieldLabel}>Latitude</label>
            <input value={profile.lat} onChange={(e) => updateProfile("lat", e.target.value)} style={inputStyle} disabled={!!restaurant && !existingRestaurant} placeholder="31.2234" />
          </div>
          <div>
            <label style={fieldLabel}>Longitude</label>
            <input value={profile.lng} onChange={(e) => updateProfile("lng", e.target.value)} style={inputStyle} disabled={!!restaurant && !existingRestaurant} placeholder="-85.3902" />
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
                  disabled={!!restaurant && !existingRestaurant}
                  onClick={() => toggleServiceModel(opt.value)}
                  style={{
                    padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500,
                    border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                    background: active ? OWNER_COLORS.accentSoft : "#fff",
                    color: active ? OWNER_COLORS.accent : OWNER_COLORS.ink,
                    cursor: restaurant && !existingRestaurant ? "not-allowed" : "pointer",
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

        {existingRestaurant && restaurant && (
          <button
            type="button"
            disabled={savingProfile || !schema}
            onClick={saveExistingProfile}
            style={{
              marginTop: 16, padding: "10px 18px", borderRadius: 10, border: "none",
              background: savingProfile ? OWNER_COLORS.muted : OWNER_COLORS.accent,
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: savingProfile ? "not-allowed" : "pointer",
            }}
          >
            {savingProfile ? "Saving profile…" : "Save Restaurant Profile"}
          </button>
        )}

        {existingRestaurant && restaurant && deleteImpact && (
          <div style={{ marginTop: 20, padding: 14, borderRadius: 10, border: "1px solid #fca5a5", background: "#fff1f2" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#991b1b", marginBottom: 8 }}>Delete restaurant record</div>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 10 }}>
              {deleteImpact.recommended_mode === "hard"
                ? "No linked menus or CK items — permanent delete is allowed."
                : "Quarantine hides this profile from discovery (recommended for duplicates with data). Hard delete is blocked while linked data exists."}
            </div>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginBottom: 10 }}>
              Linked: {deleteImpact.counts?.menus ?? 0} menu(s), {deleteImpact.counts?.public_items ?? 0} public item(s), {deleteImpact.counts?.ck_items ?? 0} CK item(s)
              {deleteImpact.blockers?.length ? ` · Blockers: ${deleteImpact.blockers.join("; ")}` : ""}
            </div>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`Type DELETE ${rid} to confirm`}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <button
              type="button"
              disabled={deletingRestaurant}
              onClick={handleDeleteRestaurant}
              style={{
                padding: "9px 14px", borderRadius: 9, border: "1px solid #fca5a5",
                background: "#fff", color: "#991b1b", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              {deletingRestaurant
                ? "Processing…"
                : deleteImpact.recommended_mode === "hard"
                  ? "Permanently delete restaurant"
                  : "Quarantine restaurant (soft delete)"}
            </button>
          </div>
        )}

        {restaurant && !existingRestaurant && (
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, color: "#15803d", fontWeight: 600 }}>
            Profile created: {restaurant.restaurant_name || restaurant.name} (#{restaurant.id})
          </div>
        )}
      </PageCard>
      )}

      {restaurant && existingRestaurant && !showProfilePanel ? (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setShowProfilePanel(true)}
            style={{
              padding: "8px 12px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`,
              background: "#fff", color: OWNER_COLORS.muted, fontWeight: 600, fontSize: 12, cursor: "pointer",
            }}
          >
            Edit restaurant profile
          </button>
        </div>
      ) : null}

      {restaurant && (
        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <SectionTitle
            title="Menus"
            subtitle="Pick which menu to edit below. Primary menu cannot be deleted."
          />
          {availableMenus.length === 0 ? (
            <div style={{ marginTop: 12, fontSize: 13, color: OWNER_COLORS.muted }}>
              No menus yet — create one below or upload a PDF.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {availableMenus.map((m) => {
                const active = m.id === mid;
                const label = m.display_name || m.name || `Menu #${m.id}`;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${active ? OWNER_COLORS.accent : OWNER_COLORS.line}`,
                      background: active ? OWNER_COLORS.accentSoft : "#fff",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                        <StatusChip status={m.status} />
                        <span style={{ fontSize: 12, color: OWNER_COLORS.muted }}>
                          #{m.id}{m.menu_type ? ` · ${m.menu_type}` : ""}{m.item_count != null ? ` · ${m.item_count} items` : ""}
                          {m.is_primary ? " · primary" : ""}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => switchMenu(m)}
                        style={{
                          padding: "8px 12px", borderRadius: 8,
                          background: active ? OWNER_COLORS.accent : "#fff",
                          color: active ? "#fff" : OWNER_COLORS.ink,
                          border: active ? "none" : `1px solid ${OWNER_COLORS.line}`,
                          fontWeight: 700, fontSize: 12, cursor: "pointer",
                        }}
                      >
                        {active ? "Editing" : "Edit items"}
                      </button>
                      {!m.is_primary ? (
                        <button
                          type="button"
                          disabled={publishing}
                          onClick={() => handleDeleteMenuRow(m)}
                          style={{
                            padding: "8px 12px", borderRadius: 8, border: "1px solid #fca5a5",
                            background: "#fff", color: "#991b1b", fontWeight: 700, fontSize: 12, cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <button
              type="button"
              disabled={publishing}
              onClick={handleAddMenu}
              style={{
                padding: "9px 14px", borderRadius: 9, border: "none",
                background: OWNER_COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >
              + Add menu
            </button>
          </div>
        </PageCard>
      )}

      {restaurant && menuDetail && (
        <div ref={menuEditorRef}>
          <OcrEditSplitLayout
            pages={sourcePages}
            liveItems={menuDetail.sections || []}
            liveMenuHref={`/public/restaurants/${rid}/menu`}
            railTitle="Source menu"
            defaultRailMode={
              String(menuDetail.menu?.status || "").toLowerCase() === "published" ||
              Number(menuDetail.item_count || 0) > 0
                ? "live"
                : "ocr"
            }
          >
            <PageCard style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <SectionTitle
                    title="Edit dishes"
                    subtitle={`${menuDetail.item_count ?? 0} items in this menu — this is the main editor. Publish when ready.`}
                  />
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                    <StatusChip status={menuDetail.menu?.status} />
                    <a
                      href={`/public/restaurants/${rid}/menu`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}
                    >
                      View live menu ↗
                    </a>
                  </div>
                </div>
              </div>
              <MenuEditor
                restaurantId={rid}
                menuDetail={menuDetail}
                onMenuUpdated={(updated) => setMenuDetail((prev) => (prev ? { ...prev, menu: { ...prev.menu, ...updated } } : prev))}
                onMenuDeleted={handleMenuDeleted}
                onReload={loadMenuState}
              />
            </PageCard>
          </OcrEditSplitLayout>
        </div>
      )}

      {/* Optional OCR import — secondary to live dish editing */}
      {restaurant && (
        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <SectionTitle
              title="Optional: import photo / PDF"
              subtitle="Secondary path — after parsing, use OCR Uploads → Review Queue for held items, then finish here."
            />
            <button
              type="button"
              onClick={() => setShowImportPanel((v) => !v)}
              style={{
                padding: "8px 12px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`,
                background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", color: OWNER_COLORS.ink,
              }}
            >
              {showImportPanel ? "Hide import" : "Show import"}
            </button>
          </div>
          {showImportPanel ? (
            <>
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
            <Link
              to="/owner/menu-manager?tab=activity"
              style={{ padding: "9px 14px", borderRadius: 9, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", color: OWNER_COLORS.accent }}
            >
              OCR Uploads →
            </Link>
          </div>
          {(uploadMsg || actionMsg) && (
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 9, background: uploadMsg?.ok === false ? "#fff1ef" : "#f0fdf4", color: uploadMsg?.ok === false ? "#991b1b" : "#15803d", fontSize: 13, fontWeight: 600 }}>
              {uploadMsg?.message || actionMsg}
            </div>
          )}
            </>
          ) : null}
        </PageCard>
      )}

      {restaurant && pendingUploadId && reviewItems.length === 0 && (menuDetail?.item_count ?? 0) === 0 && (
        <PageCard style={{ padding: 20, marginBottom: 16 }}>
          <SectionTitle
            title="Save Parsed Items"
            subtitle="Parsed items are ready. Save them into the menu editor below before publishing."
          />
          <button
            type="button"
            disabled={importingParsed}
            onClick={() => importParsedToMenuDraft(pendingUploadId)}
            style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: OWNER_COLORS.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: importingParsed ? "not-allowed" : "pointer" }}
          >
            {importingParsed ? "Saving…" : "Save to Menu"}
          </button>
        </PageCard>
      )}

      {restaurant && reviewItems.length > 0 && (
        <PageCard style={{ padding: 16, marginBottom: 16, background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#92400e", marginBottom: 6 }}>
            {reviewItems.length} OCR item{reviewItems.length === 1 ? "" : "s"} still need review
          </div>
          <div style={{ fontSize: 13, color: OWNER_COLORS.ink, lineHeight: 1.5, marginBottom: 12 }}>
            Use the Source menu panel beside Edit dishes, or open the Review Queue to approve/reject holds.
          </div>
          {actionMsg ? (
            <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 9, background: "#fff", color: OWNER_COLORS.ink, fontSize: 13, fontWeight: 600 }}>
              {actionMsg}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {(reviewSessions || []).map((session) => (
              <Link
                key={session.id}
                to={`/owner/menu-manager/uploads/${session.id}/review-items`}
                style={{
                  padding: "9px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: "#92400e",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Open Review Queue →
              </Link>
            ))}
            <button
              type="button"
              disabled={bulkActing}
              onClick={() => runBulkReview("approve")}
              style={{ padding: "9px 14px", borderRadius: 9, border: "none", background: "#15803d", color: "#fff", fontWeight: 700, fontSize: 13, cursor: bulkActing ? "not-allowed" : "pointer" }}
            >
              {bulkActing ? "Working…" : "Accept all holds"}
            </button>
            <button
              type="button"
              disabled={bulkActing}
              onClick={() => runBulkReview("reject")}
              style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #fca5a5", background: "#fff", color: "#991b1b", fontWeight: 700, fontSize: 13, cursor: bulkActing ? "not-allowed" : "pointer" }}
            >
              Reject all holds
            </button>
          </div>
        </PageCard>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <OwnerLayout
      title={existingRestaurant ? "Menu Manager" : "Create Restaurant + Menu"}
      subtitle={
        existingRestaurant
          ? "Edit the live menu, save item changes, then publish."
          : "Create a restaurant, add or upload a menu, edit items, then publish."
      }
    >
      {content}
    </OwnerLayout>
  );
}
