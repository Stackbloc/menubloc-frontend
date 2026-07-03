import RestaurantStatusLight from "../RestaurantStatusLight.jsx";

/** Status dot row — placed under the restaurant address on menu headers. */
export default function MenuRestaurantStatusLightLine({
  tone,
  menuStatus,
  profileTier,
  listingStatus,
  planSlug,
  isPro,
  marginTop = 7,
}) {
  return (
    <div
      style={{
        marginTop,
        display: "flex",
        alignItems: "center",
        minHeight: sizeToMinHeight(5),
      }}
    >
      <RestaurantStatusLight
        tone={tone}
        menuStatus={menuStatus}
        profileTier={profileTier}
        listingStatus={listingStatus}
        planSlug={planSlug}
        isPro={isPro}
      />
    </div>
  );
}

function sizeToMinHeight(size) {
  return Math.max(12, Number(size) || 5);
}
