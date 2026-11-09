import { useCallback, useEffect, useMemo, useState } from "react";
import { wallName } from "../../lib/clusterWallStyles.js";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import useClusterWall from "../../hooks/useClusterWall.js";
import { withConsumerAuthNext } from "../../lib/consumerAuthNext.js";
import { trackEngagement } from "../../lib/engagementTracking.js";
import { houseSlot } from "../../lib/clusterWallHouse.js";
import { wallOpenEntry } from "../../lib/wallOpenEntry.js";
import WallBlockTile from "./WallBlockTile.jsx";
import WallBlockViewer from "./WallBlockViewer.jsx";
import BrickComposer from "./BrickComposer.jsx";
import BrickWall from "./BrickWall.jsx";
import { WallContext, useClusterWallContext } from "./clusterWallContext.js";
import "./clusterWall.css";

/**
 * Cluster Wall on the cluster page (USC first). One provider holds the data and the sheets;
 * ClusterWallPanel (desktop side column, own scroll) and ClusterWallBand (phone, sideways strip)
 * render from it. ?wall=1 opens the full Wall, ?wall=write opens the composer (after sign-up too).
 *
 * standalone (menuply.com/clusters/walls/:slug): the page IS the full Wall, so ?wall=1 does nothing
 * and the official Menuply brick shows once among the posts (showHouse).
 */

function isWide() {
  return typeof window !== "undefined" && window.matchMedia?.("(min-width: 960px)")?.matches;
}

export function ClusterWallProvider({
  clusterSlug,
  clusterLabel = "USC",
  standalone = false,
  showHouse = false,
  hold = false,
  children,
}) {
  const [week, setWeek] = useState(null);
  // hold (cluster page, Andre 2026-11-07): the Wall waits until Food by type and the clips have
  // shown, so nobody taps into the Wall before seeing the food types. Layout stays reserved.
  const wall = useClusterWall(clusterSlug, { week, paused: hold });
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [viewing, setViewing] = useState(null);
  const [composing, setComposing] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  // One random number per visit: the Menuply brick keeps its spot while new posts arrive.
  const [houseRand] = useState(() => Math.random());

  const active = wall.enabled && wall.status !== "unavailable";

  // Sign-up, then back here with the composer open (clips, or when the guest path is off).
  const goSignUp = useCallback(() => {
    setComposing(false);
    const next = new URLSearchParams(location.search);
    next.set("wall", "write");
    navigate(withConsumerAuthNext("/account/signup", `${location.pathname}?${next}`));
  }, [location.pathname, location.search, navigate]);

  // Anyone can write (Andre 2026-11-06): signed out opens the composer as a guest (words only).
  const startWriting = useCallback(() => {
    setComposing(true);
  }, []);

  // Deep links from shares and sign-up: ?wall=1 / ?wall=write; /wall/usc: ?wall=full
  const wallParam = params.get("wall");
  useEffect(() => {
    if (!active || !wallParam || authLoading) return;
    const next = new URLSearchParams(params);
    next.delete("wall");
    setParams(next, { replace: true });
    // After this render: open what the link asked for.
    const t = setTimeout(() => {
      if (wallParam === "write") {
        startWriting();
      } else if (standalone) {
        // Already the full Wall.
      } else if (wallParam === "full") {
        // menuply.com/wall/usc redirects here: the full-screen Wall on every screen size.
        trackEngagement("wall_open", { subtype: wallOpenEntry({ search: params.toString() }) });
        setFullOpen(true);
      } else if (isWide()) {
        document.getElementById("cluster-wall")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setFullOpen(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [active, wallParam, authLoading, isAuthenticated, params, setParams, startWriting, standalone]);

  const openHouse = useCallback(
    (block) => {
      const to = block?.link_path || "/clusters";
      trackEngagement("wall_house_click", { placement: "wall_house" }, { href: to });
      navigate(to);
    },
    [navigate]
  );

  const value = useMemo(
    () => ({
      clusterSlug,
      clusterLabel,
      wall,
      active,
      held: hold,
      week,
      setWeek,
      openBlock: setViewing,
      openHouse,
      showHouse: showHouse && !week,
      houseRand,
      standalone,
      startWriting,
      openFull: () => {
        // From the cluster page = from inside Menuply (counted on the cluster page view).
        trackEngagement("wall_open", { subtype: "menuply" });
        setFullOpen(true);
      },
    }),
    [clusterSlug, clusterLabel, wall, active, hold, week, openHouse, showHouse, houseRand, standalone, startWriting]
  );

  return (
    <WallContext.Provider value={value}>
      {children}
      {active && fullOpen ? <ClusterWallFullScreen onClose={() => setFullOpen(false)} /> : null}
      {viewing ? (
        <WallBlockViewer block={viewing} onClose={() => setViewing(null)} onRemoved={(id) => wall.removeLocal(id)} />
      ) : null}
      {composing ? (
        <BrickComposer
          clusterSlug={clusterSlug}
          clusterLabel={clusterLabel}
          isSignedIn={isAuthenticated}
          onClose={() => setComposing(false)}
          onNeedAccount={goSignUp}
          onPosted={(block) => {
            if (week) setWeek(null);
            wall.addMine(block);
          }}
        />
      ) : null}
    </WallContext.Provider>
  );
}

function WallBody({ band = false }) {
  const { wall, openBlock, openHouse, showHouse, houseRand, startWriting, clusterLabel, week, setWeek } = useClusterWallContext();
  if (wall.status === "loading") return <p className="cw-sub" style={{ padding: 8 }}>Loading the Wall…</p>;
  const house = !band && showHouse && wall.isCurrentWeek ? wall.houseBlock : null;
  const houseAt = house ? houseSlot(wall.blocks.length, houseRand) : -1;
  const houseTile = house ? <WallBlockTile key={house.public_id} block={house} onOpen={openHouse} /> : null;
  if (!wall.blocks.length) {
    return (
      <div style={{ padding: band ? "6px 2px" : 12, display: "grid", gap: 8, justifyItems: "start" }}>
        <p className="cw-sub" style={{ margin: 0 }}>
          {week ? "Nothing from that week." : `Nothing on the ${wallName(clusterLabel)} yet. Be the first.`}
        </p>
        {week ? (
          <button type="button" className="cw-btn" onClick={() => setWeek(null)}>Back to this week</button>
        ) : (
          <button type="button" className="cw-btn cw-btn-primary" onClick={startWriting}>Write on the Wall</button>
        )}
        {houseTile ? <div className="cw-mosaic" style={{ width: "100%" }}>{houseTile}</div> : null}
      </div>
    );
  }
  return (
    <>
      <div className={`cw-mosaic${band ? " cw-band" : ""}`} data-testid={band ? "cluster-wall-band-mosaic" : "cluster-wall-mosaic"}>
        {wall.blocks.map((b, i) => (
          <WallBlockTileWithHouse key={b.public_id} at={i} houseAt={houseAt} houseTile={houseTile}>
            <WallBlockTile block={b} onOpen={openBlock} />
          </WallBlockTileWithHouse>
        ))}
        {houseAt === wall.blocks.length ? houseTile : null}
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

/** A post, with the Menuply brick in front of it when this is the brick's spot. */
function WallBlockTileWithHouse({ at, houseAt, houseTile, children }) {
  if (at !== houseAt || !houseTile) return children;
  return (
    <>
      {houseTile}
      {children}
    </>
  );
}

function Header() {
  const { clusterLabel, startWriting, openFull } = useClusterWallContext();
  return (
    <div className="cw-panel-head">
      <div style={{ minWidth: 0 }}>
        <h2 className="cw-title">{wallName(clusterLabel)}</h2>
        <p className="cw-sub">Written by {clusterLabel} students · anyone can add a brick</p>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
        <button type="button" className="cw-btn cw-btn-quiet" onClick={openFull} data-testid="cluster-wall-see-all">
          See all
        </button>
        <button type="button" className="cw-btn cw-btn-primary" onClick={startWriting} data-testid="cluster-wall-write">
          Write a Brick
        </button>
      </div>
    </div>
  );
}

/** Small way back into Menuply, only when the Wall was opened from inside Menuply. */
export function BackToMenuply({ onBack }) {
  return (
    <button type="button" className="cw-back" onClick={onBack} data-testid="wall-back-to-menuply">
      ← Back to Menuply
    </button>
  );
}

/** Desktop: sticky side column with its own scroll. Hidden below 960 px by the layout CSS. */
export function ClusterWallPanel() {
  const ctx = useClusterWallContext();
  if (!ctx?.active || ctx.held) return null;
  return (
    <section id="cluster-wall" className="cw-panel" aria-label={wallName(ctx.clusterLabel)} data-testid="cluster-wall-panel">
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
  if (!ctx?.active || ctx.held) return null;
  return (
    <section
      className="cw-band-only"
      aria-label={wallName(ctx.clusterLabel)}
      data-testid="cluster-wall-band"
      style={{ border: "1px solid #e5e7eb", borderRadius: 4, background: "#fafaf9", marginTop: "0.5rem", minWidth: 0 }}
    >
      <Header />
      <div style={{ padding: 8 }}>
        <WallBody band />
      </div>
    </section>
  );
}

/** The full Wall over the cluster page: the brick wall with "← Back to Menuply" (the page keeps its place). */
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
  const legacy = (
    <div className="cw-full" role="dialog" aria-modal="true" aria-label={wallName(ctx.clusterLabel)} data-testid="cluster-wall-full">
      <div className="cw-back-row">
        <BackToMenuply onBack={onClose} />
      </div>
      <Header />
      <div className="cw-panel-scroll">
        <WallBody />
      </div>
    </div>
  );
  return (
    <div data-testid="cluster-wall-full">
      <BrickWall overlay clusterSlug={ctx.clusterSlug} clusterLabel={ctx.clusterLabel} onBack={onClose} onExit={onClose} legacy={legacy} />
    </div>
  );
}

/**
 * menuply.com/clusters/walls/:slug — the full Wall as its own page (QR codes, shares, social).
 * Header + Write, every post, the Menuply brick once. `onBack` only when the visitor
 * came from inside Menuply.
 */
export function ClusterWallStandalone({ onBack = null }) {
  const ctx = useClusterWallContext();
  if (!ctx) return null;
  if (!ctx.active) {
    return ctx.wall.status === "loading" ? (
      <p className="cw-sub" style={{ padding: 12 }}>Loading the Wall…</p>
    ) : (
      <p className="cw-sub" style={{ padding: 12 }} data-testid="cluster-wall-standalone-missing">This place has no Wall yet.</p>
    );
  }
  return (
    <section className="cw-standalone" aria-label={wallName(ctx.clusterLabel)} data-testid="cluster-wall-standalone">
      {onBack ? (
        <div className="cw-back-row">
          <BackToMenuply onBack={onBack} />
        </div>
      ) : null}
      <Header />
      <div className="cw-standalone-body">
        <WallBody />
      </div>
    </section>
  );
}
