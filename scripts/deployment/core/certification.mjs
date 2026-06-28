import { createHash } from "node:crypto";

export const CERTIFICATION_DIMENSIONS = Object.freeze(["frontend", "backend", "database", "configuration", "smoke_tests", "watchdog", "release_registry", "business_status"]);
export function certifyRelease({ environment, candidateDeploymentId, results, evidence = {} }) {
  const normalized = Object.fromEntries(CERTIFICATION_DIMENSIONS.map((name) => [name, results?.[name] === "PASS" ? "PASS" : "FAIL"]));
  const certification = CERTIFICATION_DIMENSIONS.every((name) => normalized[name] === "PASS") ? "CERTIFIED" : "NOT CERTIFIED";
  const unsigned = { schema_version: 1, generated_at: new Date().toISOString(), environment, candidate_deployment_id: candidateDeploymentId, certification, results: normalized, evidence };
  return { ...unsigned, certification_hash: createHash("sha256").update(JSON.stringify(unsigned)).digest("hex") };
}
export function assertCertified(certificate, { environment, candidateDeploymentId }) {
  if (certificate?.certification !== "CERTIFIED") throw new Error("release is NOT CERTIFIED");
  if (certificate.environment !== environment || certificate.candidate_deployment_id !== candidateDeploymentId) throw new Error("release certification identity mismatch");
  for (const dimension of CERTIFICATION_DIMENSIONS) if (certificate.results?.[dimension] !== "PASS") throw new Error(`certification dimension failed: ${dimension}`);
  return true;
}
