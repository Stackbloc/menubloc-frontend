// menubloc-frontend/src/pages/RestaurantSignup.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function isEmail(x) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x || "").trim());
}

export default function RestaurantSignup() {
  const nav = useNavigate();
  const loc = useLocation();

  const presetEmail = useMemo(() => {
    try {
      const sp = new URLSearchParams(loc.search);
      return String(sp.get("email") || "").trim();
    } catch {
      return "";
    }
  }, [loc.search]);

  const [email, setEmail] = useState(presetEmail);
  const [touched, setTouched] = useState(false);

  const emailOk = isEmail(email);

  function onSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!emailOk) return;

    nav(`/restaurant-profile?email=${encodeURIComponent(email.trim())}`);
  }

  const styles = {
    wrap: {
      maxWidth: 860,
      margin: "100px auto",
      padding: 20,
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      lineHeight: 1.7,
    },
    brandRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
    brand: { fontWeight: 800, fontSize: 18 },
    back: { fontWeight: 800, textDecoration: "underline", color: "#111" },
    h1: { margin: "18px 0 8px", fontSize: 34, letterSpacing: -0.5 },
    p: { fontSize: 18, marginTop: 14, color: "#222" },
    card: {
      marginTop: 28,
      maxWidth: 520,
      marginLeft: "auto",
      marginRight: "auto",
      padding: 18,
      border: "1px solid #eee",
      borderRadius: 12,
      textAlign: "left",
      background: "#fff",
    },
    label: { fontWeight: 800, fontSize: 13, color: "#222" },
    input: {
      width: "100%",
      marginTop: 8,
      padding: "14px 12px",
      borderRadius: 10,
      border: "1px solid #ddd",
      fontSize: 16,
      outline: "none",
    },
    help: { marginTop: 8, fontSize: 13, color: "#666" },
    err: { marginTop: 8, fontSize: 13, color: "#b00020", fontWeight: 700 },
    btn: {
      width: "100%",
      marginTop: 14,
      padding: "14px 16px",
      borderRadius: 10,
      border: "none",
      background: "#111",
      color: "#fff",
      fontSize: 16,
      fontWeight: 900,
      cursor: "pointer",
    },
    fine: { marginTop: 14, fontSize: 12, color: "#555", textAlign: "center" },
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.brandRow}>
        <div style={styles.brand}>Grubbid</div>
        <Link to="/" style={styles.back}>
          Back
        </Link>
      </div>

      <h1 style={styles.h1}>Upload Your Menu</h1>
      <div style={styles.p}>
        Start with your email — we’ll take you to your restaurant profile next.
      </div>

      <form onSubmit={onSubmit} style={styles.card}>
        <div style={styles.label}>Email</div>
        <input
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="owner@restaurant.com"
          inputMode="email"
          autoComplete="email"
        />
        <div style={styles.help}>
          We’ll use this to attach your restaurant profile and menu uploads.
        </div>
        {touched && !emailOk ? <div style={styles.err}>Enter a valid email address.</div> : null}

        <button type="submit" style={styles.btn}>
          Continue
        </button>

        <div style={styles.fine}>Takes less than 5 minutes. No commitment required.</div>
      </form>
    </div>
  );
}