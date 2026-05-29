export const JOIN_MARKETS = {
  generic: {
    market: null,
    city: null,
    state: null,
    state_code: null,
    signup_source: "join_generic",
    headlineLocation: "your area",
    signupHref: "/restaurant/signup/free-profile",
  },
  losangeles: {
    market: "losangeles",
    city: "Los Angeles",
    state: "California",
    state_code: "CA",
    signup_source: "join_losangeles",
    headlineLocation: "Los Angeles, California",
    signupHref: "/restaurant/signup/free-profile?market=losangeles",
  },
  dothan: {
    market: "dothan",
    city: "Dothan",
    state: "Alabama",
    state_code: "AL",
    signup_source: "join_dothan",
    headlineLocation: "Dothan, Alabama",
    signupHref: "/restaurant/signup/free-profile?market=dothan",
  },
};

export function resolveJoinMarket(marketKey) {
  const key = String(marketKey || "").trim().toLowerCase();
  if (key === "losangeles" || key === "los-angeles") return JOIN_MARKETS.losangeles;
  if (key === "dothan") return JOIN_MARKETS.dothan;
  return JOIN_MARKETS.generic;
}

export function isJoinLandingPath(pathname) {
  const path = String(pathname || "");
  if (path === "/join") return true;
  if (path === "/join/losangeles" || path === "/join/los-angeles" || path === "/join/dothan") return true;
  return false;
}
