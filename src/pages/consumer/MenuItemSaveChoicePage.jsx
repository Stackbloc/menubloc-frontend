/**
 * Choose whether a menu item goes to What I Ate Today or What I Want to Eat.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import {
  createWantToEat,
  createWhatIAteToday,
  whatIAteTodayLocalDate,
} from "../../lib/consumerApi.js";
import { defaultWhatIAteMealPeriod } from "../../lib/whatIAteTodayMealPeriod.js";
import { MY_MENUPLY_PROFILE_PATH } from "../../lib/myMenuplyRoutes.js";

export default function MenuItemSaveChoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const menuItemId = searchParams.get("menu_item_id");
  const foodName = String(searchParams.get("food_name") || "").trim();
  const returnTo = String(searchParams.get("next") || "").trim();

  const ckId = Number(menuItemId);
  const hasCkId = Number.isFinite(ckId) && ckId > 0;
  const displayName = foodName || (hasCkId ? "This menu item" : "");

  const backHref = useMemo(() => {
    if (returnTo && returnTo.startsWith("/")) return returnTo;
    return MY_MENUPLY_PROFILE_PATH;
  }, [returnTo]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const next = `/account/menu-item/save?${searchParams.toString()}`;
      navigate(`/account/login?next=${encodeURIComponent(next)}`, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, searchParams]);

  async function save(kind) {
    setError("");
    setNotice("");
    if (!displayName && !hasCkId) {
      setError("Missing menu item.");
      return;
    }
    setBusy(kind);
    try {
      if (kind === "ate") {
        await createWhatIAteToday({
          food_name: displayName || "Menu item",
          menu_item_id: hasCkId ? ckId : undefined,
          eaten_on: whatIAteTodayLocalDate(),
          meal_period: defaultWhatIAteMealPeriod(),
        });
        setNotice("Added to What I Ate Today.");
      } else {
        await createWantToEat({
          food_name: displayName || "Menu item",
          menu_item_id: hasCkId ? ckId : undefined,
        });
        setNotice("Added to What I Want to Eat.");
      }
    } catch (err) {
      setError(err.message || "Could not save. Try again from My Menuply.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <StickyPageHeader title="Save to My Menuply" />
      <div style={styles.page} data-testid="menu-item-save-choice">
        {!authLoading && isAuthenticated ? (
          <>
            <p style={styles.lead}>Where should this go on your Menuply?</p>
            {displayName ? <h1 style={styles.itemName}>{displayName}</h1> : null}

            <div style={styles.choices}>
              <button
                type="button"
                data-testid="save-choice-ate"
                disabled={Boolean(busy)}
                style={styles.choiceBtn}
                onClick={() => save("ate")}
              >
                <span style={styles.choiceTitle}>
                  {busy === "ate" ? "Adding…" : "What I ate"}
                </span>
                <span style={styles.choiceHint}>Log it in your food diary for today</span>
              </button>
              <button
                type="button"
                data-testid="save-choice-want"
                disabled={Boolean(busy)}
                style={styles.choiceBtn}
                onClick={() => save("want")}
              >
                <span style={styles.choiceTitle}>
                  {busy === "want" ? "Adding…" : "What I want to eat"}
                </span>
                <span style={styles.choiceHint}>Save it to your want list for later</span>
              </button>
            </div>

            {notice ? <p style={styles.ok}>{notice}</p> : null}
            {error ? <p style={styles.err}>{error}</p> : null}

            <p style={styles.links}>
              <Link to={MY_MENUPLY_PROFILE_PATH} style={styles.link}>
                Open My Menuply
              </Link>
              {" · "}
              <Link to={backHref} style={styles.link}>
                Back to dish
              </Link>
            </p>
          </>
        ) : (
          <p style={styles.muted}>{authLoading ? "Loading…" : "Sign in to save this dish."}</p>
        )}
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page, #f8fafc)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 16px)",
    maxWidth: 560,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  lead: {
    margin: "0 0 8px",
    fontSize: 14,
    color: "#64748b",
    fontWeight: 600,
  },
  itemName: {
    margin: "0 0 20px",
    fontSize: 24,
    lineHeight: 1.15,
    letterSpacing: "-0.03em",
    color: "#0f172a",
  },
  choices: {
    display: "grid",
    gap: 12,
  },
  choiceBtn: {
    appearance: "none",
    display: "grid",
    gap: 4,
    textAlign: "left",
    width: "100%",
    padding: "16px 18px",
    borderRadius: 14,
    border: "1.5px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  choiceTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: "#0f172a",
  },
  choiceHint: {
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    lineHeight: 1.4,
  },
  ok: { margin: "14px 0 0", fontSize: 14, fontWeight: 700, color: "#15803d" },
  err: { margin: "14px 0 0", fontSize: 14, fontWeight: 700, color: "#b91c1c" },
  links: { marginTop: 22, fontSize: 14 },
  link: { color: "#0f766e", fontWeight: 700, textDecoration: "none" },
  muted: { fontSize: 14, color: "#64748b", margin: 0 },
};
