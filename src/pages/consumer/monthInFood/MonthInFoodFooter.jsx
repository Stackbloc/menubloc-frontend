import { useMemo } from "react";
import ShareButton from "../../../components/share/ShareButton.jsx";
import { buildConsumerPathShareData } from "../../../components/share/shareUtils.js";
import * as s from "./monthInFoodStyles.js";

export default function MonthInFoodFooter({ sharePath, isSelf }) {
  const shareData = useMemo(() => {
    if (!sharePath) return null;
    return buildConsumerPathShareData(sharePath, {
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
        <div style={{ marginTop: 12 }} data-testid="month-in-food-footer-share">
          <ShareButton
            shareData={shareData}
            size="compact"
            tone="ghost"
            label="Share"
            modalTitle="Share Month in Food"
            analyticsContext={{ surface: "month_in_food_footer", path: sharePath }}
          />
        </div>
      </div>
      {qrSrc ? (
        <div style={s.qrBox}>
          <img src={qrSrc} alt="QR code for this Month in Food page" width={96} height={96} />
        </div>
      ) : null}
    </footer>
  );
}
