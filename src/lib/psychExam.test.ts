import { describe, expect, test } from "bun:test";
import { gradePsychExam, nextQueue } from "./psychExam";
import { PSYCH_EXAM } from "@/data/psychExam80";

describe("psychometric exam", () => {
  test("has 80 questions, 75 scored", () => {
    expect(PSYCH_EXAM.length).toBe(80);
    expect(PSYCH_EXAM.filter((q) => q.answer !== null).length).toBe(75);
  });
  test("answer key matches sheet (Q4 = B, Q79 = B, Q54 = D)", () => {
    expect(PSYCH_EXAM[3].answer).toBe(1);
    expect(PSYCH_EXAM[78].answer).toBe(1);
    expect(PSYCH_EXAM[53].answer).toBe(3);
  });
  test("skipped question comes back after the rest", () => {
    let q = nextQueue([1, 2, 3], "skip");
    expect(q).toEqual([2, 3, 1]);
    q = nextQueue(nextQueue(q, "answer"), "answer");
    expect(q).toEqual([1]);
  });
  test("missed lists wrong answers and ignores personality items", () => {
    const answers = Object.fromEntries(PSYCH_EXAM.filter((x) => x.answer !== null).map((x) => [x.n, x.answer!]));
    answers[4] = 0;
    const r = gradePsychExam(PSYCH_EXAM, answers);
    expect(r.correct).toBe(74);
    expect(r.missed.map((m) => m.q.n)).toEqual([4]);
  });
});
