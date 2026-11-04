import assert from "node:assert/strict";
import test from "node:test";
import { askHandbook } from "../lib/pipeline";
import { CASES } from "./cases";

test("the 100-question suite has 100 cases", () => assert.equal(CASES.length, 100));

for (const c of CASES) {
  test(`answers well: ${c.q}`, async () => {
    const r = (await askHandbook(c.q)) as any;
    assert.equal(r.type, c.type, `type for "${c.q}"`);
    if (c.category) assert.equal(r.category, c.category);
    const text = r.answer ?? r.note ?? r.text ?? r.message ?? "";
    if (c.has) assert.match(text, new RegExp(c.has, "is"));
    if (c.not) assert.doesNotMatch(text, new RegExp(c.not, "is"));
  });
}
