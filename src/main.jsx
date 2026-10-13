import React from "react";
import ReactDOM from "react-dom/client";
import { Sentry } from "./instrument.js";
import App from "./App.jsx";
import { syncDemoOrderingFromUrl } from "./lib/demoOrdering.js";
import { registerServiceWorker } from "./registerServiceWorker.js";
import "./index.css";

const ProfiledApp = Sentry.withProfiler(App, { name: "Menuply App" });

syncDemoOrderingFromUrl();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProfiledApp />
  </React.StrictMode>
);

registerServiceWorker();
