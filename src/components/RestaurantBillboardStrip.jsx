import { useLanguage } from "../context/LanguageContext.jsx";
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

// ── Primary "window poster" card ───────────────────────────────────────────
// Proportions of a physical restaurant window notice — compact, image-forward,
// content anchored to the bottom-left like a real posted sign.
function PrimaryBillboardCard({ post, isDark }) {
  const meta = getTypeMeta(post.post_type);
  const headline = post.headline_override || post.title || "";
  const sub = post.subheadline_override || (post.body ? post.body.slice(0, 80) : null);
  const hasImage = Boolean(post.image_url);
  const hasCta = Boolean(post.cta_label);

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        height: 182,
        background: hasImage ? "#111" : meta.grad,
        border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e2e8f0",
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.35)"
          : "0 4px 16px rgba(15,23,42,0.09)",
      }}
    >
      {/* Full-bleed image */}
      {hasImage && (
        <img
          src={post.image_url}
          alt={post.image_alt_text || headline}
          loading="eager"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: post.image_fit || "cover",
            display: "block",
          }}
        />
      )}

      {/* Bottom gradient scrim — keeps text readable over any image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hasImage
            ? "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.30) 52%, rgba(0,0,0,0.04) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.38) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Type badge — top-left, small pill */}
      <span
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          display: "inline-flex",
          alignItems: "center",
          height: 20,
          padding: "0 8px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.48)",
          backdropFilter: "blur(6px)",
          color: "#ffffff",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {meta.label}
      </span>

      {/* Content anchored to bottom-left — poster proportions */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 14px 13px",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.32,
            color: "#ffffff",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: hasImage ? "0 1px 4px rgba(0,0,0,0.5)" : "none",
            marginBottom: hasCta ? 8 : 0,
          }}
        >
          {headline}
        </div>

        {!hasCta && sub && (
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.72)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 3,
            }}
          >
            {sub}
          </div>
        )}

        {hasCta && (
          post.cta_url ? (
            <a
              href={post.cta_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 28,
                padding: "0 11px",
                borderRadius: 7,
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 700,
                background: "rgba(255,255,255,0.92)",
                color: "#0f172a",
                boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
              }}
            >
              {post.cta_label}
            </a>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 28,
                padding: "0 11px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                background: "rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.90)",
              }}
            >
              {post.cta_label}
            </span>
          )
        )}
      </div>
    </div>
  );
}

// ── Secondary carousel card ────────────────────────────────────────────────
function BillboardCard({ post, isDark }) {
  const meta = getTypeMeta(post.post_type);
  const headline = post.headline_override || post.title || "";
  const sub = post.subheadline_override || (post.body ? post.body.slice(0, 60) : null);
  const hasSub = Boolean(sub && sub.trim());
  const hasImage = Boolean(post.image_url);
  const hasCta = Boolean(post.cta_label);

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e2e8f0",
        background: isDark ? "#16181e" : "#ffffff",
        boxShadow: isDark
          ? "0 4px 16px rgba(0,0,0,0.30)"
          : "0 4px 14px rgba(15,23,42,0.07)",
        display: "flex",
        flexDirection: "column",
        width: 160,
        flexShrink: 0,
      }}
    >
      {/* Image / gradient area */}
      <div
        style={{
          height: 96,
          background: hasImage ? "#000" : meta.grad,
          position: "relative",
          flexShrink: 0,
        }}
      >
        {hasImage ? (
          <img
            src={post.image_url}
            alt={post.image_alt_text || headline}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: post.image_fit || "cover",
              display: "block",
            }}
          />
        ) : null}
        <span
          style={{
            position: "absolute",
            bottom: 7,
            left: 9,
            display: "inline-flex",
            alignItems: "center",
            height: 18,
            padding: "0 7px",
            borderRadius: 999,
            background: "rgba(0,0,0,0.52)",
            backdropFilter: "blur(4px)",
            color: "#ffffff",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {meta.label}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          padding: "9px 10px 10px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 12,
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

        {hasSub && !hasCta ? (
          <div
            style={{
              fontSize: 10,
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
          <div style={{ marginTop: "auto", paddingTop: 5 }}>
            {post.cta_url ? (
              <a
                href={post.cta_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 24,
                  padding: "0 9px",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: 10,
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
                  fontSize: 10,
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

// ── Strip ──────────────────────────────────────────────────────────────────
export default function RestaurantBillboardStrip({ posts, isDark, isMobile, muted }) {
  const { t } = useLanguage();
  const all = (posts || []).slice(0, 6);

  if (all.length === 0) {
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

  // Primary: prefer is_primary_search_billboard flag, otherwise first in array
  const primaryIdx = all.findIndex(p => p.is_primary_search_billboard);
  const primary = primaryIdx >= 0 ? all[primaryIdx] : all[0];
  const secondary = all.filter(p => p.id !== primary.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <PrimaryBillboardCard post={primary} isDark={isDark} />

      {secondary.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 4,
            // Partial card visible on the right signals "more to scroll"
            paddingRight: secondary.length > 2 ? 20 : 0,
          }}
        >
          {secondary.map((post) => (
            <div key={post.id} style={{ scrollSnapAlign: "start" }}>
              <BillboardCard post={post} isDark={isDark} isMobile={isMobile} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
