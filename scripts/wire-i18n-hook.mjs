#!/usr/bin/env node
/**
 * Adds useLanguage import + const { t } = useLanguage() to page/component files
 * that export a default function component but lack useLanguage.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set([
  "App.jsx",
  "main.jsx",
  "BackButton.jsx",
]);

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
  let src = fs.readFileSync(file, "utf8");
  if (src.includes("useLanguage")) return false;
  if (!/export\s+default\s+function\s+\w+/.test(src) && !/export\s+default\s+function\s*\(/.test(src)) {
    return false;
  }

  const rel = path.relative(path.join(ROOT, "src"), file).replace(/\\/g, "/");
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

  fs.writeFileSync(file, src);
  return true;
}

const files = walk(path.join(ROOT, "src"));
let n = 0;
for (const f of files) {
  if (wire(f)) {
    n += 1;
    console.log("wired:", path.relative(ROOT, f));
  }
}
console.log(`Done. Wired ${n} files.`);
