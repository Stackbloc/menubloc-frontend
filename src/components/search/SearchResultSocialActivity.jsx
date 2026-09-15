/**
 * Connect Wants / Wants-to-Try lines on a ranked search card.
 * Reads `row.social_activity` from Search. Does not fetch, infer, or rank.
 */
export default function SearchResultSocialActivity({ items }) {
  const list = Array.isArray(items)
    ? items.filter((row) => row && String(row.line || "").trim())
    : [];
  if (!list.length) return null;

  return (
    <ul
      data-testid="search-result-social-activity"
      style={{
        listStyle: "none",
        margin: "8px 0 0",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {list.map((row) => (
        <li
          key={row.activity_id || `${row.kind}:${row.source_id}`}
          style={{
            fontSize: 13,
            fontWeight: 650,
            lineHeight: 1.35,
            color: "#86EFAC",
          }}
        >
          {row.line}
        </li>
      ))}
    </ul>
  );
}
