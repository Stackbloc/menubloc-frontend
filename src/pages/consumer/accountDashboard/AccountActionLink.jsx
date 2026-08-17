import { Link } from "react-router-dom";
import { accountStyles as styles } from "./accountDashboardStyles.js";

export default function AccountActionLink({
  to,
  title,
  description,
  actionLabel = "Open",
  last = false,
}) {
  return (
    <Link
      to={to}
      style={{
        ...styles.actionRow,
        ...(last ? { borderBottom: "none" } : null),
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={styles.actionCopy}>
        <p style={styles.actionTitle}>{title}</p>
        {description ? <p style={styles.muted}>{description}</p> : null}
      </div>
      <span style={styles.textBtn}>{actionLabel}</span>
    </Link>
  );
}
