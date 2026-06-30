import { Link } from "react-router-dom";

export function buildOperatorLoginResumeState({ email, restaurantId, restaurantName }) {
  return {
    email: String(email || "").trim(),
    nextPath: "/operator/menulab",
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
  };
}

const defaultPrimary = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 10,
  background: "#111",
  color: "#fff",
  fontWeight: 700,
  textDecoration: "none",
};

const defaultSecondary = {
  ...defaultPrimary,
  marginTop: 10,
  background: "#fff",
  color: "#111",
  border: "1px solid #d0d5dd",
};

export default function MenuUploadCompletionNextSteps({
  isOperatorFlow,
  restaurantId,
  email = "",
  restaurantName = "",
  primaryStyle = defaultPrimary,
  secondaryStyle = defaultSecondary,
}) {
  if (isOperatorFlow) {
    return (
      <Link to="/operator/menulab" style={primaryStyle}>
        Back to Menu Lab
      </Link>
    );
  }

  const loginState = buildOperatorLoginResumeState({
    email,
    restaurantId,
    restaurantName,
  });

  return (
    <>
      <Link to="/operator/login" state={loginState} style={primaryStyle}>
        Sign in to My Account
      </Link>
      {restaurantId ? (
        <Link
          to={`/public/restaurants/${restaurantId}/menu`}
          style={secondaryStyle}
        >
          Preview your menu
        </Link>
      ) : null}
    </>
  );
}
