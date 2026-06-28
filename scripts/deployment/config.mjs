import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const FRONTEND = Object.freeze({
  repoPath: process.env.DEPLOYMENT_REPOSITORY_ROOT || REPOSITORY_ROOT,
  remote: "https://github.com/Stackbloc/menubloc-frontend.git",
  branch: "main",
  platform: "vercel",
  projectName: "menubloc-frontend",
  projectId: "prj_xvvxrY8NnlHMSTrQCMM4I4fNoUxu",
  productionDomain: "menuply.com",
  productionAliases: ["menuply.com", "www.menuply.com"],
  buildArtifact: ".vercel/output/static/index.html",
  viteManifest: ".vercel/output/static/.vite/manifest.json",
  requiredEnv: ["VITE_API_BASE_URL"],
  operationsDocsPath: process.env.DEPLOYMENT_OPERATIONS_DIR || resolve(REPOSITORY_ROOT, "docs"),
});

export const PRODUCTION_ENDPOINTS = ["/", "/search", "/browse", "/owner", "/api/health"];
