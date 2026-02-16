export default function VerifySuccess({ onNext }) {
  return (
    <div style={{ padding: 40, maxWidth: 700, margin: "0 auto" }}>
      <h2>Email verified ✅</h2>

      <p>
        Your account is ready. Continue to complete your restaurant profile
        and upload your menu.
      </p>

      <button
        onClick={() => onNext?.()}
        style={{
          padding: "12px 18px",
          background: "#111",
          color: "#fff",
          borderRadius: 8,
          border: "none",
          cursor: "pointer"
        }}
      >
        Continue →
      </button>
    </div>
  );
}
