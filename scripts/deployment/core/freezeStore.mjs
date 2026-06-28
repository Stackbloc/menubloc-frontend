import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { hash } from "./releaseRegistry.mjs";

export class FreezeStore {
  constructor(file) { this.file = resolve(file); }
  events() { return existsSync(this.file) ? readFileSync(this.file, "utf8").split("\n").filter(Boolean).map(JSON.parse) : []; }
  state() { let previous = "GENESIS"; const events = this.events(); for (const event of events) { const { event_hash, ...unsigned } = event; if (unsigned.previous_event_hash !== previous || hash(unsigned) !== event_hash) throw new Error("deployment control chain invalid"); previous = event_hash; } return { frozen: events.at(-1)?.action === "freeze", latest: events.at(-1) || null }; }
  append(action, reason, actor = "deployment-system") { const current = this.state(); const unsigned = { timestamp: new Date().toISOString(), action, reason, actor, previous_event_hash: current.latest?.event_hash || "GENESIS" }; const event = { ...unsigned, event_hash: hash(unsigned) }; mkdirSync(dirname(this.file), { recursive: true }); appendFileSync(this.file, `${JSON.stringify(event)}\n`); return event; }
  assertDeployAllowed() { const state = this.state(); if (state.frozen) throw new Error(`deployments frozen: ${state.latest.reason}`); }
}
