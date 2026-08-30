import base from "./playwright.config.js";

/** Local dev / preview E2E — not production menuply.com. */
export default {
  ...base,
  use: {
    ...base.use,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
  },
};
