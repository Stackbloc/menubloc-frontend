import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function incidentEvent(result, actionTaken) {
  return {
    timestamp: result.timestamp || new Date().toISOString(),
    endpoint: result.endpoint || "deployment-system",
    status: Number(result.status || 0),
    failure_type: result.failure_type || "unknown_failure",
    deployment_id: result.deployment_id || "",
    vercel_id: result.vercel_id || "",
    body_excerpt: String(result.body_excerpt || "").slice(0, 1000),
    action_taken: actionTaken,
  };
}

export function writeIncidentFiles(results, outputDir, actionTaken = "deployment marked unhealthy") {
  const failed = results.filter((result) => !result.pass).map((result) => incidentEvent(result, actionTaken));
  if (!failed.length) return [];
  mkdirSync(outputDir, { recursive: true });
  const date = failed[0].timestamp.slice(0, 10);
  const jsonlPath = join(outputDir, `${date}_production-health.jsonl`);
  for (const event of failed) appendFileSync(jsonlPath, `${JSON.stringify(event)}\n`, { flag: "a" });
  const artifactPath = join(outputDir, `incident-${Date.now()}.json`);
  writeFileSync(artifactPath, `${JSON.stringify({ generated_at: new Date().toISOString(), failures: failed }, null, 2)}\n`, { flag: "wx" });
  return [jsonlPath, artifactPath];
}
