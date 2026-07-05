import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SmsAuthModal from "../../components/auth/SmsAuthModal.jsx";
import { AuthPageFrame, styles } from "../../components/consumer/ConsumerAuthShared.jsx";

export default function ConsumerSignup() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const next = location.state?.redirectTo;
    return typeof next === "string" && next.trim() ? next : "/";
  }, [location.state]);
  const [smsOpen, setSmsOpen] = useState(false);

  return (
    <>
      <AuthPageFrame
        showLogo
        title="Join Menuply"
        subtitle="Verify your phone number to create your diner account."
        footer={(
          <p style={styles.footer}>
            Already have an account?{" "}
            <Link to="/account/login" style={styles.link}>Sign in</Link>
          </p>
        )}
      >
        <button
          type="button"
          onClick={() => setSmsOpen(true)}
          style={styles.submitButton}
        >
          Sign up with phone number
        </button>
      </AuthPageFrame>

      <SmsAuthModal
        open={smsOpen}
        onClose={() => setSmsOpen(false)}
        onSuccess={() => navigate("/account/welcome", { replace: true, state: { redirectTo } })}
      />
    </>
  );
}
