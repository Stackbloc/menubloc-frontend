import React from "react";
import { useOperator } from "../../context/OperatorContext.jsx";
import OperatorLayout from "./OperatorLayout.jsx";
import QrStickerPanel from "../../components/qr/QrStickerPanel.jsx";
import {
  activateOperatorQrSticker,
  deactivateOperatorQrSticker,
  downloadOperatorQrStickerUrl,
  getOperatorQrStickers,
  previewOperatorQrStickerUrl,
  replaceOperatorQrSticker,
} from "../../lib/operatorApi.js";

export default function OperatorQrStickers() {
  const { selectedRestaurant, restaurants } = useOperator();
  const restaurantId = selectedRestaurant?.id;
  const role =
    selectedRestaurant?.role ||
    restaurants.find((r) => r.id === restaurantId)?.role ||
    null;
  const canMutate = role === "owner" || role === "manager";

  if (!restaurantId) {
    return (
      <OperatorLayout title="QR Stickers">
        <p style={{ color: "#667085" }}>Select a restaurant from the sidebar to manage sticker QR codes.</p>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="QR Stickers">
      <QrStickerPanel
        restaurantId={restaurantId}
        restaurantName={selectedRestaurant?.restaurant_name}
        canMutate={canMutate}
        subtitle={
          canMutate
            ? "Printed stickers must use /r/DOOR-... URLs. Deactivate/Replace are available for owners and managers."
            : "View-only: ask an owner or manager to deactivate or replace sticker QRs."
        }
        loadQrCodes={() => getOperatorQrStickers(restaurantId)}
        activateSticker={(body) => activateOperatorQrSticker(restaurantId, body)}
        previewUrl={(code) => previewOperatorQrStickerUrl(restaurantId, code)}
        downloadUrl={(code) => downloadOperatorQrStickerUrl(restaurantId, code)}
        deactivateQr={(code) => deactivateOperatorQrSticker(restaurantId, code)}
        replaceQr={(code) => replaceOperatorQrSticker(restaurantId, code)}
      />
      <p style={{ fontSize: 12, color: "#8a9ab0", marginTop: 20 }}>
        Legacy digital QR codes (/qr/:token) are managed separately under Help → QR Codes. Physical stickers use this page only.
      </p>
    </OperatorLayout>
  );
}
