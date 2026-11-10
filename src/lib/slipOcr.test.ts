import { expect, test } from "bun:test";
import { parseSlipText } from "./slipOcr";

test("reads subject marks and total from slip text", () => {
  const r = parseSlipText("Grade 12 Result\nEnglish 55\nPhysics 60\nNatural Math 70\nTotal 412");
  expect(r.subjects).toEqual({ english: 55, physics: 60, naturalMath: 70 });
  expect(r.extracted).toBe(412);
  expect(r.isDocument).toBe(true);
});
