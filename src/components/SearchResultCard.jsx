import React, { useState } from "react";

export default function SearchResultCard({ result }) {
  const [open, setOpen] = useState(false);

  const styles = {
    card: {
      marginTop: 16,
      padding: 16,
      border: "1px solid #eee",
      borderRadius: 12,
      background: "#fff",
      cursor: "pointer"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    title: { fontSize: 18, fontWeight: 700 },
    restaurant: { color: "#666", fontSize: 14 },
    price: { fontWeight: 600 },
    expand: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid #eee",
      fontSize: 14,
      color: "#444"
    }
  };

  return (
    <div style={styles.card} onClick={() => setOpen(!open)}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>{result.name}</div>
          <div style={styles.restaurant}>{result.restaurant}</div>
        </div>
        <div style={styles.price}>${result.price}</div>
      </div>

      {open && (
        <div style={styles.expand}>
          <div><strong>Insights:</strong> {result.insight || "Coming soon"}</div>
          <div><strong>Nutrition:</strong> {result.nutrition || "Coming soon"}</div>
          <div><strong>Pairings:</strong> {result.pairings || "Coming soon"}</div>
        </div>
      )}
    </div>
  );
}
