import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const APPROVED_CWD = "/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main";
const EXPECTED_PROJECT_ID = "prj_xvvxrY8NnlHMSTrQCMM4I4fNoUxu";

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function fail(message) {
  console.error(`Production deploy blocked: ${message}`);
  process.exit(1);
}

const cwd = resolve(process.cwd());
if (cwd !== APPROVED_CWD) {
  fail(`must run from ${APPROVED_CWD}; current directory is ${cwd}`);
}

const branch = runGit(["branch", "--show-current"]);
if (branch !== "main") {
  fail(`branch must be main; current branch is ${branch || "(detached)"}`);
}

let project;
try {
  project = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
} catch (error) {
  fail(`could not read .vercel/project.json: ${error.message}`);
}

if (project.projectId !== EXPECTED_PROJECT_ID) {
  fail(`Vercel projectId must be ${EXPECTED_PROJECT_ID}; found ${project.projectId || "(missing)"}`);
}

const status = runGit(["status", "--porcelain"]);
if (status) {
  fail(`git status must be clean; found:\n${status}`);
}

const head = runGit(["rev-parse", "HEAD"]);
const originMain = runGit(["rev-parse", "origin/main"]);
if (head !== originMain) {
  fail(`HEAD must equal origin/main; HEAD=${head}, origin/main=${originMain}`);
}

console.log(`Production deploy guard passed: ${branch} ${head} -> ${project.projectName}`);
