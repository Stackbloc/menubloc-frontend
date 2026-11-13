import { Link } from "react-router-dom";
import MyMenuplyPage from "../MyMenuplyPage.jsx";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import { useUnreadNotifications } from "../../../lib/useUnreadNotifications.js";

/** Plan 40: new notifications (replies to your comments, comments on your clips) show up top. */
function NewNotificationsRow() {
  const { isAuthenticated } = useConsumer();
  const count = useUnreadNotifications(isAuthenticated);
  if (!count) return null;
  return (
    <Link to="/account/notifications" style={rowStyle} data-testid="profile-new-notifications">
      <span aria-hidden="true">🔔</span>
      <span style={{ flex: 1 }}>
        {count === 1 ? "1 new notification" : `${count > 99 ? "99+" : count} new notifications`}
      </span>
      <span aria-hidden="true" style={{ color: "#5c665f" }}>›</span>
    </Link>
  );
}

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "10px 16px 0",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #e1e6e1",
  background: "#fff",
  color: "#111613",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
};

export default function FeedProfilePage() {
  return (
    <div data-testid="feed-profile-page">
      <NewNotificationsRow />
      <MyMenuplyPage />
    </div>
  );
}
