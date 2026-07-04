import { useEffect } from "react";
import { useConsumer } from "../context/ConsumerContext.jsx";

export default function ConsumerSessionToast() {
  const { authToast, clearAuthToast } = useConsumer();

  useEffect(() => {
    if (!authToast) return undefined;
    const timer = window.setTimeout(() => clearAuthToast(), 6000);
    return () => window.clearTimeout(timer);
  }, [authToast, clearAuthToast]);

  if (!authToast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 1500,
        maxWidth: "min(360px, calc(100vw - 36px))",
        borderRadius: 14,
        background: "#121A14",
        color: "#FFFFFF",
        padding: "12px 14px",
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1.45,
        border: "1px solid #1F2937",
        boxShadow: "0 18px 40px rgba(15,23,42,0.24)",
      }}
    >
      {authToast}
    </div>
  );
}
