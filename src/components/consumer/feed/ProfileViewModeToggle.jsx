/**
 * Own-profile Edit View ↔ Connect View toggle.
 * Edit View = owner can change/input data. Connect View = see profile as others do.
 */

function GlassesIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 12.5h3.2a3.8 3.8 0 0 1 7.6 0h1.4a3.8 3.8 0 0 1 7.6 0H22"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.3" cy="12.5" r="3.3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16.7" cy="12.5" r="3.3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyesIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export default function ProfileViewModeToggle({
  previewAsConnect = false,
  onToggle,
  variant = "feedDark",
}) {
  const currentName = previewAsConnect ? "Connect View" : "Edit View";
  const nextName = previewAsConnect ? "Edit View" : "Connect View";
  const title = previewAsConnect
    ? "Switch to Edit View — make changes and add data on your profile"
    : "Switch to Connect View — see your profile the way others do";
  const label = `Currently ${currentName}. Switch to ${nextName}.`;
  const isLight = variant === "light";

  return (
    <button
      type="button"
      data-testid="profile-view-mode-toggle"
      aria-label={label}
      aria-pressed={previewAsConnect}
      title={title}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle?.();
      }}
      style={{
        ...styles.btn,
        ...(isLight ? styles.btnLight : styles.btnDark),
        ...(previewAsConnect ? (isLight ? styles.btnLightActive : styles.btnDarkActive) : null),
      }}
    >
      {previewAsConnect ? <EyesIcon /> : <GlassesIcon />}
      <span style={styles.name} data-testid="profile-view-mode-label">
        {currentName}
      </span>
    </button>
  );
}

const styles = {
  btn: {
    appearance: "none",
    minHeight: 40,
    borderRadius: 10,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
    flexShrink: 0,
    padding: "0 10px 0 8px",
  },
  name: {
    fontSize: 12,
    fontWeight: 750,
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
    lineHeight: 1,
  },
  btnDark: {
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(8, 12, 10, 0.82)",
    color: "#fff",
  },
  btnDarkActive: {
    border: "1px solid rgba(94, 234, 212, 0.55)",
    background: "rgba(16, 40, 32, 0.95)",
    color: "#5eead4",
  },
  btnLight: {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#334155",
  },
  btnLightActive: {
    border: "1px solid #86efac",
    background: "#ecfdf5",
    color: "#166534",
  },
};
