#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FRONTEND } from "./config.mjs";
import { abort, git } from "./lib.mjs";
import { VercelDeploymentEngine } from "./deploymentEngine.mjs";
import { guardFrontendArtifact, runFrontendPreflight } from "./deploymentGuard.mjs";
import { runSmokeTests } from "./smokeTestRunner.mjs";
import { writeIncidentFiles } from "./core/incidentRecorder.mjs";
import { executeBlueGreenRelease } from "./blueGreenManager.mjs";
import { FreezeStore } from "./core/freezeStore.mjs";
import { ReleaseRegistry } from "./core/releaseRegistry.mjs";
import { assertCertified, certifyRelease } from "./core/certification.mjs";

const environment = process.argv[2];
if (!new Set(["production", "preview"]).has(environment)) abort(`environment must be production or preview; found ${environment || "missing"}`);
const allowDirty = process.argv.includes("--allow-dirty") && process.env.ALLOW_DIRTY_DEPLOY === "1";

let releaseRecord;
let releaseRegistryWritten = false;
const engine = new VercelDeploymentEngine(FRONTEND);
const freezeStore = new FreezeStore(join(FRONTEND.operationsDocsPath, "deployments/deployment-control.jsonl"));
const registry = new ReleaseRegistry(join(FRONTEND.operationsDocsPath, "deployments/registry"));
function certificationProvider(green) {
  return async (greenTests) => {
    const attestationPath = process.env.RELEASE_ATTESTATION_FILE;
    if (!attestationPath) throw new Error("RELEASE_ATTESTATION_FILE is required for production certification");
    const attestation = JSON.parse(readFileSync(attestationPath, "utf8"));
    assertCertified(attestation, { environment: "staging", candidateDeploymentId: attestation.candidate_deployment_id });
    const head = git(["rev-parse", "HEAD"]);
    if (attestation.evidence?.frontend_commit !== head) throw new Error("staging certification does not match frontend HEAD");
    const certificate = certifyRelease({ environment: "production", candidateDeploymentId: green.id, results: { ...attestation.results, frontend: "PASS", smoke_tests: greenTests.every((item) => item.pass) ? "PASS" : "FAIL" }, evidence: { ...attestation.evidence, green_url: green.url } });
    assertCertified(certificate, { environment: "production", candidateDeploymentId: green.id });
    return certificate;
  };
}
function writeReleaseRecord(record) {
  mkdirSync("docs/deployments", { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `docs/deployments/${stamp}_frontend-blue-green.json`;
  writeFileSync(path, `${JSON.stringify({ recorded_at: new Date().toISOString(), ...record }, null, 2)}\n`);
  console.log(`Deployment record: ${path}`);
}

try {
  if (environment === "production") freezeStore.assertDeployAllowed();
  runFrontendPreflight(FRONTEND, environment, { allowDirty });
  let blue;
  if (environment === "production") {
    blue = engine.inspect(FRONTEND.productionDomain);
    console.log(`BLUE deployment: ${blue.url} (${blue.id || "id unavailable"})`);
  }
  engine.build(environment);
  guardFrontendArtifact(FRONTEND);
  const deploymentUrl = engine.deployGreen(environment);
  const green = engine.inspect(deploymentUrl);
  console.log(`GREEN deployment: ${green.url} (${green.id || "id unavailable"})`);
  const results = environment === "preview" ? await runSmokeTests(deploymentUrl, { attempts: 6, retryDelayMs: 5000 }) : [];
  const failures = results.filter((result) => !result.pass);
  if (failures.length) {
    writeIncidentFiles(results, "docs/incidents", "candidate rejected; production alias unchanged");
    if (releaseRecord) writeReleaseRecord(releaseRecord);
    abort(`candidate smoke tests failed: ${failures.map((f) => `${f.endpoint}=${f.failure_type}`).join(", ")}`);
  }
  if (environment === "production") {
    guardFrontendArtifact(FRONTEND);
    releaseRecord = await executeBlueGreenRelease({
      blue,
      green,
      aliases: FRONTEND.productionAliases,
      probeImpl: (url) => runSmokeTests(url, { attempts: 6, retryDelayMs: 5000 }),
      aliasImpl: async (target, alias) => engine.alias(target, alias),
      certifyImpl: certificationProvider(green),
    });
    writeReleaseRecord(releaseRecord);
    registry.append({ release_type: "frontend-only", environment, certification: releaseRecord.certification.certification, status: "healthy", frontend: { commit: git(["rev-parse", "HEAD"]), deployment_id: releaseRecord.green_deployment_id, deployment_url: releaseRecord.green_deployment_url, blue_deployment_id: releaseRecord.blue_deployment_id, build_timestamp: releaseRecord.alias_switch_time }, smoke_tests: [...releaseRecord.green_tests, ...releaseRecord.production_tests], rollback_status: releaseRecord.rollback_status });
    releaseRegistryWritten = true;
    console.log(`Production aliases switched to healthy GREEN: ${FRONTEND.productionAliases.join(", ")}`);
  } else console.log(`Preview deployment healthy: ${deploymentUrl}`);
} catch (error) {
  if (error.releaseRecord) {
    error.releaseRecord.green_tests ||= [];
    writeReleaseRecord(error.releaseRecord);
    writeIncidentFiles([...(error.releaseRecord.green_tests || []), ...(error.releaseRecord.production_tests || [])], "docs/incidents", `production failed; rollback status=${error.releaseRecord.rollback_status}`);
  }
  if (environment === "production" && !releaseRegistryWritten) {
    const failure = { timestamp: new Date().toISOString(), endpoint: "frontend-deploy", status: 0, failure_type: error.code || "frontend_deployment_failed", deployment_id: error.releaseRecord?.green_deployment_id || "", body_excerpt: error.message, pass: false };
    const incidentFiles = writeIncidentFiles([failure], "docs/incidents", "deployment frozen; BLUE preserved");
    freezeStore.append("freeze", `${failure.failure_type}: ${error.message}`, "frontend-deploy");
    registry.append({ release_type: "frontend-only", environment, status: "failed_frozen", frontend: error.releaseRecord ? { deployment_id: error.releaseRecord.green_deployment_id, blue_deployment_id: error.releaseRecord.blue_deployment_id } : null, incident_ids: incidentFiles, rollback_status: error.releaseRecord?.rollback_status || "blue_unchanged" });
  }
  if (error.exitCode) process.exit(error.exitCode);
  console.error(`ABORT DEPLOYMENT: ${error.message}`);
  process.exit(1);
}
