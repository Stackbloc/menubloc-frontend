import React from "react";
import ReactDOM from "react-dom/client";
import { Sentry } from "./instrument.js";
import App from "./App.jsx";
import { syncDemoOrderingFromUrl } from "./lib/demoOrdering.js";
import { captureInviteCodeFromUrl } from "./lib/pendingInviteCode.js";
import { registerServiceWorker } from "./registerServiceWorker.js";
import "./index.css";

const ProfiledApp = Sentry.withProfiler(App, { name: "Menuply App" });

// Release marker. Changing it gives the entry bundle a new filename, which gets past a stale CDN entry.
document.documentElement.dataset.release = "2026-11-09-b";

syncDemoOrderingFromUrl();
// A friend's Invite friends link (?r=code): remembered for crediting after sign-up (Owner analytics only).
captureInviteCodeFromUrl();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProfiledApp />
  </React.StrictMode>
);

registerServiceWorker();
