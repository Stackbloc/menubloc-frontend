import { useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      if (!data?.operator?.is_verified) {
        setMsg("⚠️ Logged in, but email not verified yet. Verify first.");
        return;
      }

      setMsg("✅ Logged in");
      onLogin?.(data.operator);
    } catch (err) {
      setMsg("❌ " + (err.message || "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>Log in</h2>

      <input
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <input
        style={{ width: "100%", padding: 10, marginBottom: 14 }}
        placeholder="Password"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        autoComplete="current-password"
      />

      <button onClick={submit} disabled={loading} style={{ padding: "10px 14px" }}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <div style={{ marginTop: 12 }}>{msg}</div>
    </div>
  );
}
