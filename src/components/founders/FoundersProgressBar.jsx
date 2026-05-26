const segmentStyle = (active, done) => ({
  flex: 1,
  height: 4,
  borderRadius: 99,
  background: done || active ? "#1F4E3D" : "#d9e0ea",
  opacity: active && !done ? 0.55 : 1,
  transition: "background 0.3s, opacity 0.3s",
});

export default function FoundersProgressBar({ step }) {
  return (
    <div style={{ display: "flex", gap: 6, margin: "10px 0 32px" }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={segmentStyle(n === step, n < step)} />
      ))}
    </div>
  );
}
