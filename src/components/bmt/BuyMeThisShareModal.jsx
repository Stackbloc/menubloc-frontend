import { useEffect, useMemo, useState } from "react";
import { buildShareLinks, copyText } from "../share/shareUtils.js";

export default function BuyMeThisShareModal({
  open,
  onClose,
  shareUrl,
  requesterName,
  restaurantName,
  expiresAt,
}) {
  const [copied, setCopied] = useState(false);

  const shareData = useMemo(() => ({
    title: `${requesterName || "Someone"} wants this from ${restaurantName || "this restaurant"} on Grubbid`,
    text: "Pay for this order securely on Grubbid before it expires.",
    url: shareUrl,
  }), [requesterName, restaurantName, shareUrl]);

  const links = useMemo(() => buildShareLinks(shareData), [shareData]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return undefined;
    const timeoutId = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  if (!open) return null;

  async function handleCopy() {
    const ok = await copyText(shareUrl);
    if (ok) setCopied(true);
  }

  async function handleNativeShare() {
    if (!navigator.share) return;
    await navigator.share(shareData);
    onClose?.();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        background: "rgba(15,23,42,0.52)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 24,
          background: "#fff",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 28px 72px rgba(15, 23, 42, 0.28)",
          padding: 20,
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share Buy Me This"
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#11211a" }}>Share Buy Me This</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#667085", lineHeight: 1.5 }}>
              Send a payment request link. The order is only created after payment succeeds.
            </div>
          </div>
          <button
            type="button"
            aria-label="Close Buy Me This share options"
            onClick={() => onClose?.()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "1px solid rgba(18, 34, 28, 0.10)",
              background: "#fff",
              color: "#475467",
              fontSize: 18,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {expiresAt ? (
          <div style={{ marginTop: 12, fontSize: 13, color: "#667085", fontWeight: 700 }}>
            Expires {new Date(expiresAt).toLocaleString()}
          </div>
        ) : null}

        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {navigator.share ? (
            <button
              type="button"
              onClick={handleNativeShare}
              style={{
                width: "100%",
                minHeight: 52,
                borderRadius: 16,
                border: "none",
                background: "#11211a",
                color: "#fff",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Share
            </button>
          ) : null}

          <a
            href={links.sms}
            style={{
              width: "100%",
              minHeight: 52,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 16,
              border: "1px solid rgba(18, 34, 28, 0.12)",
              background: "#f8fafc",
              color: "#11211a",
              fontSize: 14,
              fontWeight: 900,
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Send via text
          </a>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              width: "100%",
              minHeight: 52,
              borderRadius: 16,
              border: "1px solid rgba(18, 34, 28, 0.12)",
              background: "#f8fafc",
              color: "#11211a",
              fontSize: 14,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "#98a2b3", lineHeight: 1.45, wordBreak: "break-all" }}>
          {shareUrl}
        </div>
      </div>
    </div>
  );
}
