import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import MenuWorksheet from "../../components/menuEditor/MenuWorksheet.jsx";
import {
  getMenuWorksheet,
  publishMenuWorksheet,
  saveMenuWorksheet,
} from "../../lib/operatorApi.js";
import {
  detectLargeMenuplyPriceChanges,
  formatLargePriceChangeWarning,
} from "../../lib/menuWorksheetHelpers.js";
import {
  profileEditOnboardingPath,
} from "../../lib/operatorOnboardingCheckpoints.js";
import {
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../../lib/restaurantOnboardingState.js";

/**
 * Operator Menu Worksheet page.
 * Route: /operator/restaurants/:restaurantId/menus/:menuId/worksheet
 * After "Update Menuply Menu" during onboarding → public profile edit.
 */
export default function OperatorMenuWorksheetPage() {
  const { restaurantId, menuId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uploadSessionId = searchParams.get("upload_session_id") || null;
  const isOnboarding = searchParams.get("onboarding") === "1";

  const rid = Number(restaurantId);
  const mid = Number(menuId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [sections, setSections] = useState([]);
  const [meta, setMeta] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [flash, setFlash] = useState("");
  const [priceWarnings, setPriceWarnings] = useState([]);
  const priceBaselineRef = useRef([]);

  const load = useCallback(async () => {
    if (!rid || !mid) {
      setError("Invalid restaurant or menu");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setPriceWarnings([]);
    try {
      const data = await getMenuWorksheet(rid, mid, uploadSessionId);
      const loadedRows = data.rows || [];
      setRows(loadedRows);
      setSections(data.sections || []);
      priceBaselineRef.current = loadedRows.map((r) => ({
        id: r.id,
        item_name: r.item_name,
        menuply_price: r.menuply_price,
      }));
      setMeta({
        menu: data.menu,
        worksheet: data.worksheet,
      });
      setDirty(false);
    } catch (err) {
      setError(err?.payload?.error || err?.message || "Could not load worksheet");
    } finally {
      setLoading(false);
    }
  }, [rid, mid, uploadSessionId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChange(nextRows, nextSections) {
    setRows(nextRows);
    setSections(nextSections);
    setDirty(true);
  }

  async function handleSave() {
    const changes = detectLargeMenuplyPriceChanges(priceBaselineRef.current, rows);
    const warnings = changes.map(formatLargePriceChangeWarning);
    setPriceWarnings(warnings);
    if (warnings.length > 0) {
      const ok = window.confirm(`${warnings.join("\n")}\n\nSave worksheet anyway?`);
      if (!ok) return;
    }

    setSaving(true);
    setFlash("");
    setError("");
    try {
      const data = await saveMenuWorksheet(rid, mid, {
        rows,
        upload_session_id: uploadSessionId || meta?.worksheet?.upload_session_id,
        source_pdf_url: meta?.worksheet?.source_pdf_url,
      });
      const savedRows = data.rows || rows;
      setRows(savedRows);
      setSections(data.sections || sections);
      priceBaselineRef.current = savedRows.map((r) => ({
        id: r.id,
        item_name: r.item_name,
        menuply_price: r.menuply_price,
      }));
      setPriceWarnings([]);
      setMeta((prev) => ({
        ...prev,
        worksheet: { ...(prev?.worksheet || {}), ...(data.worksheet || {}) },
      }));
      setDirty(false);
      setFlash("Worksheet saved. Menuply menu was not updated.");
    } catch (err) {
      setError(err?.payload?.error || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setFlash("");
    setError("");
    try {
      const data = await publishMenuWorksheet(rid, mid, {
        rows,
        upload_session_id: uploadSessionId || meta?.worksheet?.upload_session_id,
        source_pdf_url: meta?.worksheet?.source_pdf_url,
      });
      setMeta((prev) => ({
        ...prev,
        worksheet: { ...(prev?.worksheet || {}), ...(data.worksheet || {}) },
        menu: { ...(prev?.menu || {}), status: "published" },
      }));
      setDirty(false);
      setFlash("Menuply menu updated.");

      const onboarding = resolveRestaurantOnboardingState({
        search: window.location.search,
      }).state;
      const progressBase = {
        restaurant_id: rid,
        ...(onboarding || {}),
      };
      try {
        await syncRestaurantOnboardingProgress(progressBase, {
          current_step_key: "public_profile_edit",
          completed_step_keys: Array.from(
            new Set([
              ...((onboarding && onboarding.completed_step_keys) || []),
              "menu_upload",
              "menu_worksheet",
              "default_menu_ready",
            ])
          ),
          draft_payload: {
            ...(onboarding?.draft_payload || {}),
            stage_records: {
              ...(onboarding?.draft_payload?.stage_records || {}),
              menu_worksheet: { status: "completed" },
              default_menu_ready: {
                status: "completed",
                menu_id: mid,
              },
            },
            worksheet_menu_id: mid,
          },
        });
      } catch {
        /* best-effort checkpoint */
      }

      if (isOnboarding) {
        navigate(profileEditOnboardingPath(), { replace: true });
        return;
      }

      await load();
    } catch (err) {
      setError(err?.payload?.error || err?.message || "Update Menuply Menu failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <OperatorLayout title="Menu Worksheet">
      <div style={{ maxWidth: 1480, margin: "0 auto", padding: "16px 12px 48px" }}>
        <div style={{ marginBottom: 12, fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link to="/operator/menu-worksheet" style={{ color: "#1F4E3D", fontWeight: 650 }}>
            ← Menu Worksheet
          </Link>
          <Link to="/operator/menulab" style={{ color: "#64748b" }}>
            Menu Lab
          </Link>
          {rid ? (
            <a
              href={`/restaurants/${rid}/menu`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#64748b", fontWeight: 600 }}
            >
              View Menu ↗
            </a>
          ) : null}
        </div>

        {loading ? (
          <div style={{ color: "#64748b", padding: 24 }}>Loading worksheet…</div>
        ) : error ? (
          <div style={{ color: "#b91c1c", padding: 16, background: "#fef2f2", borderRadius: 10 }}>
            {error}
          </div>
        ) : (
          <>
            {flash ? (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 14px",
                  background: "#f0fdf4",
                  color: "#166534",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {flash}
              </div>
            ) : null}
            <MenuWorksheet
              rows={rows}
              sections={sections}
              onChange={handleChange}
              onSave={handleSave}
              onPublish={handlePublish}
              saving={saving}
              publishing={publishing}
              dirty={dirty}
              sourcePdfUrl={meta?.worksheet?.source_pdf_url || null}
              lastSavedAt={meta?.worksheet?.last_saved_at || null}
              lastPublishedAt={meta?.worksheet?.last_published_at || null}
              menuName={meta?.menu?.name || "Menu"}
              restaurantId={rid}
              menuId={mid}
              priceWarnings={priceWarnings}
            />
          </>
        )}
      </div>
    </OperatorLayout>
  );
}
