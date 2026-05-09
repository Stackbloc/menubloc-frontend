import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = "/Users/andrebarber/Desktop/menubloc/menubloc-frontend";

test("App route includes /menu-verification/:token", () => {
  const appPath = path.join(ROOT, "src/App.jsx");
  const src = fs.readFileSync(appPath, "utf8");
  assert.match(src, /path="\/menu-verification\/:token"/);
  assert.match(src, /MenuVerificationPage/);
});

test("menu verification API GET/POST use public endpoints", async () => {
  const modUrl = pathToFileURL(path.join(ROOT, "src/lib/menuVerificationApi.js")).href;

  const calls = [];
  global.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({ ok: true });
      },
    };
  };

  const api = await import(modUrl);
  await api.getMenuVerificationSession("abc123");
  await api.postMenuVerificationAnswers("abc123", {
    answers: [{ question_id: 7, answer: { choice: "yes" } }],
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/menu-verification\/abc123$/);
  assert.equal((calls[0].init.method || "GET").toUpperCase(), "GET");
  assert.match(calls[1].url, /\/menu-verification\/abc123\/answers$/);
  assert.equal((calls[1].init.method || "").toUpperCase(), "POST");
  const body = JSON.parse(String(calls[1].init.body || "{}"));
  assert.deepEqual(body, {
    answers: [{ question_id: 7, answer: { choice: "yes" } }],
  });
});
