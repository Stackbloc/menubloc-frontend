import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { fetchWallBlock } from "../lib/clusterWallApi.js";
import { clusterPath } from "../lib/clusterUrl.js";
import { withConsumerAuthNext } from "../lib/consumerAuthNext.js";
import WallBlockViewer, { WallBlockLarge, WallShareControls } from "../components/clusterWall/WallBlockViewer.jsx";
import { wallWeekLabel } from "../lib/clusterWallStyles.js";
import "../components/clusterWall/clusterWall.css";

/**
 * menuply.com/wall/:publicId — where shared Wall links land (signed in or not).
 * The post itself, then two invitations: write yours (needs an account) and explore the Wall.
 * Removed posts say so and show nothing of the post (link previews are handled by middleware.js).
 */
export default function WallBlockPage() {
  const { publicId } = useParams();
  const { isAuthenticated } = useConsumer();
  const [loaded, setLoaded] = useState({ id: null, status: "loading", block: null });
  // A new id shows "Loading…" until its own answer arrives.
  const state = loaded.id === publicId ? loaded : { status: "loading", block: null };
  const setState = (next) => setLoaded({ id: publicId, ...next });
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchWallBlock(publicId, { signal: ctrl.signal })
      .then((data) => setLoaded({ id: publicId, status: "ok", block: data.block }))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        const removed = /removed/i.test(String(err?.message || ""));
        setLoaded({ id: publicId, status: removed ? "removed" : "missing", block: null });
      });
    return () => ctrl.abort();
  }, [publicId]);

  useEffect(() => {
    const b = state.block;
    document.title = b ? `${b.author?.first_name ? `${b.author.first_name} on the` : "On the"} ${b.cluster_label} Wall | Menuply` : "Menuply Wall";
  }, [state.block]);

  const block = state.block;
  const wallHome = block
    ? clusterPath({ state: block.cluster_state, city: block.cluster_city, slug: block.cluster_slug }) || "/clusters"
    : "/clusters";
  const writeTarget = `${wallHome}?wall=write`;
  const writeHref = isAuthenticated ? writeTarget : withConsumerAuthNext("/account/signup", writeTarget);

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "1.25rem 16px 4rem", boxSizing: "border-box" }} data-testid="wall-block-page">
      <p style={{ margin: "0 0 12px", font: "700 13px/1.2 system-ui", color: "#6b7280" }}>
        <Link to="/" style={{ color: "#111827", font: "700 18px/1 Georgia, serif", textDecoration: "none" }}>Menuply</Link>
        {block ? ` · ${block.cluster_label} Wall` : ""}
      </p>

      {state.status === "loading" ? <p className="cw-sub">Loading…</p> : null}

      {state.status === "removed" || state.status === "missing" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <p className="cw-title">{state.status === "removed" ? "This post was removed" : "We can't find that post"}</p>
          <p className="cw-sub">Wall posts can be deleted by the person who wrote them or taken down by Menuply.</p>
          <div>
            <Link className="cw-btn cw-btn-primary" to="/clusters">Explore Menuply</Link>
          </div>
        </div>
      ) : null}

      {block ? (
        <div style={{ display: "grid", gap: 14 }}>
          <WallBlockLarge block={block} />
          <p className="cw-sub" style={{ margin: 0 }}>
            {block.author?.first_name ? (
              block.author.profile_path ? (
                <Link to={block.author.profile_path} style={{ color: "#111827", fontWeight: 800 }}>{block.author.first_name}</Link>
              ) : (
                <span style={{ color: "#111827", fontWeight: 800 }}>{block.author.first_name}</span>
              )
            ) : null}
            {block.author?.first_name ? " · " : ""}
            On the {block.cluster_label} Wall · {wallWeekLabel(block.week_start)}
          </p>

          <section
            style={{ border: "1px solid #e5e7eb", borderRadius: 4, padding: 14, display: "grid", gap: 10, background: "#fafaf9" }}
            data-testid="wall-block-invite"
          >
            <p className="cw-title">Write yours on Menuply</p>
            <p className="cw-sub" style={{ margin: 0 }}>
              The {block.cluster_label} Wall is where students leave words and clips. New every week.
              {isAuthenticated ? "" : " Reading is free; writing takes a Menuply account."}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Link className="cw-btn cw-btn-primary" to={writeHref} data-testid="wall-block-write">
                Write yours
              </Link>
              <Link className="cw-btn" to={`${wallHome}?wall=1`} data-testid="wall-block-explore">
                Explore the {block.cluster_label} Wall
              </Link>
            </div>
          </section>

          <WallShareControls block={block} />

          {!block.is_mine ? (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {isAuthenticated ? (
                <button type="button" className="cw-btn cw-btn-quiet" onClick={() => setReporting(true)}>⚑ Report</button>
              ) : (
                <Link className="cw-btn cw-btn-quiet" to={withConsumerAuthNext("/account/login", `/wall/${block.public_id}`)}>
                  ⚑ Sign in to report
                </Link>
              )}
            </div>
          ) : null}
          {reporting ? (
            <WallBlockViewer
              block={block}
              onClose={() => setReporting(false)}
              onRemoved={() => setState({ status: "missing", block: null })}
            />
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
