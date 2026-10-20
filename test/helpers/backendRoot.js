import fs from "node:fs";
import path from "node:path";

/**
 * Backend checkout for cross-repo contract tests. Works from the main folder
 * (menubloc/menubloc-frontend-main → ../menubloc-backend-main) and from a worktree
 * (menubloc/_worktrees/<topic>-fe → ../../menubloc-backend-main). Override with
 * MENUBLOC_BACKEND_ROOT.
 */
export function resolveBackendRoot(frontendRoot) {
  const candidates = [
    process.env.MENUBLOC_BACKEND_ROOT,
    path.join(frontendRoot, "..", "menubloc-backend-main"),
    path.join(frontendRoot, "..", "..", "menubloc-backend-main"),
  ].filter(Boolean);
  return candidates.find((dir) => fs.existsSync(path.join(dir, "package.json"))) || candidates[0];
}
