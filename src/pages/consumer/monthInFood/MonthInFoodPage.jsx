/**
 * My Month in Food scoreboard — self + peer connects.
 * Routes: /my-menuply/month-in-food , /account/connections/:peerId/month-in-food
 * Redesign: docs/architecture/2026-09-17_month-in-food-redesign-spec.md
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../../components/StickyPageHeader.jsx";
import BottomNav from "../../../components/BottomNav.jsx";
import { buildConsumerPathShareData } from "../../../components/share/shareUtils.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { getMonthInFood, getPeerMonthInFood } from "../../../lib/consumerApi.js";
import { buildMonthInFoodModel, shiftYm } from "./buildMonthInFoodModel.js";
import {
  MonthInFoodCravingsPlans,
  MonthInFoodHero,
  MonthInFoodHomeMeals,
  MonthInFoodMood,
  MonthInFoodMoments,
  MonthInFoodStatsBar,
  MonthInFoodVisited,
} from "./MonthInFoodSections.jsx";
import MonthInFoodFooter from "./MonthInFoodFooter.jsx";
import {
  MY_MENUPLY_MONTH_IN_FOOD_PATH,
  MY_MENUPLY_PROFILE_PATH,
  myMenuplyProfileHref,
} from "../../../lib/myMenuplyRoutes.js";
import * as s from "./monthInFoodStyles.js";

function currentYmLa() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export default function MonthInFoodPage() {
  const { peerId: peerIdParam } = useParams();
  const peerId = peerIdParam ? Number(peerIdParam) : null;
  const isPeer = Number.isFinite(peerId) && peerId > 0;
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ym = searchParams.get("ym") || currentYmLa();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backHref = isPeer
    ? `/account/connections/${encodeURIComponent(String(peerId))}`
    : MY_MENUPLY_PROFILE_PATH;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = isPeer ? await getPeerMonthInFood(peerId, ym) : await getMonthInFood(ym);
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError(err?.message || "Unable to load Month in Food");
    } finally {
      setLoading(false);
    }
  }, [isPeer, peerId, ym]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(
        `/account/login?next=${encodeURIComponent(
          isPeer
            ? `/account/connections/${peerIdParam}/month-in-food?ym=${ym}`
            : `${MY_MENUPLY_MONTH_IN_FOOD_PATH}?ym=${ym}`
        )}`,
        { replace: true }
      );
      return;
    }
    load();
  }, [authLoading, isAuthenticated, navigate, load, isPeer, peerIdParam, ym]);

  const model = useMemo(() => (payload ? buildMonthInFoodModel(payload) : null), [payload]);

  function setYm(next) {
    const params = new URLSearchParams(searchParams);
    params.set("ym", next);
    setSearchParams(params, { replace: true });
  }

  const sharePath = isPeer
    ? `/account/connections/${encodeURIComponent(String(peerId))}/month-in-food?ym=${encodeURIComponent(ym)}`
    : `${MY_MENUPLY_MONTH_IN_FOOD_PATH}?ym=${encodeURIComponent(ym)}`;

  const shareData = useMemo(
    () =>
      buildConsumerPathShareData(sharePath, {
        title: "My Month in Food on Menuply",
        text: "Great food. Good people. Better together.",
      }),
    [sharePath]
  );

  return (
    <div style={s.page} data-testid="month-in-food-page">
      <StickyPageHeader title="My Month in Food" />
      <div style={s.inner}>
        <p style={{ margin: "0 0 12px" }}>
          <Link to={backHref} style={{ ...s.viewAll, fontSize: 13 }}>
            ← Back to profile
          </Link>
        </p>

        {loading ? <p style={s.muted}>Loading your month…</p> : null}
        {error ? <p style={{ color: "#b91c1c", fontWeight: 600 }}>{error}</p> : null}

        {!loading && model ? (
          <>
            <MonthInFoodHero
              model={model}
              onPrev={() => setYm(shiftYm(ym, -1))}
              onNext={() => setYm(shiftYm(ym, 1))}
              shareData={shareData}
            />
            <MonthInFoodStatsBar stats={model.stats} />

            {!model.diaryVisible && isPeer ? (
              <p style={s.muted}>This diner keeps their food diary private.</p>
            ) : null}

            <MonthInFoodVisited visited={model.visited} />
            <MonthInFoodHomeMeals homeMeals={model.homeMeals} />
            <MonthInFoodMood mood={model.mood} />
            <MonthInFoodMoments moments={model.moments} overflow={model.momentsOverflow} />
            <MonthInFoodCravingsPlans
              wants={model.wants}
              takeMeOutOpen={model.takeMeOutOpen}
              isSelf={model.isSelf}
              plans={model.plans}
              events={model.events}
              crewsJoinDefault={model.crewsJoinDefault}
            />

            {model.showEmptyHint ? (
              <p style={{ ...s.muted, marginTop: 8 }}>
                No meals logged this month yet.{" "}
                {!isPeer ? (
                  <Link to={myMenuplyProfileHref({ compose: "ate" })} style={s.viewAll}>
                    Log what you ate
                  </Link>
                ) : null}
              </p>
            ) : null}

            <MonthInFoodFooter sharePath={sharePath} isSelf={model.isSelf} />
          </>
        ) : null}
      </div>
      <style>{`
        ${s.FONT_IMPORT}
        [data-testid="month-in-food-page"] {
          --mif-cream: #F7F2E7;
          --mif-paper: #FFFDF8;
          --mif-forest: #16302A;
          --mif-moss: #4B6F55;
          --mif-amber: #DE9E33;
          --mif-clay: #B6472F;
          --mif-ink: #231F19;
          --mif-ink-soft: #5B5548;
          --mif-hairline: #DDD3BE;
        }
        @media (prefers-color-scheme: dark) {
          [data-testid="month-in-food-page"] {
            --mif-cream: #171410;
            --mif-paper: #1E1B16;
            --mif-forest: #0F2620;
            --mif-moss: #7FA085;
            --mif-amber: #E7AC4C;
            --mif-clay: #D9694C;
            --mif-ink: #F1EBDD;
            --mif-ink-soft: #B9AF9A;
            --mif-hairline: #3A352A;
          }
        }
        @media (max-width: 420px) {
          .month-in-food-two-up {
            grid-template-columns: 1fr !important;
          }
        }
        [data-testid="month-in-food-page"] button:focus-visible,
        [data-testid="month-in-food-page"] a:focus-visible {
          outline: 2px solid var(--mif-amber, #DE9E33);
          outline-offset: 2px;
        }
      `}</style>
      <BottomNav />
    </div>
  );
}
