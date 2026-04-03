import { useLocation, useNavigate } from "react-router-dom";

const ROUTES = {
  pdf: "/restaurant/pdf-upload",
  spreadsheet: "/restaurant/spreadsheet-upload",
  ocr: "/restaurant/pdf-upload",
};

const styles = {
  page: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "36px 20px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  brand: { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#666", marginBottom: 28 },
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 32,
    fontSize: 11,
    fontWeight: 600,
    flexWrap: "wrap",
    rowGap: 8,
  },
  step: (active, done) => ({
    padding: "4px 10px",
    borderRadius: 999,
    background: done ? "#111" : active ? "#f0f0f5" : "transparent",
    color: done ? "#fff" : active ? "#111" : "#aaa",
    border: active ? "1.5px solid #111" : "1.5px solid transparent",
    whiteSpace: "nowrap",
    fontSize: 11,
  }),
  stepDivider: { flex: "0 0 12px", height: 1, background: "#e0e0e0", margin: "0 2px" },
  heading: { fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.03em" },
  subheading: { fontSize: 15, color: "#555", lineHeight: 1.6, marginBottom: 24 },
  summary: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fafafa",
    padding: "14px 16px",
    marginBottom: 24,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    fontSize: 13,
  },
  summaryLabel: { fontWeight: 800, color: "#111", marginRight: 4 },
  grid: { display: "grid", gap: 14 },
  card: {
    border: "1px solid #d7dce5",
    borderRadius: 16,
    padding: "18px 18px 16px",
    background: "#fff",
    cursor: "pointer",
  },
  cardTitle: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 10 },
  cardMeta: { fontSize: 12, color: "#667085", lineHeight: 1.5 },
  error: {
    padding: "12px 16px",
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    fontSize: 13,
    color: "#c00",
    marginBottom: 16,
    lineHeight: 1.5,
  },
};

const OPTIONS = [
  {
    key: "pdf",
    title: "Upload menu PDF",
    description: "Upload a PDF and continue with the standard Grubbid menu ingestion flow.",
    meta: "Best when you already have a finished menu PDF.",
  },
  {
    key: "spreadsheet",
    title: "Upload menu spreadsheet",
    description: "Use the CSV template workflow from the former signup flow.",
    meta: "Best when you want to structure sections, descriptions, and prices in a spreadsheet first.",
  },
  {
    key: "ocr",
    title: "Upload photo or scan via OCR",
    description: "Use the OCR-oriented path from the former signup flow after plan and design are set.",
    meta: "This currently continues into the PDF upload screen. Use a scanned PDF for best OCR results.",
  },
];

export default function MenuUploadChoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const missingState = !state.restaurant_id || !state.email || !state.owner_token;

  function handleChoice(choice) {
    navigate(ROUTES[choice], {
      state: {
        ...state,
        ingestion_method: choice,
      },
    });
  }

  if (missingState) {
    return (
      <div style={styles.page}>
        <div style={styles.brand}>Grubbid</div>
        <div style={styles.subbrand}>for Restaurants</div>
        <div style={styles.error}>
          <strong>Missing signup session data.</strong> Please restart restaurant signup to continue.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.brand}>Grubbid</div>
      <div style={styles.subbrand}>for Restaurants</div>

      <div style={styles.steps}>
        <div style={styles.step(false, true)}>1. Account</div>
        <div style={styles.stepDivider} />
        <div style={styles.step(false, true)}>2. Choose plan</div>
        <div style={styles.stepDivider} />
        <div style={styles.step(false, true)}>3. Design</div>
        <div style={styles.stepDivider} />
        <div style={styles.step(true, false)}>4. Upload menu</div>
      </div>

      <div style={styles.heading}>Choose how to add your menu</div>
      <div style={styles.subheading}>
        These are the same menu upload options that were previously shown during signup.
      </div>

      <div style={styles.summary}>
        <div><span style={styles.summaryLabel}>Restaurant:</span>{state.restaurant_name}</div>
        <div><span style={styles.summaryLabel}>Email:</span>{state.email}</div>
        {state.plan ? <div><span style={styles.summaryLabel}>Plan:</span>{state.plan}</div> : null}
      </div>

      <div style={styles.grid}>
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            style={styles.card}
            onClick={() => handleChoice(option.key)}
          >
            <div style={styles.cardTitle}>{option.title}</div>
            <div style={styles.cardDesc}>{option.description}</div>
            <div style={styles.cardMeta}>{option.meta}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
