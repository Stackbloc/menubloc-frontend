#!/usr/bin/env node
/**
 * Adds useLanguage import + const { t } = useLanguage() to page/component files
 * that export a default function component but lack useLanguage.
 *
 * GUARDRAILS (mandatory):
 * - Never auto-commit or auto-push.
 * - Writes docs/i18n-wire-audit.json with changed files.
 * - Runs eslint, vite build, then homepage runtime smoke; stops on first failure.
 *
 * Usage:
 *   node scripts/wire-i18n-hook.mjs           # wire + verify
 *   node scripts/wire-i18n-hook.mjs --dry-run # list targets only
 */
import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ROOT = path.resolve(import.meta.dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

const SKIP = new Set([
  "App.jsx",
  "main.jsx",
  "BackButton.jsx",
  // Rendered as siblings inside OrderCartProvider (outside BrowserRouter tree).
  // Only safe after LanguageProvider wraps OrderCartProvider in App.jsx.
  "OrderCartToast.jsx",
]);

/** Context modules that mount UI outside the router — hooks need provider above them. */
const SKIP_DIRS = new Set(["context"]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules") continue;
      walk(full, out);
    } else if (name.endsWith(".jsx")) out.push(full);
  }
  return out;
}

function wire(file) {
  const base = path.basename(file);
  if (SKIP.has(base)) return false;
  const relFromSrc = path.relative(path.join(ROOT, "src"), file).replace(/\\/g, "/");
  if (SKIP_DIRS.has(relFromSrc.split("/")[0])) return false;

  let src = fs.readFileSync(file, "utf8");
  if (src.includes("useLanguage")) return false;
  if (!/export\s+default\s+function\s+\w+/.test(src) && !/export\s+default\s+function\s*\(/.test(src)) {
    return false;
  }

  // Skip when component already receives `t` as a prop (menu templates).
  if (/\(\s*\{[^}]*\bt\b[^}]*\}\s*\)/.test(src) && /\bt\s*[,}]/.test(src)) {
    return false;
  }

  const rel = relFromSrc;
  const depth = rel.split("/").length - 1;
  const importPath =
    depth === 0 ? "./context/LanguageContext.jsx" : `${"../".repeat(depth)}context/LanguageContext.jsx`;

  if (!src.includes("LanguageContext")) {
    const importLine = `import { useLanguage } from "${importPath}";\n`;
    const m = src.match(/^import .+;\n/m);
    if (m) {
      const idx = src.indexOf(m[0]) + m[0].length;
      src = src.slice(0, idx) + importLine + src.slice(idx);
    } else {
      src = importLine + src;
    }
  }

  const fnMatch = src.match(/export\s+default\s+function\s+(\w+)?\s*\([^)]*\)\s*\{/);
  if (!fnMatch) return false;
  const insertAt = fnMatch.index + fnMatch[0].length;
  if (src.slice(insertAt, insertAt + 80).includes("useLanguage")) return false;
  src = `${src.slice(0, insertAt)}\n  const { t } = useLanguage();${src.slice(insertAt)}`;

  if (!DRY_RUN) fs.writeFileSync(file, src);
  return true;
}

function run(cmd, args, label) {
  console.log(`\n▶ ${label}: ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`\n✗ Stopped: ${label} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const files = walk(path.join(ROOT, "src"));
  const changed = [];
  for (const f of files) {
    if (wire(f)) {
      changed.push(path.relative(ROOT, f));
      console.log(DRY_RUN ? "would wire:" : "wired:", path.relative(ROOT, f));
    }
  }

  const auditPath = path.join(ROOT, "docs", "i18n-wire-audit.json");
  fs.mkdirSync(path.dirname(auditPath), { recursive: true });
  fs.writeFileSync(
    auditPath,
    JSON.stringify({ at: new Date().toISOString(), dryRun: DRY_RUN, changed }, null, 2)
  );
  console.log(`\nAudit: ${path.relative(ROOT, auditPath)} (${changed.length} files)`);

  if (DRY_RUN || changed.length === 0) {
    console.log(DRY_RUN ? "Dry run complete." : "No files changed; skipping verify.");
    return;
  }

  run("npm", ["run", "lint"], "eslint");
  run("npm", ["run", "build"], "production build");

  const previewPort = 4173;
  const preview = spawn(
    "npx",
    ["vite", "preview", "--port", String(previewPort), "--strictPort"],
    { cwd: ROOT, stdio: "ignore", detached: true }
  );
  preview.unref();
  await sleep(3000);
  try {
    run("node", ["scripts/smoke-homepage.mjs", `http://localhost:${previewPort}/`], "runtime smoke");
  } finally {
    try {
      process.kill(preview.pid, "SIGTERM");
    } catch {
      // ignore
    }
  }

  console.log("\n✓ Wire + verify complete. Review changed files before commit.");
}

await main();
