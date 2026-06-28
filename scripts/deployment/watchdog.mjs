#!/usr/bin/env node
import { resolve } from "node:path";
import { probe } from "./probe.mjs";
import { writeIncidentFiles } from "./core/incidentRecorder.mjs";

const baseUrl = process.env.WATCHDOG_BASE_URL || "https://menuply.com";
const outputDir = resolve(process.env.WATCHDOG_INCIDENT_DIR || "docs/incidents");
const results = await probe(baseUrl);
for (const result of results) console.log(JSON.stringify(result));
const files = writeIncidentFiles(results, outputDir, "GitHub Actions watchdog failed and incident artifact was created");
if (files.length) {
  console.error(`WATCHDOG FAILED: ${results.filter((r) => !r.pass).length} endpoint(s) unhealthy; incident files: ${files.join(", ")}`);
  process.exit(1);
}
console.log("WATCHDOG PASSED");
