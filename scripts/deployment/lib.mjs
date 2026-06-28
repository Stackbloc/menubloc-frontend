import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

export function abort(message) {
  console.error(`ABORT DEPLOYMENT: ${message}`);
  const error = new Error(message);
  error.exitCode = 1;
  throw error;
}

export function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", stdio: options.capture ? "pipe" : "inherit", ...options }).trim();
}

export function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

export function normalizeRemote(remote) {
  return remote.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "");
}

export function requireRepo(config, { allowDirty = false, branch = config.branch } = {}) {
  const cwd = resolve(process.cwd());
  if (cwd !== config.repoPath) abort(`expected repository path ${config.repoPath}; found ${cwd}`);
  const remote = git(["remote", "get-url", "origin"]);
  if (normalizeRemote(remote) !== normalizeRemote(config.remote)) abort(`expected git remote ${config.remote}; found ${remote}`);
  const actualBranch = git(["branch", "--show-current"]);
  if (branch && actualBranch !== branch) abort(`expected git branch ${branch}; found ${actualBranch || "detached HEAD"}`);
  const dirty = git(["status", "--porcelain"]);
  if (dirty && !allowDirty) abort(`working tree is not clean:\n${dirty}`);
}

export function requireVercelProject(config) {
  let project;
  try { project = JSON.parse(readFileSync(".vercel/project.json", "utf8")); }
  catch (error) { abort(`cannot read .vercel/project.json: ${error.message}`); }
  if (project.projectId !== config.projectId || project.projectName !== config.projectName) {
    abort(`expected Vercel ${config.projectName} (${config.projectId}); found ${project.projectName || "missing"} (${project.projectId || "missing"})`);
  }
}

export function requireEnvironment(names, env = process.env) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length) abort(`required environment variables are missing: ${missing.join(", ")}`);
}

export function requireVercelEnvironment(config, environment) {
  let output;
  try { output = execFileSync("npx", ["vercel", "env", "ls", environment, "--format", "json"], { encoding: "utf8" }); }
  catch (error) { abort(`cannot list Vercel ${environment} variables: ${error.message}`); }
  let values;
  try { values = JSON.parse(output); }
  catch (error) { abort(`invalid Vercel environment JSON: ${error.message}`); }
  const entries = Array.isArray(values) ? values : values.envs || values.variables || [];
  const names = new Set(entries.map((entry) => entry.key || entry.name));
  const missing = config.requiredEnv.filter((name) => !names.has(name));
  if (missing.length) abort(`required Vercel ${environment} variables are missing: ${missing.join(", ")}`);
}

function walk(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const next = `${path}/${entry.name}`;
    return entry.isDirectory() ? walk(next) : [next];
  });
}

export function verifyFrontendArtifact(config) {
  if (!existsSync(config.buildArtifact) || statSync(config.buildArtifact).size < 100) abort(`missing or blank frontend artifact ${config.buildArtifact}`);
  if (!existsSync(config.viteManifest)) abort(`missing Vite manifest ${config.viteManifest}`);
  let manifest;
  try { manifest = JSON.parse(readFileSync(config.viteManifest, "utf8")); }
  catch (error) { abort(`invalid Vite manifest ${config.viteManifest}: ${error.message}`); }
  if (!Object.values(manifest).some((entry) => entry?.isEntry === true && /^assets\//.test(entry.file || ""))) abort("Vite manifest has no frontend entry asset");
  const html = readFileSync(config.buildArtifact, "utf8");
  if (!/<div[^>]+id=["']root["']/.test(html)) abort("frontend artifact has no Vite root element");
  if (!/<script[^>]+src=["'][^"']*assets\//.test(html)) abort("frontend artifact has no expected Vite asset reference");
  const files = walk(".vercel/output");
  const backendArtifact = files.find((file) => /(?:^|\/)src\/server\.js$/.test(file) || /functions\/.*server.*\.func\//.test(file));
  if (backendArtifact) abort(`backend serverless artifact found in frontend build: ${backendArtifact}`);
  if (files.some((file) => /sharp/i.test(file) && /functions/.test(file))) abort("sharp-backed serverless function found in frontend build");
}

export function parseDeploymentUrl(output) {
  const normalize = (value) => value.replace(/["'`,)]+$/g, "").replace(/^["'`(]+/g, "");
  try {
    const parsed = JSON.parse(output);
    if (parsed.url) return normalize(parsed.url.startsWith("http") ? parsed.url : `https://${parsed.url}`);
  } catch {}
  const previewMatch = output.match(/Preview\s+(https:\/\/[^\s]+)/i);
  if (previewMatch?.[1]) return normalize(previewMatch[1]);
  const matches = output.match(/https:\/\/[^\s]+/g);
  if (!matches?.length) abort(`could not identify deployment URL from Vercel output: ${output.slice(0, 500)}`);
  const preferred = matches.find((url) => !/api\.vercel\.com\/v\d+\/deployments/i.test(url)) || matches.at(-1);
  return normalize(preferred);
}

export function parseVercelInspection(output, config) {
  let value;
  try { value = JSON.parse(output); }
  catch (error) { abort(`invalid Vercel inspection JSON: ${error.message}`); }
  const projectId = value.projectId || value.project?.id;
  const projectName = value.name || value.projectName || value.project?.name;
  if (projectId && projectId !== config.projectId) abort(`deployment belongs to Vercel project ${projectId}, expected ${config.projectId}`);
  if (projectName && projectName !== config.projectName) abort(`deployment belongs to Vercel project ${projectName}, expected ${config.projectName}`);
  const url = value.url || value.alias?.[0] || value.aliases?.[0];
  const id = value.id || value.uid || value.deploymentId || "";
  if (!url) abort("Vercel inspection did not return a deployment URL");
  return { id, url: url.startsWith("http") ? url : `https://${url}`, raw: value };
}
