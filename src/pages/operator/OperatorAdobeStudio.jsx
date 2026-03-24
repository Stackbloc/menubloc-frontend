/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/operator/OperatorAdobeStudio.jsx
 * File: OperatorAdobeStudio.jsx
 * Date: 2026-03-23
 * Purpose:
 *   Pro-only Adobe design/export workspace for operator-managed restaurants.
 *
 *   Features:
 *     - 10 locked preset layout options
 *     - Variant-aware manifest generation from Grubbid structured menu data
 *     - Adobe PDF Services printable export
 *     - Adobe Document Generation variant export
 *     - Adobe Express Embed SDK launch wiring
 *     - Adobe Firefly social prompt launch wiring
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const CONTROL = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d5dde8",
  background: "#fff",
  color: "#112031",
  fontSize: 13,
  fontFamily: "inherit",
};

const BTN = (kind = "primary") => ({
  padding: "10px 14px",
  borderRadius: 10,
  border: kind === "ghost" ? "1px solid #b9c6d8" : "none",
  background: kind === "primary" ? "#1f4e3d" : kind === "accent" ? "#0f3d91" : "#fff",
  color: kind === "ghost" ? "#112031" : "#fff",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
});

function parseDispositionFilename(header) {
  const match = /filename="?([^"]+)"?/.exec(header || "");
  return match?.[1] || null;
}

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "grubbid-export.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default function OperatorAdobeStudio() {
  const { selectedRestaurant, hasBenefit } = useOperator();
  const rid = selectedRestaurant?.id;
  const designAllowed = hasBenefit("design_exports");

  const [config, setConfig] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [layoutId, setLayoutId] = useState("heritage_column");
  const [variant, setVariant] = useState("full_menu");
  const [menuId, setMenuId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [socialPrompt, setSocialPrompt] = useState(null);
  const expressRef = useRef(null);

  useEffect(() => {
    if (!rid || !designAllowed) {
      setLoading(false);
      setConfig(null);
      setManifest(null);
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([
      api.getAdobeDesignConfig(rid),
      api.getAdobeDesignManifest(rid, { layout_id: layoutId, variant }),
    ])
      .then(([cfg, man]) => {
        setConfig(cfg);
        setManifest(man.manifest || null);
        if (!menuId && cfg.menus?.length) {
          const primary = cfg.menus.find((menu) => menu.is_primary) || cfg.menus[0];
          setMenuId(String(primary.id));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [rid, designAllowed]);

  useEffect(() => {
    if (!rid || !designAllowed) return;
    api.getAdobeDesignManifest(rid, {
      layout_id: layoutId,
      variant,
      menu_id: menuId || undefined,
    })
      .then((response) => setManifest(response.manifest || null))
      .catch((err) => setError(err.message));
  }, [rid, designAllowed, layoutId, variant, menuId]);

  const layouts = config?.presets || [];
  const variants = config?.variants || [];
  const menus = config?.menus || [];
  const selectedLayout = useMemo(
    () => layouts.find((preset) => preset.id === layoutId) || layouts[0] || null,
    [layouts, layoutId]
  );

  async function ensureAdobeExpress() {
    if (expressRef.current) return expressRef.current;

    const clientId = config?.adobe?.express_embed?.client_id;
    if (!clientId) {
      throw new Error("Adobe Express Embed SDK is not configured for this deployment.");
    }

    if (!window.CCEverywhere) {
      await import("https://cc-embed.adobe.com/sdk/v4/CCEverywhere.js");
    }

    await window.CCEverywhere.initialize(
      {
        clientId,
        appName: "Grubbid Pro",
        appVersion: { major: 1, minor: 0 },
        platformCategory: "web",
      },
      { locale: "en_US" }
    );

    expressRef.current = window.CCEverywhere;
    return expressRef.current;
  }

  async function handlePrintExport() {
    if (!rid) return;
    setBusy("pdf");
    setError("");
    setStatus("");
    try {
      const result = await api.downloadAdobePdfExport(rid, {
        menu_id: menuId || undefined,
        variant,
        layout_id: layoutId,
      });
      saveBlob(result.blob, parseDispositionFilename(result.filename) || "grubbid-print-menu.pdf");
      setStatus("Adobe PDF export completed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleDocumentExport() {
    if (!rid) return;
    setBusy("document");
    setError("");
    setStatus("");
    try {
      const result = await api.downloadAdobeDocumentExport(rid, {
        menu_id: menuId || undefined,
        variant,
        layout_id: layoutId,
      });
      saveBlob(result.blob, parseDispositionFilename(result.filename) || "grubbid-docgen-menu.pdf");
      setStatus("Adobe Document Generation export completed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleLaunchExpress() {
    setBusy("express");
    setError("");
    setStatus("");
    try {
      const express = await ensureAdobeExpress();
      const docConfig = {
        canvasSize: selectedLayout?.canvas_size || "Letter",
      };
      const appConfig = {
        selectedCategory: selectedLayout?.category === "social" ? "socialMedia" : "menus",
        callbacks: {
          onCancel: () => setStatus("Adobe Express editor closed."),
          onPublish: () => setStatus("Adobe Express publish callback received."),
          onError: (sdkError) => setError(sdkError?.message || "Adobe Express editor error."),
        },
      };
      const exportConfig = [
        { id: "download", label: "Download", fileType: "pdf" },
        { id: "download_png", label: "Download PNG", fileType: "png" },
      ];
      await express.editor.create(docConfig, appConfig, exportConfig);
      setStatus("Adobe Express editor launched.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleFireflyPrompt() {
    if (!rid) return;
    setBusy("firefly");
    setError("");
    setStatus("");
    try {
      const payload = await api.getAdobeSocialPrompt(rid, {
        menu_id: menuId || undefined,
        variant,
        layout_id: layoutId,
      });
      setSocialPrompt(payload.social || null);

      const express = await ensureAdobeExpress();
      if (!express?.module?.createImageFromText) {
        throw new Error("Adobe Firefly image generation is not available in this SDK session.");
      }

      await express.module.createImageFromText(
        { prompt: payload.social?.prompt_text || "" },
        {
          callbacks: {
            onCancel: () => setStatus("Adobe Firefly module closed."),
            onPublish: () => setStatus("Adobe Firefly social asset ready."),
            onError: (sdkError) => setError(sdkError?.message || "Adobe Firefly module error."),
          },
        },
        [{ id: "download", label: "Download", fileType: "png" }]
      );

      setStatus("Adobe Firefly social module launched.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (!rid) {
    return (
      <OperatorLayout title="Adobe Studio">
        <p style={{ color: "#7b8797", fontSize: 14 }}>
          Select a restaurant to use the Adobe design and export workflow.
        </p>
      </OperatorLayout>
    );
  }

  if (!designAllowed) {
    return (
      <OperatorLayout title="Adobe Studio">
        <div style={{
          maxWidth: 760,
          background: "#fff",
          border: "1px solid #d8e2ef",
          borderRadius: 18,
          padding: 26,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0f3d91", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Pro Required
          </div>
          <h2 style={{ margin: "0 0 10px", fontSize: 28, color: "#112031" }}>
            Adobe design and export is a Pro-only feature
          </h2>
          <p style={{ margin: 0, color: "#5b6675", lineHeight: 1.6 }}>
            Non-Pro operators do not see this workspace in navigation, and direct API access is blocked with
            backend `403` responses. Upgrade to Pro to unlock the 10 preset layouts, printable Adobe PDF export,
            menu variant generation, and Instagram asset workflows.
          </p>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Adobe Studio">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 22 }}>
        <section>
          <div style={{
            background: "linear-gradient(145deg, #f8fbff 0%, #fdf8ef 100%)",
            border: "1px solid #dbe5f0",
            borderRadius: 18,
            padding: 22,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f3d91", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Adobe Workflow
            </div>
            <h2 style={{ margin: "0 0 10px", fontSize: 28, color: "#112031" }}>
              Structured menu data into Adobe design, document, and PDF exports
            </h2>
            <p style={{ margin: 0, color: "#566273", lineHeight: 1.6 }}>
              Share your menu anywhere, including Instagram, Google, and your website, and send customers directly to
              your ordering system. Grubbid menu JSON remains the source of truth, so restaurants can choose a preset,
              pick a variant, and export without rebuilding the menu inside Adobe.
            </p>
          </div>

          {error && (
            <div style={{ background: "#fff1f1", border: "1px solid #f5c2c2", color: "#a02323", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {status && (
            <div style={{ background: "#eef9f3", border: "1px solid #b8e0c6", color: "#14532d", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              {status}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#5b6675" }}>Menu</label>
              <select style={CONTROL} value={menuId} onChange={(e) => setMenuId(e.target.value)}>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#5b6675" }}>Variant</label>
              <select style={CONTROL} value={variant} onChange={(e) => setVariant(e.target.value)}>
                {variants.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#5b6675" }}>Selected preset</label>
              <div style={{ ...CONTROL, display: "flex", alignItems: "center", minHeight: 42 }}>
                {selectedLayout?.name || "Loading…"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {layouts.map((preset) => {
              const active = preset.id === layoutId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setLayoutId(preset.id)}
                  style={{
                    textAlign: "left",
                    background: active ? "#112031" : "#fff",
                    color: active ? "#fff" : "#112031",
                    border: active ? "1px solid #112031" : "1px solid #d8e2ef",
                    borderRadius: 16,
                    padding: 14,
                    cursor: "pointer",
                    boxShadow: active ? "0 12px 28px rgba(17,32,49,0.16)" : "none",
                  }}
                >
                  <div style={{
                    height: 78,
                    borderRadius: 12,
                    marginBottom: 12,
                    background: `linear-gradient(160deg, ${preset.palette.surface} 0%, #ffffff 100%)`,
                    border: `1px solid ${preset.palette.accent}`,
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 12, left: 12, right: 12, height: 10, background: preset.palette.accent, opacity: 0.9, borderRadius: 999 }} />
                    <div style={{ position: "absolute", top: 32, left: 12, width: "58%", height: 6, background: preset.palette.ink, opacity: 0.78, borderRadius: 999 }} />
                    <div style={{ position: "absolute", top: 46, left: 12, right: 18, height: 4, background: preset.palette.ink, opacity: 0.36, borderRadius: 999 }} />
                    <div style={{ position: "absolute", top: 58, left: 12, right: 34, height: 4, background: preset.palette.ink, opacity: 0.24, borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{preset.name}</div>
                  <div style={{ fontSize: 12, color: active ? "rgba(255,255,255,0.78)" : "#607083", lineHeight: 1.5 }}>
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside>
          <div style={{ background: "#fff", border: "1px solid #d8e2ef", borderRadius: 18, padding: 18, marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#112031", marginBottom: 10 }}>Exports</div>
            <div style={{ display: "grid", gap: 10 }}>
              <button style={BTN("primary")} onClick={handlePrintExport} disabled={busy !== ""}>
                {busy === "pdf" ? "Generating PDF…" : "Download print PDF"}
              </button>
              <button style={BTN("accent")} onClick={handleDocumentExport} disabled={busy !== ""}>
                {busy === "document" ? "Generating document…" : "Generate variant PDF"}
              </button>
              <button style={BTN("ghost")} onClick={handleLaunchExpress} disabled={busy !== ""}>
                {busy === "express" ? "Opening Adobe Express…" : "Open Adobe Express"}
              </button>
              <button style={BTN("ghost")} onClick={handleFireflyPrompt} disabled={busy !== ""}>
                {busy === "firefly" ? "Opening Firefly…" : "Launch Instagram asset"}
              </button>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #d8e2ef", borderRadius: 18, padding: 18, marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#112031", marginBottom: 10 }}>Adobe product fit</div>
            <div style={{ display: "grid", gap: 10 }}>
              {(config?.adobe_choices || []).map((choice) => (
                <div key={choice.product} style={{ paddingBottom: 10, borderBottom: "1px solid #eef2f7" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#112031" }}>{choice.product}</div>
                  <div style={{ fontSize: 12, color: "#5b6675", lineHeight: 1.5 }}>{choice.why}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #d8e2ef", borderRadius: 18, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#112031", marginBottom: 10 }}>Manifest preview</div>
            {loading || !manifest ? (
              <div style={{ color: "#7b8797", fontSize: 13 }}>Loading Adobe design manifest…</div>
            ) : (
              <>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#112031", marginBottom: 4 }}>
                  {manifest.restaurant.restaurant_name}
                </div>
                <div style={{ fontSize: 12, color: "#5b6675", marginBottom: 10 }}>
                  {manifest.variant.name} • {manifest.selected_menu.name} • {manifest.item_count} items
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {manifest.sections.slice(0, 4).map((section) => (
                    <div key={section.name} style={{ borderTop: "1px solid #eef2f7", paddingTop: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#0f3d91", marginBottom: 6 }}>
                        {section.name}
                      </div>
                      {section.items.slice(0, 3).map((item) => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, color: "#112031", marginBottom: 4 }}>
                          <span>{item.name}</span>
                          <span style={{ color: "#7c3aed", fontWeight: 700 }}>{item.price_display}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {socialPrompt && (
            <div style={{ background: "#fff", border: "1px solid #d8e2ef", borderRadius: 18, padding: 18, marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#112031", marginBottom: 8 }}>Instagram prompt</div>
              <div style={{ fontSize: 12, color: "#5b6675", lineHeight: 1.6 }}>
                {socialPrompt.prompt_text}
              </div>
            </div>
          )}
        </aside>
      </div>
    </OperatorLayout>
  );
}
