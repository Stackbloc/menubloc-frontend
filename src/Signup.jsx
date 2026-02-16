import { useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

export default function Signup({ onDone }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMsg("");
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) return setMsg("Enter a valid email.");
    if (pw.length < 8) return setMsg("Password must be at least 8 characters.");
    if (pw !== pw2) return setMsg("Passwords do not match.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: e, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setMsg("✅ Signup created. Check backend terminal for verification link (dev mode).");
      onDone?.();
    } catch (err) {
      setMsg("❌ " + (err.message || "Signup failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>Create your operator account</h2>
      <p style={{ color: "#555" }}>
        This is the login that replaces “remember your restaurant id.”
      </p>

      <input
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <input
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
        placeholder="Password (8+ chars)"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        autoComplete="new-password"
      />

      <input
        style={{ width: "100%", padding: 10, marginBottom: 14 }}
        placeholder="Confirm password"
        type="password"
        value={pw2}
        onChange={(e) => setPw2(e.target.value)}
        autoComplete="new-password"
      />

      <button onClick={submit} disabled={loading} style={{ padding: "10px 14px" }}>
        {loading ? "Creating..." : "Sign up"}
      </button>

      <div style={{ marginTop: 12 }}>{msg}</div>
    </div>
  );
}
