import React from "react";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f7f4ed",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#0f1720",
    textAlign: "center",
  },
  card: {
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "16px",
    padding: "28px 24px",
    border: "1px solid #e7ece6",
    boxShadow: "0 12px 30px rgba(17, 24, 39, 0.08)",
  },
  heading: {
    fontSize: "22px",
    margin: "0 0 8px",
  },
  text: {
    margin: 0,
    lineHeight: 1.5,
    color: "#5b6571",
    fontSize: "15px",
  },
};

export default function AppleAuthCallback() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Completing Apple sign-in</h1>
        <p style={styles.text}>If this window does not close automatically, return to Menuply.</p>
      </div>
    </div>
  );
}
