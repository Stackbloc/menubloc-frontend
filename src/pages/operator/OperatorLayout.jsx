/**
 * src/pages/operator/OperatorLayout.jsx
 *
 * Shared sidebar + content shell for all operator screens.
 *
 * Sidebar is organized into three role-aware sections:
 *   OPERATIONS  — live order handling (all roles)
 *   MENU & CUSTOMER — menu tools (owner + manager; staff gets subset)
 *   OWNER / BUSINESS — financial/admin (owner only; manager with PIN)
 *
 * Sensitive (Owner / Business) links require Owner PIN verification.
 * A PIN gate modal intercepts navigation and calls /security/pin/verify.
 * After successful verify, a 15-min server-side session is granted.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { getSensitiveSession, verifyOwnerPin } from "../../lib/operatorApi.js";
import AdminConsoleShell from "../../components/adminConsole/AdminConsoleShell.jsx";
import {
  ADMIN_CONSOLE,
  KB_SESSION_KEYS,
  readKbPanelOpen,
  writeKbPanelOpen,
} from "../../components/adminConsole/adminConsoleTokens.js";
import KnowledgeBasePanel from "../../components/helpSearch/KnowledgeBasePanel.jsx";
import { operatorKnowledgeBaseApi } from "../../lib/knowledgeBaseApi.js";
import "./operatorResponsive.css";

const BRAND = {
  accent: ADMIN_CONSOLE.accent,
  accentDark: ADMIN_CONSOLE.accentDark,
  ink: ADMIN_CONSOLE.ink,
  muted: ADMIN_CONSOLE.muted,
  line: ADMIN_CONSOLE.line,
  soft: ADMIN_CONSOLE.accentSoft,
};

// ── PIN gate modal ────────────────────────────────────────────────────────

function PinGateModal({ restaurantId, onSuccess, onClose }) {
  const { t } = useLanguage();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [retryIn, setRetryIn] = useState(0);

  function handleDigit(idx, val) {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    setError("");
    if (clean && idx < 3) {
      const nextInput = document.getElementById(`pin-digit-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
    if (idx === 3 && clean) {
      const pin = [...next.slice(0, 3), clean].join("");
      if (pin.length === 4) submitPin(pin);
    }
  }

  function handleKeyDown(idx, e) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      const prev = document.getElementById(`pin-digit-${idx - 1}`);
      if (prev) prev.focus();
    }
  }

  async function submitPin(pinOverride) {
    const pin = pinOverride ?? digits.join("");
    if (pin.length !== 4) {
      setError(t("auth.pinEnterAllDigits", "Enter all 4 digits."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await verifyOwnerPin(restaurantId, pin);
      onSuccess();
    } catch (err) {
      if (err?.payload?.code === "pin_locked") {
        setLocked(true);
        setRetryIn(err?.payload?.retry_after_seconds || 300);
      }
      setError(err.message || t("auth.pinIncorrect", "Incorrect PIN. Try again."));
      setDigits(["", "", "", ""]);
      setTimeout(() => document.getElementById("pin-digit-0")?.focus(), 50);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "32px 28px",
        width: "100%", maxWidth: 360, boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0f1720", marginBottom: 6 }}>
          {t("auth.pinGateTitle", "Owner verification")}
        </div>
        <div style={{ fontSize: 14, color: "#5b6675", marginBottom: 24 }}>
          {t("auth.pinGateSubtitle", "Enter your 4-digit owner PIN to continue.")}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
          {digits.map((d, idx) => (
            <input
              key={idx}
              id={`pin-digit-${idx}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              disabled={busy || locked}
              autoFocus={idx === 0}
              onChange={(e) => handleDigit(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: 52, height: 60, textAlign: "center",
                fontSize: 28, fontWeight: 900,
                border: error ? "2px solid #dc2626" : "2px solid #d0d5dd",
                borderRadius: 12, outline: "none",
                background: d ? "#f0fdf4" : "#fff",
                caretColor: "transparent",
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            marginBottom: 16, padding: "10px 14px", borderRadius: 10,
            background: "#fee2e2", color: "#991b1b", fontSize: 14, fontWeight: 600,
          }}>
            {error}
            {locked && retryIn > 0 && (
              <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                Try again in {Math.ceil(retryIn / 60)} min.
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => submitPin()}
          disabled={busy || locked || digits.join("").length !== 4}
          style={{
            width: "100%", minHeight: 52, borderRadius: 14, border: "none",
            background: BRAND.accentDark, color: "#fff",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            opacity: (busy || locked || digits.join("").length !== 4) ? 0.5 : 1,
            marginBottom: 12,
          }}
        >
          {busy ? "Verifying…" : "Unlock"}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%", minHeight: 44, borderRadius: 12,
            border: `1px solid ${BRAND.line}`, background: "#fff",
            fontSize: 14, fontWeight: 600, color: BRAND.muted, cursor: "pointer",
          }}
        >
          {t("auth.cancel", "Cancel")}
        </button>
      </div>
    </div>
  );
}

const OPERATOR_PAGE_TITLE_KEYS = {
  Home: "operator.nav.home",
  "Menu Lab": "operator.nav.menuLab",
  "Menu Worksheet": "operator.nav.menuWorksheet",
  "Knowledge Base": "operator.nav.knowledgeBase",
  Subscription: "operator.subscription.title",
  "Incoming Orders": "operator.orders.title",
  Deals: "operator.deals.title",
  "Order QR Code Kit": "operator.qrKit.title",
  "Display Board": "operator.nav.displayBoard",
  Billboards: "operator.nav.billboards",
  Hours: "operator.hours.title",
  "Order Detail": "operator.orders.detailTitle",
  "Delivery Accounts": "operator.delivery.title",
  "Delivery Portal": "operator.delivery.title",
  Profile: "operator.profile.title",
  "Profile Editor": "operator.nav.profileEditor",
  "My Account": "operator.nav.myAccount",
  Marketplace: "operator.nav.marketplace",
  "Bid-Free Bidding™": "operator.nav.bidFree",
  "Adobe Studio": "operator.nav.adobeStudio",
  "Menu Studio": "operator.nav.menuStudio",
  "Brand Settings": "operator.nav.brandSettings",
  "Merchant Account": "operator.nav.merchantAccount",
};

function resolveOperatorTitle(title, t) {
  if (!title) return "";
  const key = OPERATOR_PAGE_TITLE_KEYS[title];
  return key ? t(key, title) : title;
}

export default function OperatorLayout({ title, children }) {
  const {
    operator, selectedRestaurant, restaurants,
    setSelectedRestaurant, logout, hasBenefit,
  } = useOperator();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(() =>
    readKbPanelOpen(KB_SESSION_KEYS.operator)
  );
  const [pinTarget, setPinTarget] = useState(null);

  const role = selectedRestaurant?.role || "staff";
  const rid = selectedRestaurant?.id;

  const openPublicMenu = useCallback(() => {
    if (!rid) {
      navigate("/operator/menu-worksheet");
      return;
    }
    window.open(`/restaurants/${rid}/menu`, "_blank", "noopener,noreferrer");
  }, [rid, navigate]);

  const showBusiness = role === "owner" || role === "manager";
  const showMarketing = showBusiness;
  const showAdobe = showBusiness && hasBenefit("design_exports");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  // Menu Worksheet only: Knowledge Base starts closed; side-panel click can reopen.
  // Do not write sessionStorage on auto-close so other operator pages keep preference.
  useEffect(() => {
    const path = location.pathname || "";
    const onWorksheet =
      path === "/operator/menu-worksheet" ||
      /\/operator\/restaurants\/[^/]+\/menus\/[^/]+\/worksheet\/?$/.test(path);
    if (onWorksheet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKnowledgeOpen(false);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKnowledgeOpen(readKbPanelOpen(KB_SESSION_KEYS.operator));
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/operator/login", { replace: true });
  }

  const handleSensitiveClick = useCallback(async (targetRoute) => {
    if (!rid) return;
    try {
      const data = await getSensitiveSession(rid);
      if (data.active) {
        navigate(targetRoute);
        return;
      }
    } catch {
      // Fall through to PIN gate
    }
    setPinTarget(targetRoute);
  }, [rid, navigate]);

  function handlePinSuccess() {
    const target = pinTarget;
    setPinTarget(null);
    if (target) navigate(target);
  }

  function toggleKnowledge() {
    setKnowledgeOpen((open) => {
      const next = !open;
      writeKbPanelOpen(KB_SESSION_KEYS.operator, next);
      return next;
    });
  }

  const sections = useMemo(() => {
    const list = [
      {
        id: "home",
        label: t("operator.section.home", "Home"),
        accent: true,
        spaced: true,
        items: [
          {
            to: "/operator",
            label: t("operator.nav.home", "Home"),
            icon: "⌂",
            end: true,
            children: [
              {
                to: "/operator/orders",
                label: t("operator.nav.orders", "Orders"),
                icon: "☷",
                end: true,
              },
              {
                to: "/operator/feedback",
                label: t("operator.nav.feedback", "Feedback"),
                icon: "★",
                end: true,
              },
            ],
          },
        ],
      },
    ];

    if (showBusiness) {
      list.push({
        id: "operations",
        label: t("operator.section.operations", "Operations"),
        spaced: true,
        items: [
          {
            to: "/operator/profile-editor",
            label: t("operator.nav.profileEditor", "Profile Editor"),
            icon: "✎",
          },
          {
            to: "/operator/brand",
            label: t("operator.nav.brandSettings", "Brand Settings"),
            icon: "◉",
          },
          {
            to: "/operator/hours",
            label: t("operator.nav.hours", "Hours"),
            icon: "⏰",
          },
          {
            to: "/operator/distributor-relationships",
            label: t("operator.nav.distributorRelationships", "Distributor Relationships"),
            icon: "⇄",
          },
        ],
      });
    } else {
      list.push({
        id: "operations",
        label: t("operator.section.operations", "Operations"),
        spaced: true,
        items: [
          {
            to: "/operator/hours",
            label: t("operator.nav.hours", "Hours"),
            icon: "⏰",
          },
        ],
      });
    }

    if (showMarketing) {
      list.push({
        id: "marketing",
        label: t("operator.section.marketing", "Marketing"),
        spaced: true,
        items: [
          {
            to: "/operator/billboards",
            label: t("operator.nav.billboards", "Billboards"),
            icon: "⊞",
          },
          {
            to: "/operator/feed-video",
            label: t("operator.nav.feedVideo", "Feed Video"),
            icon: "▶",
          },
          {
            to: "/operator/deals",
            label: t("operator.nav.deals", "Deals"),
            icon: "⊹",
          },
          {
            to: "/operator/events",
            label: t("operator.nav.eventsVenue", "Events / Venue"),
            icon: "▣",
          },
          {
            to: "/operator/bid-free-bidding",
            label: t("operator.nav.bidFree", "Bid-Free Bidding™"),
            icon: "◇",
          },
        ],
      });
    }

    const menuItems = [
      {
        to: "/operator/menu-worksheet",
        label: t("operator.nav.menuWorksheet", "Menu Worksheet"),
        icon: "☰",
      },
      {
        key: "view-menu",
        button: true,
        label: t("operator.nav.viewMenu", "View Menu"),
        icon: "◎",
        onClick: openPublicMenu,
      },
      {
        to: "/operator/menulab",
        label: t("operator.nav.menuLab", "Menu Lab"),
        icon: "▦",
      },
    ];
    if (showAdobe) {
      menuItems.push({
        to: "/operator/design",
        label: t("operator.nav.adobeStudio", "Adobe Studio"),
        icon: "▣",
      });
    }
    list.push({
      id: "menu",
      label: t("operator.section.menu", "Menu"),
      spaced: true,
      items: menuItems,
    });

    if (showBusiness) {
      list.push({
        id: "marketplace",
        label: t("operator.section.marketplace", "Marketplace"),
        spaced: true,
        items: [
          {
            to: "/operator/marketplace",
            label: t("operator.nav.marketplace", "Marketplace"),
            icon: "▢",
          },
        ],
      });

      list.push({
        id: "my-account",
        label: t("operator.section.myAccount", "My Account"),
        spaced: true,
        items: [
          {
            to: "/operator/my-account",
            label: t("operator.nav.myAccount", "My Account"),
            icon: "◈",
          },
        ],
      });
    }

    list.push({
      id: "support",
      label: t("operator.section.support", "Support"),
      spaced: true,
      items: [
        {
          to: "/operator/help",
          label: t("operator.nav.knowledgeBase", "Knowledge Base"),
          icon: "?",
        },
      ],
    });

    return list;
  }, [
    t,
    showBusiness,
    showMarketing,
    showAdobe,
    openPublicMenu,
  ]);

  const restaurantBlock = restaurants.length > 0 ? (
    <div style={{ padding: "12px 14px" }}>
      {restaurants.length === 1 ? (
        <div>
          <div style={{
            fontSize: 10, color: BRAND.muted, marginBottom: 3,
            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            Restaurant
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.ink }}>
            {selectedRestaurant?.restaurant_name || "—"}
          </div>
          {selectedRestaurant?.city && (
            <div style={{ fontSize: 11, color: BRAND.muted, marginTop: 1 }}>
              {selectedRestaurant.city}
              {selectedRestaurant.state ? `, ${selectedRestaurant.state}` : ""}
            </div>
          )}
          {role && (
            <div style={{
              display: "inline-block", marginTop: 6,
              padding: "2px 8px", borderRadius: 999,
              background: role === "owner" ? "#fef3c7" : role === "manager" ? "#e0f2fe" : "#f1f5f9",
              color: role === "owner" ? "#92400e" : role === "manager" ? "#075985" : "#475467",
              fontSize: 10, fontWeight: 800, textTransform: "capitalize",
            }}>
              {role}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{
            fontSize: 10, color: BRAND.muted, marginBottom: 5,
            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            Restaurant
          </div>
          <select
            value={selectedRestaurant?.id || ""}
            onChange={(e) => {
              const r = restaurants.find((row) => String(row.id) === e.target.value);
              if (r) setSelectedRestaurant(r);
            }}
            style={{
              width: "100%", fontSize: 12, padding: "7px 8px",
              border: `1px solid ${BRAND.line}`, borderRadius: 8,
              background: "#fff", color: BRAND.ink, cursor: "pointer",
            }}
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.restaurant_name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  ) : null;

  const footer = (
    <>
      <div style={{
        fontSize: 12, color: BRAND.ink, fontWeight: 600, marginBottom: 2,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {operator?.full_name || operator?.email || ""}
      </div>
      {operator?.full_name && (
        <div style={{
          fontSize: 11, color: BRAND.muted, marginBottom: 8,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {operator.email}
        </div>
      )}
      <button
        type="button"
        onClick={handleLogout}
        style={{
          background: "#fff", border: `1px solid ${BRAND.line}`, borderRadius: 8,
          padding: "7px 12px", fontSize: 12, color: "#5b6675",
          cursor: "pointer", width: "100%", fontFamily: "inherit", fontWeight: 600,
        }}
      >
        Sign out
      </button>
    </>
  );

  return (
    <>
      <AdminConsoleShell
        homeTo="/operator"
        brandSubtitle="Restaurant Operations"
        brandAriaLabel="Menuply restaurant operations home"
        sidebarExtra={restaurantBlock}
        sections={sections}
        sidebarFooter={footer}
        title={resolveOperatorTitle(title, t)}
        mobileSubtitle={selectedRestaurant?.restaurant_name || null}
        knowledgeOpen={knowledgeOpen}
        onToggleKnowledge={toggleKnowledge}
        knowledgePanel={
          <KnowledgeBasePanel
            onClose={toggleKnowledge}
            api={operatorKnowledgeBaseApi}
            helpPath="/operator/help"
            supportPath="/operator/help#operations-support-form"
          />
        }
        mobileNavOpen={mobileNavOpen}
        onMobileNavOpenChange={setMobileNavOpen}
      >
        {children}
      </AdminConsoleShell>

      {pinTarget && rid && (
        <PinGateModal
          restaurantId={rid}
          onSuccess={handlePinSuccess}
          onClose={() => setPinTarget(null)}
        />
      )}
    </>
  );
}
