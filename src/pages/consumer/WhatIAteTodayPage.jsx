/**
 * What I Ate — full-page food diary with calendar + meal slots.
 */

import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import StickyPageHeader from "../../components/StickyPageHeader.jsx";
import BottomNav from "../../components/BottomNav.jsx";
import WhatIAteTodaySection from "../../components/consumer/WhatIAteTodaySection.jsx";
import { useConsumer } from "../../context/ConsumerContext.jsx";

export default function WhatIAteTodayPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useConsumer();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent("/account/what-i-ate")}`, {
        replace: true,
      });
    }
  }, [authLoading, isAuthenticated, navigate]);

  return (
    <>
      <StickyPageHeader title="What I Ate" />
      <div style={styles.page} data-testid="what-i-ate-today-page">
        {!authLoading && isAuthenticated ? (
          <WhatIAteTodaySection layout="page" last />
        ) : (
          <p style={styles.muted}>{authLoading ? "Loading…" : "Sign in to use your food diary."}</p>
        )}
        <p style={styles.back}>
          <Link to="/account?tab=social" style={styles.link}>
            Back to Account
          </Link>
        </p>
      </div>
      <BottomNav />
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--gb-color-page, #f8fafc)",
    fontFamily: "Inter, Arial, sans-serif",
    padding: "16px 16px calc(var(--bottom-nav-h, 72px) + 16px)",
    maxWidth: 960,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  muted: { fontSize: 14, color: "#64748b", margin: 0 },
  back: { marginTop: 24 },
  link: { color: "#0f766e", fontWeight: 600, textDecoration: "none" },
};
