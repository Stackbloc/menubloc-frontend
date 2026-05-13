const TYPE_META = {
  deal:         { label: "Deal",    grad: "linear-gradient(135deg,#92400e,#b45309)" },
  event:        { label: "Event",   grad: "linear-gradient(135deg,#4c1d95,#6d28d9)" },
  menu:         { label: "New",     grad: "linear-gradient(135deg,#1e3a5f,#1d4ed8)" },
  notice:       { label: "Notice",  grad: "linear-gradient(135deg,#7f1d1d,#dc2626)" },
  announcement: { label: "Update",  grad: "linear-gradient(135deg,#14532d,#15803d)" },
  general:      { label: "Post",    grad: "linear-gradient(135deg,#1e293b,#475569)" },
};

function getTypeMeta(postType) {
  return TYPE_META[postType] || TYPE_META.general;
}

function BillboardCard({ post, isDark, isMobile }) {
  const meta = getTypeMeta(post.post_type);
  const headline = post.headline_override || post.title || "";
  const sub = post.subheadline_override || (post.body ? post.body.slice(0, 72) : null);
  const hasSub = Boolean(sub && sub.trim());
  const hasImage = Boolean(post.image_url);
  const hasCta = Boolean(post.cta_label);

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e2e8f0",
        background: isDark ? "#16181e" : "#ffffff",
        boxShadow: isDark
          ? "0 4px 16px rgba(0,0,0,0.30)"
          : "0 4px 14px rgba(15,23,42,0.07)",
        display: "flex",
        flexDirection: "column",
        width: isMobile ? 220 : undefined,
        flexShrink: isMobile ? 0 : undefined,
      }}
    >
      {/* Image / gradient area */}
      <div
        style={{
          height: 88,
          background: hasImage ? "#000" : meta.grad,
          position: "relative",
          flexShrink: 0,
        }}
      >
        {hasImage ? (
          <img
            src={post.image_url}
            alt={post.image_alt_text || headline}
            style={{
              width: "100%",
              height: "100%",
              objectFit: post.image_fit || "cover",
              display: "block",
            }}
          />
        ) : null}
        {/* Type badge overlaid on image/gradient */}
        <span
          style={{
            position: "absolute",
            bottom: 8,
            left: 10,
            display: "inline-flex",
            alignItems: "center",
            height: 20,
            padding: "0 8px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.52)",
            backdropFilter: "blur(4px)",
            color: "#ffffff",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {meta.label}
        </span>
      </div>

      {/* Content area */}
      <div
        style={{
          padding: "10px 12px 12px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.3,
            color: isDark ? "#f1f5f9" : "#0f172a",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {headline}
        </div>

        {hasSub ? (
          <div
            style={{
              fontSize: 11,
              lineHeight: 1.4,
              color: isDark ? "rgba(255,255,255,0.45)" : "#64748b",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </div>
        ) : null}

        {hasCta ? (
          <div style={{ marginTop: "auto", paddingTop: 6 }}>
            {post.cta_url ? (
              <a
                href={post.cta_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 26,
                  padding: "0 10px",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid #e2e8f0",
                }}
              >
                {post.cta_label}
              </a>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 26,
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? "rgba(255,255,255,0.40)" : "#94a3b8",
                }}
              >
                {post.cta_label}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RestaurantBillboardStrip({ posts, isDark, isMobile, muted }) {
  const visible = (posts || []).slice(0, 4);

  if (visible.length === 0) {
    return (
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
          border: isDark
            ? "1px dashed rgba(255,255,255,0.12)"
            : "1px dashed #cbd5e1",
          color: muted,
          fontSize: 14,
        }}
      >
        No billboard posts yet.
      </div>
    );
  }

  const colCount = Math.min(visible.length, 2);

  return (
    <div
      style={
        isMobile
          ? {
              display: "flex",
              gap: 10,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              paddingBottom: 4,
            }
          : {
              display: "grid",
              gridTemplateColumns: `repeat(${colCount}, 1fr)`,
              gap: 10,
            }
      }
    >
      {visible.map((post) => (
        <div
          key={post.id}
          style={isMobile ? { scrollSnapAlign: "start" } : undefined}
        >
          <BillboardCard post={post} isDark={isDark} isMobile={isMobile} />
        </div>
      ))}
    </div>
  );
}
