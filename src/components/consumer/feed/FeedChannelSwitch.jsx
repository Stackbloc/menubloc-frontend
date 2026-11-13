/**
 * "Clips | Deals" at the top of the Feed, as the app (HomeScreen showChannels): only when Today has
 * taken the Deals tab's place, so deals stay one tap away (Andre 2026-11-11 / 2026-11-13). Plain
 * words, the chosen one white and underlined — no pills.
 */
import { useLocation, useNavigate } from "react-router-dom";
import { clearStuckMediaChrome } from "../../../pages/consumer/myMenuply/pendingHighlightMedia.js";

const CHANNELS = [
  { to: "/feed", label: "Clips", testId: "channel-feed" },
  { to: "/feed/deals", label: "Deals", testId: "channel-deals" },
];

export default function FeedChannelSwitch({ leftInset = 0 }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = pathname.startsWith("/feed/deals") ? "/feed/deals" : "/feed";
  return (
    <>
    {/* The menu opened from a clip covers the Feed, as the app's menu sheet: no switch over it. */}
    <style>{`body:has([data-testid="feed-menu-browser-pip"]) [data-testid="feed-channel-switch"] { display: none; }`}</style>
    <div role="tablist" aria-label="Feed" style={{ ...styles.bar, left: leftInset }} data-testid="feed-channel-switch">
      {CHANNELS.map((c) => {
        const on = c.to === current;
        return (
          <button
            key={c.to}
            type="button"
            role="tab"
            aria-selected={on}
            data-testid={c.testId}
            style={{ ...styles.tab, ...(on ? styles.tabOn : null) }}
            onClick={() => {
              if (on) return;
              clearStuckMediaChrome();
              navigate(c.to);
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
    </>
  );
}

const styles = {
  bar: {
    position: "fixed",
    top: "max(14px, env(safe-area-inset-top))",
    right: 0,
    zIndex: 1300,
    display: "flex",
    justifyContent: "center",
    gap: 24,
    pointerEvents: "none",
  },
  tab: {
    pointerEvents: "auto",
    border: "none",
    background: "transparent",
    padding: "6px 2px",
    color: "rgba(255,255,255,0.7)",
    fontSize: 17,
    fontWeight: 600,
    fontFamily: "inherit",
    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
    cursor: "pointer",
  },
  tabOn: { color: "#fff", fontWeight: 800, textDecoration: "underline", textUnderlineOffset: 4 },
};
