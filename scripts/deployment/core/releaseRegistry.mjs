import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export function hash(value) { return createHash("sha256").update(stable(value)).digest("hex"); }
export class ReleaseRegistry {
  constructor(directory) { this.directory = resolve(directory); }
  list() { if (!existsSync(this.directory)) return []; return readdirSync(this.directory).filter((name) => /^deployment-\d{6}\.json$/.test(name)).sort().map((name) => JSON.parse(readFileSync(resolve(this.directory, name), "utf8"))); }
  verify() {
    let previous = "GENESIS";
    this.list().forEach((record, index) => { const { record_hash, ...unsigned } = record; if (record.deployment_number !== index + 1 || record.previous_record_hash !== previous || hash(unsigned) !== record_hash) throw new Error(`release registry invalid at ${index + 1}`); previous = record_hash; });
    return true;
  }
  append(input) {
    mkdirSync(this.directory, { recursive: true }); this.verify(); const records = this.list(); const last = records.at(-1); const number = records.length + 1;
    const unsigned = { schema_version: 1, deployment_number: number, created_at: input.created_at || new Date().toISOString(), release_type: input.release_type, environment: input.environment || "production", frontend: input.frontend || null, backend: input.backend || null, database: input.database || null, configuration: input.configuration || null, certification: input.certification || "NOT CERTIFIED", status: input.status, smoke_tests: input.smoke_tests || [], business_status: input.business_status || null, incident_ids: input.incident_ids || [], rollback_target: input.rollback_target ?? last?.deployment_number ?? null, rollback_status: input.rollback_status || "not_required", previous_record_hash: last?.record_hash || "GENESIS" };
    const record = { ...unsigned, record_hash: hash(unsigned) }; writeFileSync(resolve(this.directory, `deployment-${String(number).padStart(6, "0")}.json`), `${JSON.stringify(record, null, 2)}\n`, { flag: "wx", mode: 0o444 }); return record;
  }
}
