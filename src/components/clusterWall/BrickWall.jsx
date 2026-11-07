import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useConsumer } from "../../context/ConsumerContext.jsx";
import useBrickWall from "../../hooks/useBrickWall.js";
import { withConsumerAuthNext } from "../../lib/consumerAuthNext.js";
import { shareWallBlock, trackWallShare } from "../../lib/clusterWallShare.js";
import { copyText, toConsumerShareAbsolute } from "../share/shareUtils.js";
import Brick from "./Brick.jsx";
import WallBlockViewer from "./WallBlockViewer.jsx";
import BrickComposer from "./BrickComposer.jsx";
import "./clusterWall.css";
import "./brickWall.css";

/**
 * The USC Wall as one continuous brick wall (Andre 2026-11-06 redesign).
 * - Newest row on top, older below, ~30 bricks per page loaded as you scroll. No weeks.
 * - Each row's widths come from the backend (stored once); empty slots draw as plain bricks, so
 *   rows stay edge to edge and nothing below ever reshuffles.
 * - New bricks from others wait behind a "New bricks" pill; mine go in at once.
 * - Pinned bricks (admin) sit on top. Everything else is written by students.
 */

const SCREENS_BEFORE_JUMP = 2.5;

// Row height from the number of bricks (and taller when a photo/clip is in it).
function rowAspect(row) {
  const media = row.bricks.some((b) => b.kind === "photo" || b.kind === "video");
  if (media) return "12 / 7.4";
  return row.spans.length === 1 ? "12 / 4.4" : row.spans.length === 2 ? "12 / 5.2" : "12 / 5.8";
}

/** An empty slot: a plain brick (or, in the open top row, an invitation to write). */
function BlankBrick({ invite = false, onWrite }) {
  if (!invite) return <div className="bw-brick bw-blank" aria-hidden="true" />;
  return (
    <button type="button" className="bw-brick bw-blank bw-invite" onClick={onWrite} data-testid="wall-brick-invite">
      + Your brick here
    </button>
  );
}

function WallRow({ row, onOpen, onShare, onWrite }) {
  const bySlot = new Map(row.bricks.map((b) => [b.slot, b]));
  const lastFilled = Math.max(-1, ...row.bricks.map((b) => b.slot));
  const media = row.bricks.some((b) => b.kind === "photo" || b.kind === "video");
  return (
    <div className="bw-row" style={{ aspectRatio: rowAspect(row) }} data-testid="wall-row" data-row={row.row}>
      {row.spans.map((span, i) => {
        const b = bySlot.get(i);
        return (
          <div key={i} className="bw-cell" style={{ gridColumn: `span ${span}` }}>
            {b ? (
              <Brick block={b} onOpen={onOpen} onShare={onShare} tall={media} />
            ) : (
              <BlankBrick invite={row.open && i === lastFilled + 1} onWrite={onWrite} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function wallShareText(label, url) {
  return `The ${label} Wall on Menuply — written by ${label} students 🧱 Add a brick: ${url}`;
}

/**
 * overlay: shown over the cluster page (own scroll, page underneath keeps its place); otherwise the
 * page itself scrolls.
 */
export default function BrickWall({ clusterSlug, clusterLabel = "USC", onBack = null, onExit = null, onCluster, overlay = false, legacy = null }) {
  const wall = useBrickWall(clusterSlug);
  const { isAuthenticated, loading: authLoading } = useConsumer();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [viewing, setViewing] = useState(null);
  const [composing, setComposing] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [toast, setToast] = useState("");
  const sentinel = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (wall.cluster && onCluster) onCluster(wall.cluster);
  }, [wall.cluster, onCluster]);

  // Infinite scroll: next ~30 bricks when the bottom comes near.
  const { hasMore, loadMore } = wall;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(), {
      root: overlay ? rootRef.current : null,
      rootMargin: "900px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, wall.rows.length, overlay]);

  // "Jump to top" after a few screens.
  useEffect(() => {
    const el = overlay ? rootRef.current : window;
    if (!el) return undefined;
    const onScroll = () => {
      const y = overlay ? rootRef.current.scrollTop : window.scrollY;
      setShowJump(y > window.innerHeight * SCREENS_BEFORE_JUMP);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const toTop = () => (overlay ? rootRef.current : window)?.scrollTo({ top: 0, behavior: "smooth" });

  const shareBrick = useCallback(
    async (block) => {
      const how = await shareWallBlock(block);
      if (how !== "cancelled") trackWallShare(block, how === "shared_link" ? "native" : "copy_link");
      if (how === "copied") flash("Link copied");
    },
    [flash]
  );

  const shareWall = async () => {
    const url = toConsumerShareAbsolute(`/clusters/walls/${clusterSlug}?ref=wall_share`);
    const text = wallShareText(clusterLabel, url);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ text, url });
        trackWallShare({ cluster_slug: clusterSlug, kind: "wall", size: null }, "native");
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }
    await copyText(text);
    trackWallShare({ cluster_slug: clusterSlug, kind: "wall", size: null }, "copy_link");
    flash("Link copied");
  };

  const goSignUp = useCallback(() => {
    setComposing(false);
    const next = new URLSearchParams(location.search);
    next.set("wall", "write");
    navigate(withConsumerAuthNext("/account/signup", `${location.pathname}?${next}`));
  }, [location.pathname, location.search, navigate]);

  // ?wall=write (after sign-up, or "Write yours" on a shared brick) opens the composer.
  const wallParam = params.get("wall");
  useEffect(() => {
    if (wallParam !== "write" || authLoading) return;
    const next = new URLSearchParams(params);
    next.delete("wall");
    setParams(next, { replace: true });
    // Not cancelled when the URL changes (that change is this very effect's doing).
    setTimeout(() => setComposing(true), 0);
  }, [wallParam, authLoading, params, setParams]);

  const back = () => {
    if (onExit) return onExit();
    if (location.key !== "default") return navigate(-1);
    return navigate("/");
  };

  const writer = useMemo(() => () => setComposing(true), []);

  // Backend without the stored layout yet (before mig 0397): the previous Wall.
  if (wall.status === "legacy" && legacy) return legacy;

  const empty = wall.status === "ok" && !wall.rows.length && !wall.pinned.length && !wall.waiting.length;

  return (
    <div className={`bw-root${overlay ? " bw-overlay" : ""}`} ref={rootRef} data-testid="brick-wall" role={overlay ? "dialog" : undefined} aria-modal={overlay || undefined} aria-label={overlay ? `${clusterLabel} Wall` : undefined}>
      <header className="bw-head">
        <button type="button" className="bw-icon" onClick={back} aria-label="Back" data-testid="wall-back">
          ‹
        </button>
        <div className="bw-title-wrap">
          <h1 className="bw-title">{clusterLabel} Wall</h1>
          <span className="bw-by">on Menuply</span>
        </div>
        <button type="button" className="bw-head-share" onClick={shareWall} data-testid="wall-share">
          <span aria-hidden="true">↗</span> Share
        </button>
      </header>
      {onBack ? (
        <div className="bw-backrow">
          <button type="button" onClick={onBack} data-testid="wall-back-to-menuply">← Back to Menuply</button>
        </div>
      ) : null}

      {wall.fresh > 0 ? (
        <button
          type="button"
          className="bw-pill"
          data-testid="wall-new-bricks"
          onClick={() => {
            toTop();
            wall.showFresh();
          }}
        >
          ↑ {wall.fresh === 1 ? "1 new brick" : `${wall.fresh} new bricks`}
        </button>
      ) : null}

      <main className="bw-wall" aria-label={`${clusterLabel} Wall`}>
        {wall.status === "loading" ? <p className="bw-note">Loading the Wall…</p> : null}
        {wall.status === "unavailable" ? <p className="bw-note">The Wall didn't load. Pull to refresh or try again soon.</p> : null}
        {wall.waiting.map((b) => (
          <div key={b.public_id} className="bw-row" style={{ aspectRatio: "12 / 6" }}>
            <div className="bw-cell" style={{ gridColumn: "span 12" }}>
              <Brick block={b} onOpen={setViewing} tall />
            </div>
          </div>
        ))}
        {wall.pinned.map((b) => (
          <div key={b.public_id} className="bw-row bw-pinned" style={{ aspectRatio: b.kind === "text" ? "12 / 4.6" : "12 / 7.4" }} data-testid="wall-pinned">
            <div className="bw-cell" style={{ gridColumn: "span 12" }}>
              <Brick block={b} onOpen={setViewing} onShare={shareBrick} />
            </div>
          </div>
        ))}
        {empty ? (
          <div className="bw-row" style={{ aspectRatio: "12 / 6" }}>
            <div className="bw-cell" style={{ gridColumn: "span 12" }}>
              <button type="button" className="bw-brick bw-blank bw-invite" onClick={writer}>
                Be the first to write a brick
              </button>
            </div>
          </div>
        ) : null}
        {wall.rows.map((row) => (
          <WallRow key={row.row} row={row} onOpen={setViewing} onShare={shareBrick} onWrite={writer} />
        ))}
        <div ref={sentinel} aria-hidden="true" style={{ height: 1 }} />
        {wall.loadingMore ? <p className="bw-note">Loading older bricks…</p> : null}
        {wall.status === "ok" && !wall.hasMore && wall.rows.length ? <p className="bw-note">You've reached the first brick.</p> : null}
        {hasMore && !wall.loadingMore ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
            <button type="button" className="bw-more" onClick={loadMore}>Show older bricks</button>
          </div>
        ) : null}
      </main>

      {showJump ? (
        <button type="button" className="bw-jump" onClick={toTop} aria-label="Jump to top" data-testid="wall-jump-top">
          ↑ Top
        </button>
      ) : null}
      <button type="button" className="bw-fab" onClick={writer} data-testid="cluster-wall-write">
        Write a Brick
      </button>
      {toast ? <div className="bw-toast" role="status">{toast}</div> : null}

      {viewing ? <WallBlockViewer block={viewing} onClose={() => setViewing(null)} onRemoved={(id) => wall.removeLocal(id)} /> : null}
      {composing ? (
        <BrickComposer
          clusterSlug={clusterSlug}
          clusterLabel={clusterLabel}
          isSignedIn={isAuthenticated}
          onClose={() => setComposing(false)}
          onNeedAccount={goSignUp}
          onPosted={(block) => {
            toTop();
            wall.addMine(block);
          }}
        />
      ) : null}
    </div>
  );
}
