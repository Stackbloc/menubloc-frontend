import { useMemo, useState } from "react";
import ShareModal from "../../../components/share/ShareModal.jsx";
import { buildMenuplyPathShareData } from "../../../lib/diningCrewInviteShare.js";
import * as s from "./monthInFoodStyles.js";

export default function MonthInFoodFooter({ sharePath, isSelf }) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareData = useMemo(() => {
    if (!sharePath) return null;
    return buildMenuplyPathShareData(sharePath, {
      title: "My Month in Food on Menuply",
      text: "Great food. Good people. Better together.",
    });
  }, [sharePath]);

  const qrSrc = shareData?.url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareData.url)}`
    : "";

  if (!isSelf || !shareData) return null;

  return (
    <footer style={s.footer} data-testid="month-in-food-footer">
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontWeight: 800, letterSpacing: "0.04em" }}>MENUPLY</div>
        <p style={s.footerTag}>Great food. Good people. Better together.</p>
        <p style={{ margin: "8px 0 0", fontSize: 12, opacity: 0.85 }}>Made with ♥ on Menuply</p>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          style={{
            marginTop: 12,
            background: "#fff",
            color: s.FOREST,
            border: "none",
            borderRadius: 999,
            padding: "8px 14px",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Copy Link
        </button>
      </div>
      {qrSrc ? (
        <div style={s.qrBox}>
          <img src={qrSrc} alt="QR code for this Month in Food page" width={96} height={96} />
        </div>
      ) : null}
      {shareOpen && shareData ? (
        <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} shareData={shareData} />
      ) : null}
    </footer>
  );
}
