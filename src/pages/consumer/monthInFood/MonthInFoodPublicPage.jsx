/**
 * A shared Month in Food, for anyone with the link: no sign-in (Andre 2026-10-30). Route: /m/:token.
 * The numbers, restaurants and top dishes; never the calendar, Wish List or notes.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicMonthInFood } from "../../../lib/consumerApi.js";
import { shareMonthInFoodImage } from "../../../lib/monthInFoodShareImage.js";

const C = { cream: "#F7F2E7", paper: "#FFFDF8", forest: "#16302A", amber: "#DE9E33", ink: "#231F19", soft: "#5B5548", line: "#DDD3BE" };
const SERIF = "Fraunces, Georgia, 'Times New Roman', serif";

function Stat({ value, label }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

export default function MonthInFoodPublicPage() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [failed, setFailed] = useState(false);
  const [imageNote, setImageNote] = useState("");

  useEffect(() => {
    let alive = true;
    getPublicMonthInFood(token)
      .then((r) => alive && setReport(r))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [token]);

  async function shareImage() {
    setImageNote("");
    try {
      const how = await shareMonthInFoodImage(report);
      if (how === "saved") setImageNote("Picture saved.");
    } catch (err) {
      if (err?.name !== "AbortError") setImageNote("Couldn't make the picture. Try again.");
    }
  }

  return (
    <main style={styles.page} data-testid="month-in-food-public">
      <div style={styles.inner}>
        {failed ? <p style={styles.soft}>This report link isn&apos;t available.</p> : null}
        {!failed && !report ? <p style={styles.soft}>Loading…</p> : null}
        {report ? (
          <>
            <p style={styles.month}>{report.month_label}</p>
            <h1 style={styles.title}>
              {report.subject.display_name}&apos;s month in <em style={{ color: C.amber }}>food</em>.
            </h1>
            <div style={styles.stats}>
              <Stat value={report.stats.meals} label="Meals" />
              <Stat value={report.stats.dishes} label="Dishes" />
              <Stat value={report.stats.restaurants} label="Restaurants" />
              <Stat value={report.stats.home_meals} label="@home meals" />
            </div>
            {report.top_dishes.length ? (
              <section style={styles.section}>
                <h2 style={styles.heading}>Top dishes</h2>
                {report.top_dishes.map((d) => (
                  <p key={d} style={styles.row}>
                    {d}
                  </p>
                ))}
              </section>
            ) : null}
            {report.restaurants.length ? (
              <section style={styles.section}>
                <h2 style={styles.heading}>Restaurants</h2>
                {report.restaurants.map((r) => (
                  <Link key={r.id} to={`/restaurants/${r.id}`} style={styles.rowLink}>
                    <strong>{r.name}</strong>
                    {r.city ? <span style={styles.soft}>{r.city}</span> : null}
                  </Link>
                ))}
              </section>
            ) : null}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={shareImage} style={styles.share} data-testid="month-in-food-share-image">
                Share as a picture
              </button>
              {imageNote ? <span style={styles.soft}>{imageNote}</span> : null}
            </div>
            <footer style={styles.footer}>
              <p style={styles.brand}>Menuply</p>
              <p style={{ margin: "4px 0 14px" }}>Great food. Good people. Better together.</p>
              <Link to="/join/diners" style={styles.cta} data-testid="month-in-food-public-join">
                Join Menuply
              </Link>
            </footer>
          </>
        ) : null}
      </div>
    </main>
  );
}

const styles = {
  page: { minHeight: "100vh", background: C.cream, color: C.ink, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  inner: { maxWidth: 560, margin: "0 auto", padding: "32px 16px 48px", display: "flex", flexDirection: "column", gap: 24 },
  month: { margin: 0, alignSelf: "flex-start", background: C.forest, color: "#fff", borderRadius: 999, padding: "6px 14px", fontSize: 14, fontWeight: 600 },
  title: { margin: 0, fontFamily: SERIF, fontSize: 40, lineHeight: 1.1, fontWeight: 600 },
  stats: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 },
  stat: { background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, textAlign: "center" },
  statValue: { fontFamily: SERIF, fontSize: 30, fontWeight: 600 },
  statLabel: { fontSize: 13, color: C.soft },
  section: { display: "flex", flexDirection: "column", gap: 8 },
  heading: { margin: 0, fontFamily: SERIF, fontSize: 22, fontWeight: 600 },
  row: { margin: 0, padding: "8px 0", borderTop: `1px solid ${C.line}`, fontSize: 15, fontWeight: 600 },
  rowLink: { display: "flex", flexDirection: "column", gap: 2, padding: "8px 0", borderTop: `1px solid ${C.line}`, color: C.ink, textDecoration: "none", fontSize: 15 },
  soft: { margin: 0, fontSize: 13, color: C.soft },
  share: { border: "none", background: C.forest, color: "#fff", borderRadius: 999, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  footer: { background: C.forest, color: "#fff", borderRadius: 16, padding: 20 },
  brand: { margin: 0, fontFamily: SERIF, fontStyle: "italic", fontSize: 26, fontWeight: 600, color: C.amber },
  cta: { display: "inline-block", background: "#fff", color: C.forest, borderRadius: 999, padding: "10px 16px", fontSize: 14, fontWeight: 700, textDecoration: "none" },
};
