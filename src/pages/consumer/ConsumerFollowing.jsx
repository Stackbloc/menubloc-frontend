import React from "react";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import FollowingFeed from "../../components/consumer/FollowingFeed.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function ConsumerFollowing() {
  const { t } = useLanguage();

  return (
    <>
      <StickyPageHeader title={t("consumer.following.title", "Following")} />
      <div style={{
        minHeight: "100vh",
        background: "var(--gb-color-page)",
        fontFamily: "Inter, Arial, sans-serif",
        padding: "0 0 calc(var(--bottom-nav-h, 72px) + 8px)",
      }}>
        <FollowingFeed />
      </div>
      <BottomNav />
    </>
  );
}
