import React from "react";
import { accountStyles as styles } from "./accountDashboardStyles.js";

export default function SummaryEditSection({
  title,
  id,
  summary,
  description,
  editing,
  onEdit,
  onDone,
  editLabel = "Edit",
  doneLabel = "Done",
  status,
  statusError = false,
  last = false,
  children,
}) {
  return (
    <section id={id} style={{ ...styles.section, ...(last ? styles.sectionLast : null) }}>
      <div style={styles.sectionHead}>
        <h2 style={styles.sectionTitle}>{title}</h2>
        {editing ? (
          <button type="button" onClick={onDone} style={styles.textBtn}>
            {doneLabel}
          </button>
        ) : (
          <button type="button" onClick={onEdit} style={styles.textBtn}>
            {editLabel}
          </button>
        )}
      </div>
      {description && !editing ? <p style={styles.sectionDesc}>{description}</p> : null}
      {status ? (
        <p style={statusError ? styles.statusErr : styles.statusOk} role="status">
          {status}
        </p>
      ) : null}
      {editing ? children : <p style={styles.summary}>{summary}</p>}
    </section>
  );
}
