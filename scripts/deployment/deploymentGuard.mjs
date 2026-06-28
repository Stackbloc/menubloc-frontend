import { requireRepo, requireVercelEnvironment, requireVercelProject, verifyFrontendArtifact } from "./lib.mjs";

export function runFrontendPreflight(config, environment, { allowDirty = false } = {}) {
  requireRepo(config, { allowDirty, branch: environment === "production" ? config.branch : null });
  requireVercelProject(config);
  requireVercelEnvironment(config, environment);
}
export function guardFrontendArtifact(config) { verifyFrontendArtifact(config); }
