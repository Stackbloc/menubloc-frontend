import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function run(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const gitSha         = run("git rev-parse HEAD");
const gitShortSha    = run("git rev-parse --short HEAD");
const branch         = run("git rev-parse --abbrev-ref HEAD");
const commitMessage  = run("git log -1 --pretty=%s");

const info = {
  app:          "menuply-frontend",
  gitSha:       gitSha       || null,
  gitShortSha:  gitShortSha  || null,
  branch:       branch       || null,
  buildTime:    new Date().toISOString(),
  buildSource:  process.env.VERCEL ? "vercel" : "local-cli",
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
  vercelUrl:    process.env.VERCEL_URL            || null,
  nodeEnv:      process.env.NODE_ENV              || "production",
  commitMessage: commitMessage || null,
};

const outPath = join(root, "public", "build-info.json");
mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(outPath, JSON.stringify(info, null, 2) + "\n");

console.log("[generateBuildInfo] wrote public/build-info.json");
console.log(JSON.stringify(info, null, 2));
