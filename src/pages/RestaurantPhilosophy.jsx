import { useNavigate } from "react-router-dom";
import RestaurantOnboardingApproved from "../components/RestaurantOnboardingApproved.jsx";

const PLAN_ROUTE = "/restaurant/signup";

export default function RestaurantPhilosophy() {
  const navigate = useNavigate();

  return <RestaurantOnboardingApproved onContinue={() => navigate(PLAN_ROUTE)} />;
}
