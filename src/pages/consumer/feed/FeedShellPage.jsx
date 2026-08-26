/**
 * Feed shell layout — FEED | EATING | EVENTS | ME.
 * Parallel consumer entry; does not replace `/` until VITE_FEED_AS_HOME cutover.
 */

import { Outlet } from "react-router-dom";
import FeedPrimaryNav from "../../../components/consumer/feed/FeedPrimaryNav.jsx";

export default function FeedShellPage({ children = null }) {
  return (
    <div style={styles.shell} data-testid="feed-shell">
      <div style={styles.body}>{children != null ? children : <Outlet />}</div>
      <FeedPrimaryNav />
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100dvh",
    background: "#050705",
    color: "#fff",
  },
  body: {
    minHeight: "100dvh",
  },
};
