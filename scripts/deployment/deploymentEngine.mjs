import { execFileSync } from "node:child_process";
import { parseDeploymentUrl, parseVercelInspection } from "./lib.mjs";

export class VercelDeploymentEngine {
  constructor(config, { execImpl = execFileSync } = {}) { this.config = config; this.execImpl = execImpl; }
  inspect(target) { return parseVercelInspection(this.execImpl("npx", ["vercel", "inspect", target, "--format", "json"], { encoding: "utf8" }), this.config); }
  build(environment) { this.execImpl("npx", ["vercel", "build", ...(environment === "production" ? ["--prod"] : []), "--yes"], { stdio: "inherit" }); }
  deployGreen(environment) {
    const output = this.execImpl("npx", ["vercel", "deploy", "--prebuilt", ...(environment === "production" ? ["--prod", "--skip-domain"] : []), "--yes", "--format", "json"], { encoding: "utf8" });
    return parseDeploymentUrl(output);
  }
  alias(target, alias) { this.execImpl("npx", ["vercel", "alias", "set", target, alias], { stdio: "inherit" }); }
}
