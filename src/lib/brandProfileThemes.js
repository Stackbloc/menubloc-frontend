/**
 * Brand color themes for well-known national chains on the public profile page.
 *
 * Display-only: never saved to a restaurant and never offered in the owner
 * style picker. An owner's manual profile_style_key still wins.
 * Matched by exact brand name (store name or brand_profile.name), so an
 * independent restaurant only gets a brand look if its name IS the brand.
 */

import { svgDataUri } from "./restaurantProfileStyles.js";

/** Subtle dot + dash motif in the brand's colors (no logos). */
function patternBrandDots(primary, secondary, opacity = 0.3) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="8" cy="8" r="1.8" fill="${primary}" fill-opacity="${opacity}"/><circle cx="24" cy="24" r="1.8" fill="${secondary}" fill-opacity="${opacity}"/><path d="M21 9h6M5 23h6" stroke="${primary}" stroke-opacity="${opacity * 0.6}" stroke-width="1.2" stroke-linecap="round"/></svg>`
  );
}

/**
 * hero: [from, via, to] gradient stops behind the white hero text.
 * page: light page tint. primary/secondary: brand colors.
 */
function brandTheme({ name, hero, page, primary, secondary, border, buttonText = "#ffffff" }) {
  return {
    name,
    pageBackground: page,
    backgroundPattern: patternBrandDots(primary, secondary),
    accent: primary,
    sectionLabel: primary,
    cardBorder: border,
    cardShadow: "0 1px 3px rgba(28,25,23,0.08)",
    buttonBackground: primary,
    buttonText,
    hero,
  };
}

/** @type {Record<string, ReturnType<typeof brandTheme>>} */
export const BRAND_PROFILE_THEMES = {
  ihop: brandTheme({
    name: "IHOP",
    hero: ["#00305f", "#00529b", "#002a52"],
    page: "#e7eef7",
    primary: "#00529b",
    secondary: "#e31837",
    border: "#bccde3",
  }),
  starbucks: brandTheme({
    name: "Starbucks",
    hero: ["#1e3932", "#00704a", "#14261f"],
    page: "#e8f1ed",
    primary: "#00704a",
    secondary: "#1e3932",
    border: "#b9d3c7",
  }),
  mcdonalds: brandTheme({
    name: "McDonald's",
    hero: ["#a31f15", "#da291c", "#8a1a12"],
    page: "#fff5d6",
    primary: "#c8231a",
    secondary: "#ffc72c",
    border: "#f1d98a",
  }),
  burgerking: brandTheme({
    name: "Burger King",
    hero: ["#502314", "#a52a0c", "#3d1a0f"],
    page: "#f5ebdc",
    primary: "#d62300",
    secondary: "#ff8732",
    border: "#e2cfb4",
  }),
  wendys: brandTheme({
    name: "Wendy's",
    hero: ["#a8142c", "#e2203d", "#8c1024"],
    page: "#fdeef0",
    primary: "#c8102e",
    secondary: "#199fda",
    border: "#f2c4cc",
  }),
  tacobell: brandTheme({
    name: "Taco Bell",
    hero: ["#3d1150", "#702082", "#2e0c3d"],
    page: "#f3eaf6",
    primary: "#702082",
    secondary: "#a77bca",
    border: "#d9c3e3",
  }),
  chickfila: brandTheme({
    name: "Chick-fil-A",
    hero: ["#a8102a", "#dd0031", "#8a0d22"],
    page: "#fdedf0",
    primary: "#c8102e",
    secondary: "#3e5d8f",
    border: "#f2c2cb",
  }),
  subway: brandTheme({
    name: "Subway",
    hero: ["#005e10", "#008c15", "#004a0c"],
    page: "#fff8d9",
    primary: "#00800f",
    secondary: "#ffc600",
    border: "#e8dc9a",
  }),
  kfc: brandTheme({
    name: "KFC",
    hero: ["#a3001f", "#e4002b", "#7d0018"],
    page: "#fdecee",
    primary: "#c8102e",
    secondary: "#202124",
    border: "#f1c0c7",
  }),
  popeyes: brandTheme({
    name: "Popeyes",
    hero: ["#a83a0a", "#e05a12", "#7d2b08"],
    page: "#fff1e3",
    primary: "#c94d0f",
    secondary: "#ff7d00",
    border: "#f4cfa8",
  }),
  dominos: brandTheme({
    name: "Domino's",
    hero: ["#004466", "#006491", "#00334d"],
    page: "#e6f0f5",
    primary: "#006491",
    secondary: "#e31837",
    border: "#b8d1de",
  }),
  pizzahut: brandTheme({
    name: "Pizza Hut",
    hero: ["#8f0a1c", "#c8102e", "#6e0815"],
    page: "#fcecec",
    primary: "#c8102e",
    secondary: "#202124",
    border: "#efc0c3",
  }),
  dunkin: brandTheme({
    name: "Dunkin'",
    hero: ["#b8136a", "#da1884", "#e0571a"],
    page: "#fff0e6",
    primary: "#c2156f",
    secondary: "#ff671f",
    border: "#f5ccb3",
  }),
  chipotle: brandTheme({
    name: "Chipotle",
    hero: ["#2e0d00", "#451400", "#6b1210"],
    page: "#f5ede4",
    primary: "#a81612",
    secondary: "#451400",
    border: "#e0cdb8",
  }),
  pandaexpress: brandTheme({
    name: "Panda Express",
    hero: ["#9c1424", "#d02031", "#7a0f1c"],
    page: "#fcebec",
    primary: "#c01d2d",
    secondary: "#202124",
    border: "#efc1c5",
  }),
  innoutburger: brandTheme({
    name: "In-N-Out Burger",
    hero: ["#a8121a", "#e21b23", "#86090f"],
    page: "#fff7d6",
    primary: "#c8161e",
    secondary: "#ffcb05",
    border: "#efdc94",
  }),
  jackinthebox: brandTheme({
    name: "Jack in the Box",
    hero: ["#a3102a", "#e21836", "#7d0c20"],
    page: "#fdedf0",
    primary: "#c8102e",
    secondary: "#202124",
    border: "#f1c2cb",
  }),
  carlsjr: brandTheme({
    name: "Carl's Jr.",
    hero: ["#a81b13", "#e1251b", "#86150f"],
    page: "#fff7d6",
    primary: "#c8201a",
    secondary: "#ffc600",
    border: "#efdb94",
  }),
  elpolloloco: brandTheme({
    name: "El Pollo Loco",
    hero: ["#a8121a", "#e31837", "#c2410c"],
    page: "#fff4e0",
    primary: "#c8161e",
    secondary: "#ffb81c",
    border: "#f2d6a6",
  }),
  dennys: brandTheme({
    name: "Denny's",
    hero: ["#9e1220", "#d3192b", "#7c0e19"],
    page: "#fff8d6",
    primary: "#c3172a",
    secondary: "#ffd400",
    border: "#efdf94",
  }),
  panerabread: brandTheme({
    name: "Panera Bread",
    hero: ["#33461f", "#4e6b33", "#283818"],
    page: "#f0f1e6",
    primary: "#4e6b33",
    secondary: "#c8a24a",
    border: "#d3d8bd",
  }),
  raisingcanes: brandTheme({
    name: "Raising Cane's",
    hero: ["#8f0a1c", "#c8102e", "#6e0815"],
    page: "#fff8d9",
    primary: "#c8102e",
    secondary: "#ffd100",
    border: "#efdf98",
  }),
  fiveguys: brandTheme({
    name: "Five Guys",
    hero: ["#a31f15", "#da291c", "#8a1a12"],
    page: "#fbeeee",
    primary: "#c8231a",
    secondary: "#202124",
    border: "#efc6c2",
  }),
  shakeshack: brandTheme({
    name: "Shake Shack",
    hero: ["#1a1a1a", "#2b3a1a", "#111111"],
    page: "#eef4e4",
    primary: "#4a7c12",
    secondary: "#7ab800",
    border: "#cfdcb8",
  }),
  sonic: brandTheme({
    name: "Sonic",
    hero: ["#004a80", "#0067b1", "#003a66"],
    page: "#e6f0f8",
    primary: "#0067b1",
    secondary: "#e31837",
    border: "#b8d0e6",
  }),
  arbys: brandTheme({
    name: "Arby's",
    hero: ["#a0131a", "#d71920", "#7c0f14"],
    page: "#fbeeee",
    primary: "#c8161e",
    secondary: "#202124",
    border: "#efc4c4",
  }),
  dairyqueen: brandTheme({
    name: "Dairy Queen",
    hero: ["#005a96", "#007dc5", "#c8231a"],
    page: "#e9f2f9",
    primary: "#0069a8",
    secondary: "#ee3124",
    border: "#bcd5e8",
  }),
  wingstop: brandTheme({
    name: "Wingstop",
    hero: ["#004d29", "#006938", "#003a1f"],
    page: "#e8f2ec",
    primary: "#006938",
    secondary: "#202124",
    border: "#b9d4c4",
  }),
  papajohns: brandTheme({
    name: "Papa John's",
    hero: ["#00472e", "#006341", "#a50f24"],
    page: "#ecf3ef",
    primary: "#006341",
    secondary: "#cf102d",
    border: "#bfd6ca",
  }),
  jerseymikes: brandTheme({
    name: "Jersey Mike's",
    hero: ["#002b75", "#003da5", "#00215a"],
    page: "#e8edf7",
    primary: "#003da5",
    secondary: "#e31837",
    border: "#bccbe5",
  }),
  littlecaesars: brandTheme({
    name: "Little Caesars",
    hero: ["#b84a00", "#e85d04", "#8f3a00"],
    page: "#fff1e5",
    primary: "#c75100",
    secondary: "#202124",
    border: "#f3d0b0",
  }),
  krispykreme: brandTheme({
    name: "Krispy Kreme",
    hero: ["#00512f", "#006f44", "#a5002a"],
    page: "#ebf3ee",
    primary: "#006f44",
    secondary: "#d50032",
    border: "#bfd7ca",
  }),
  timhortons: brandTheme({
    name: "Tim Hortons",
    hero: ["#8f0a1c", "#c8102e", "#6e0815"],
    page: "#fbeeee",
    primary: "#c8102e",
    secondary: "#4a2c20",
    border: "#efc4c4",
  }),
  whataburger: brandTheme({
    name: "Whataburger",
    hero: ["#b84a00", "#f26b0f", "#8f3a00"],
    page: "#fff2e6",
    primary: "#c75100",
    secondary: "#202124",
    border: "#f3d1b2",
  }),
  applebees: brandTheme({
    name: "Applebee's",
    hero: ["#7a0820", "#ba0c2f", "#5c0618"],
    page: "#f9edef",
    primary: "#ba0c2f",
    secondary: "#4a7c12",
    border: "#ebc3cb",
  }),
  chilis: brandTheme({
    name: "Chili's",
    hero: ["#a8121a", "#e21b23", "#1f5a2c"],
    page: "#fbeeee",
    primary: "#c8161e",
    secondary: "#2e7d32",
    border: "#efc4c4",
  }),
};

/** Name spellings that differ from the key once punctuation is stripped. */
const BRAND_ALIASES = {
  internationalhouseofpancakes: "ihop",
  starbuckscoffee: "starbucks",
  starbucksreserve: "starbucks",
  mcdonald: "mcdonalds",
  wendy: "wendys",
  chickfilarestaurant: "chickfila",
  kentuckyfriedchicken: "kfc",
  popeyeslouisianakitchen: "popeyes",
  popeyeschicken: "popeyes",
  dominospizza: "dominos",
  dunkindonuts: "dunkin",
  chipotlemexicangrill: "chipotle",
  innout: "innoutburger",
  carlsjunior: "carlsjr",
  dennysdiner: "dennys",
  panera: "panerabread",
  raisingcaneschickenfingers: "raisingcanes",
  fiveguysburgersandfries: "fiveguys",
  sonicdrivein: "sonic",
  wingstoprestaurant: "wingstop",
  papajohnspizza: "papajohns",
  jerseymikessubs: "jerseymikes",
  littlecaesarspizza: "littlecaesars",
  krispykremedoughnuts: "krispykreme",
  applebeesgrillandbar: "applebees",
  applebeesgrillbar: "applebees",
  chilisgrillandbar: "chilis",
  chilisgrillbar: "chilis",
};

/** "McDonald's - Glendale #4" → "mcdonalds" */
export function normalizeBrandName(name) {
  return String(name || "")
    .split(/\s+[-–—|#(]\s*|\s*#/)[0]
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

export function findBrandProfileTheme(name) {
  const key = normalizeBrandName(name);
  if (!key) return null;
  const resolved = BRAND_ALIASES[key] || key;
  return Object.prototype.hasOwnProperty.call(BRAND_PROFILE_THEMES, resolved)
    ? BRAND_PROFILE_THEMES[resolved]
    : null;
}

/** Brand theme for a public profile payload, or null (manual owner style wins). */
export function resolveBrandProfileTheme(profile) {
  if (!profile) return null;
  if (profile.profile_style_key != null && String(profile.profile_style_key).trim() !== "") {
    return null;
  }
  return (
    findBrandProfileTheme(profile.brand_profile?.name) ||
    findBrandProfileTheme(profile.name)
  );
}
