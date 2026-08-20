/**
 * My Month in Food scoreboard — self + peer connects.
 * Routes: /my-menuply/month-in-food , /account/connections/:peerId/month-in-food
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import StickyPageHeader from "../../../components/StickyPageHeader.jsx";
import BottomNav from "../../../components/BottomNav.jsx";
import ShareButton from "../../../components/share/ShareButton.jsx";
import { buildConsumerPathShareData } from "../../../components/share/shareUtils.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { getMonthInFood, getPeerMonthInFood } from "../../../lib/consumerApi.js";
import { buildMonthInFoodModel, shiftYm } from "./buildMonthInFoodModel.js";
import {
  MonthInFoodByTheNumbers,
  MonthInFoodHero,
  MonthInFoodHighlights,
  MonthInFoodMood,
  MonthInFoodMoments,
  MonthInFoodPlansEvents,
  MonthInFoodStatsBar,
  MonthInFoodVisited,
  MonthInFoodWants,
} from "./MonthInFoodSections.jsx";
import MonthInFoodFooter from "./MonthInFoodFooter.jsx";
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
    : "/my-menuply";

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
            : `/my-menuply/month-in-food?ym=${ym}`
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
    : `/my-menuply/month-in-food?ym=${encodeURIComponent(ym)}`;

  const shareData = useMemo(
    () =>
      buildConsumerPathShareData(sharePath, {
        title: "My Month in Food on Menuply",
        text: "Great food. Good people. Better together.",
      }),
    [sharePath]
  );

  const shareAccessory = shareData ? (
    <span data-testid="month-in-food-share">
      <ShareButton
        shareData={shareData}
        iconOnly
        size="compact"
        tone="ghost"
        label="Share"
        modalTitle="Share Month in Food"
        analyticsContext={{ surface: "month_in_food", path: sharePath }}
      />
    </span>
  ) : null;

  return (
    <div style={s.page} data-testid="month-in-food-page">
      <StickyPageHeader title="My Month in Food" titleAccessory={shareAccessory} />
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

            <div
              style={{
                ...s.columns,
              }}
              className="month-in-food-columns"
            >
              <div>
                {!model.diaryVisible && isPeer ? (
                  <p style={s.muted}>This diner keeps their food diary private.</p>
                ) : null}
                <MonthInFoodHighlights highlights={model.highlights} />
                <MonthInFoodVisited visited={model.visited} />
                <MonthInFoodMoments moments={model.moments} overflow={model.momentsOverflow} />
                <MonthInFoodMood mood={model.mood} />
              </div>
              <div>
                <MonthInFoodByTheNumbers
                  totalMeals={model.totalMeals}
                  cuisineSlices={model.cuisineSlices}
                  miniStats={model.miniStats}
                />
                <MonthInFoodWants wants={model.wants} />
                <MonthInFoodPlansEvents plans={model.plans} events={model.events} />
              </div>
            </div>

            {model.showEmptyHint ? (
              <p style={{ ...s.muted, marginTop: 8 }}>
                No meals logged this month yet.{" "}
                {!isPeer ? (
                  <Link to="/my-menuply?compose=ate" style={s.viewAll}>
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
        @media (min-width: 900px) {
          .month-in-food-columns {
            grid-template-columns: 1.15fr 0.85fr !important;
          }
          [data-testid="month-in-food-hero"] {
            grid-template-columns: 1fr 1fr !important;
            align-items: end;
          }
        }
      `}</style>
      <BottomNav />
    </div>
  );
}
