import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import useClusterWall from "../../hooks/useClusterWall.js";
import { fetchClusterWallWeeks } from "../../lib/clusterWallApi.js";
import { withConsumerAuthNext } from "../../lib/consumerAuthNext.js";
import { wallWeekLabel } from "../../lib/clusterWallStyles.js";
import WallBlockTile from "./WallBlockTile.jsx";
import WallBlockViewer from "./WallBlockViewer.jsx";
import WallComposerSheet from "./WallComposerSheet.jsx";
import { WallContext, useClusterWallContext } from "./clusterWallContext.js";
import "./clusterWall.css";

/**
 * Cluster Wall on the cluster page (USC first). One provider holds the data and the sheets;
 * ClusterWallPanel (desktop side column, own scroll) and ClusterWallBand (phone, sideways strip)
 * render from it. ?wall=1 opens the full Wall, ?wall=write opens the composer (after sign-up too).
 */

function isWide() {
  return typeof window !== "undefined" && window.matchMedia?.("(min-width: 960px)")?.matches;
}

export function ClusterWallProvider({ clusterSlug, clusterLabel = "USC", children }) {
  const [week, setWeek] = useState(null);
  const wall = useClusterWall(clusterSlug, { week });
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [viewing, setViewing] = useState(null);
  const [composing, setComposing] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [weeks, setWeeks] = useState(null);

  const active = wall.enabled && wall.status !== "unavailable";

  const startWriting = useCallback(() => {
    if (isAuthenticated) {
      setComposing(true);
      return;
    }
    const next = new URLSearchParams(location.search);
    next.set("wall", "write");
    navigate(withConsumerAuthNext("/account/signup", `${location.pathname}?${next}`));
  }, [isAuthenticated, location.pathname, location.search, navigate]);

  // Deep links from shares and sign-up: ?wall=1 / ?wall=write
  const wallParam = params.get("wall");
  useEffect(() => {
    if (!active || !wallParam || authLoading) return;
    const next = new URLSearchParams(params);
    next.delete("wall");
    setParams(next, { replace: true });
    // After this render: open what the link asked for.
    const t = setTimeout(() => {
      if (wallParam === "write") {
        if (isAuthenticated) setComposing(true);
        else startWriting();
      } else if (isWide()) {
        document.getElementById("cluster-wall")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setFullOpen(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [active, wallParam, authLoading, isAuthenticated, params, setParams, startWriting]);

  const openWeeks = useCallback(async () => {
    if (weeks) return weeks;
    try {
      const data = await fetchClusterWallWeeks(clusterSlug);
      setWeeks(data.weeks || []);
      return data.weeks || [];
    } catch {
      setWeeks([]);
      return [];
    }
  }, [clusterSlug, weeks]);

  const value = useMemo(
    () => ({
      clusterSlug,
      clusterLabel,
      wall,
      active,
      week,
      setWeek,
      weeks,
      openWeeks,
      openBlock: setViewing,
      startWriting,
      openFull: () => setFullOpen(true),
    }),
    [clusterSlug, clusterLabel, wall, active, week, weeks, openWeeks, startWriting]
  );

  return (
    <WallContext.Provider value={value}>
      {children}
      {active && fullOpen ? <ClusterWallFullScreen onClose={() => setFullOpen(false)} /> : null}
      {viewing ? (
        <WallBlockViewer block={viewing} onClose={() => setViewing(null)} onRemoved={(id) => wall.removeLocal(id)} />
      ) : null}
      {composing ? (
        <WallComposerSheet
          clusterSlug={clusterSlug}
          clusterLabel={clusterLabel}
          onClose={() => setComposing(false)}
          onPosted={(block) => {
            if (week) setWeek(null);
            wall.addMine(block);
          }}
        />
      ) : null}
    </WallContext.Provider>
  );
}

function WeekPicker() {
  const ctx = useClusterWallContext();
  const [open, setOpen] = useState(false);
  const { wall, week, setWeek, weeks, openWeeks } = ctx;
  return (
    <span style={{ position: "relative" }}>
      <button
        type="button"
        className="cw-btn cw-btn-quiet"
        aria-expanded={open}
        onClick={async () => {
          await openWeeks();
          setOpen((o) => !o);
        }}
      >
        {week ? wallWeekLabel(wall.weekStart) : "This week"} ▾
      </button>
      {open ? (
        <div
          role="menu"
          style={{ position: "absolute", right: 0, top: "100%", zIndex: 5, background: "#fff", border: "1px solid #d1d5db", borderRadius: 4, minWidth: 170, maxHeight: 260, overflowY: "auto", boxShadow: "0 6px 18px rgba(0,0,0,.12)" }}
        >
          {(weeks || []).length === 0 ? <p className="cw-sub" style={{ padding: 10 }}>No past weeks yet.</p> : null}
          {(weeks || []).map((w) => (
            <button
              key={w.week_start}
              type="button"
              role="menuitem"
              className="cw-btn cw-btn-quiet"
              style={{ display: "flex", width: "100%", justifyContent: "space-between", borderRadius: 0 }}
              onClick={() => {
                setWeek(w.is_current ? null : w.week_start);
                setOpen(false);
              }}
            >
              <span>{w.is_current ? "This week" : wallWeekLabel(w.week_start)}</span>
              <span style={{ color: "#6b7280" }}>{w.block_count}</span>
            </button>
          ))}
        </div>
      ) : null}
    </span>
  );
}

function WallBody({ band = false }) {
  const { wall, openBlock, startWriting, clusterLabel, week, setWeek } = useClusterWallContext();
  if (wall.status === "loading") return <p className="cw-sub" style={{ padding: 8 }}>Loading the Wall…</p>;
  if (!wall.blocks.length) {
    return (
      <div style={{ padding: band ? "6px 2px" : 12, display: "grid", gap: 8, justifyItems: "start" }}>
        <p className="cw-sub" style={{ margin: 0 }}>
          {week ? "Nothing from that week." : `Nothing on the ${clusterLabel} Wall this week yet. Be the first.`}
        </p>
        {week ? (
          <button type="button" className="cw-btn" onClick={() => setWeek(null)}>Back to this week</button>
        ) : (
          <button type="button" className="cw-btn cw-btn-primary" onClick={startWriting}>Write on the Wall</button>
        )}
      </div>
    );
  }
  return (
    <>
      <div className={`cw-mosaic${band ? " cw-band" : ""}`} data-testid={band ? "cluster-wall-band-mosaic" : "cluster-wall-mosaic"}>
        {wall.blocks.map((b) => (
          <WallBlockTile key={b.public_id} block={b} onOpen={openBlock} />
        ))}
      </div>
      {!band && wall.hasMore ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 10 }}>
          <button type="button" className="cw-btn" onClick={wall.loadMore} disabled={wall.loadingMore}>
            {wall.loadingMore ? "Loading…" : "Show more"}
          </button>
        </div>
      ) : null}
    </>
  );
}

function Header({ compact = false, onClose = null }) {
  const { clusterLabel, startWriting, week, setWeek, openFull } = useClusterWallContext();
  return (
    <div className="cw-panel-head">
      <div style={{ minWidth: 0 }}>
        <h2 className="cw-title">{clusterLabel} Wall</h2>
        <p className="cw-sub">{week ? "Past week · read only" : "Anyone can read · new posts every week"}</p>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
        {compact ? (
          <button type="button" className="cw-btn cw-btn-quiet" onClick={openFull} data-testid="cluster-wall-see-all">
            See all
          </button>
        ) : (
          <WeekPicker />
        )}
        {week ? (
          <button type="button" className="cw-btn" onClick={() => setWeek(null)}>This week</button>
        ) : (
          <button type="button" className="cw-btn cw-btn-primary" onClick={startWriting} data-testid="cluster-wall-write">
            Write
          </button>
        )}
        {onClose ? (
          <button type="button" className="cw-btn cw-btn-quiet" onClick={onClose} aria-label="Close the Wall">
            Close
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Desktop: sticky side column with its own scroll. Hidden below 960 px by the layout CSS. */
export function ClusterWallPanel() {
  const ctx = useClusterWallContext();
  if (!ctx?.active) return null;
  return (
    <section id="cluster-wall" className="cw-panel" aria-label={`${ctx.clusterLabel} Wall`} data-testid="cluster-wall-panel">
      <Header />
      <div className="cw-panel-scroll">
        <WallBody />
      </div>
    </section>
  );
}

/** Phone: a sideways strip after the food boxes; "See all" opens the full Wall. */
export function ClusterWallBand() {
  const ctx = useClusterWallContext();
  if (!ctx?.active) return null;
  return (
    <section
      className="cw-band-only"
      aria-label={`${ctx.clusterLabel} Wall`}
      data-testid="cluster-wall-band"
      style={{ border: "1px solid #e5e7eb", borderRadius: 4, background: "#fafaf9", marginTop: "0.5rem", minWidth: 0 }}
    >
      <Header compact />
      <div style={{ padding: 8 }}>
        <WallBody band />
      </div>
    </section>
  );
}

function ClusterWallFullScreen({ onClose }) {
  const ctx = useClusterWallContext();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div className="cw-full" role="dialog" aria-modal="true" aria-label={`${ctx.clusterLabel} Wall`} data-testid="cluster-wall-full">
      <Header onClose={onClose} />
      <div className="cw-panel-scroll">
        <WallBody />
      </div>
    </div>
  );
}
