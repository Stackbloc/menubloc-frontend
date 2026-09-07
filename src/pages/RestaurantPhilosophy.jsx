import { useLocation, Navigate } from "react-router-dom";

const PLAN_ROUTE = "/restaurant/signup";

/**
 * Legacy philosophy / sales pitch route.
 * Restaurant onboarding messaging survey (2026-09-07): invite only — no long pitch.
 * Preserve claim / router state when redirecting to the invitation signup.
 */
export default function RestaurantPhilosophy() {
  const location = useLocation();
  return <Navigate to={PLAN_ROUTE} replace state={location.state} />;
}
