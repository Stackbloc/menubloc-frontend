import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";

function git(args, fallback = "") {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

const outputPath = resolve(process.argv[2] || "dist/build-info.json");
const status = git(["status", "--porcelain"]);

const info = {
  git_sha: git(["rev-parse", "HEAD"], null),
  branch: git(["branch", "--show-current"], null) || null,
  dirty_state: status ? "dirty" : "clean",
  build_timestamp: new Date().toISOString(),
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(info, null, 2)}\n`);
console.log(`Wrote build metadata to ${outputPath}`);
