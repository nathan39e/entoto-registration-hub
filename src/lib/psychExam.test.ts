import { describe, expect, test } from "bun:test";
import { gradePsychExam, nextQueue, recommendPsychDepartments } from "./psychExam";
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
    const answers = Object.fromEntries(PSYCH_EXAM.flatMap((x) => x.answer === null ? [] : [[x.n, x.answer]]));
    answers[4] = 0;
    const r = gradePsychExam(PSYCH_EXAM, answers);
    expect(r.correct).toBe(74);
    expect(r.missed.map((m) => m.q.n)).toEqual([4]);
  });
});

describe("psychometric department recommendations", () => {
  test("reasoning and judgment scores never outrank a real department", () => {
    expect(recommendPsychDepartments({
      "Verbal Reasoning": 100, "Numerical Reasoning": 100,
      "Logical Reasoning": 100, "Situational Judgment": 100,
      "Personality Profile": 100, ICT: 60, Aesthetics: 40,
    })).toEqual(["ICT"]);
  });
  test("construction section uses the admissions department name", () => {
    expect(recommendPsychDepartments({ "Construction Technology and Wood Work": 100, ICT: 80 }))
      .toEqual(["Construction Technology"]);
  });
  test("metal section uses the admissions department name", () => {
    expect(recommendPsychDepartments({ "Metal Technology": 100, ICT: 80 }))
      .toEqual(["Wood Work and Metal Technology"]);
  });
  test("unknown and skill-only categories produce no department recommendation", () => {
    expect(recommendPsychDepartments({ "Numerical Reasoning": 100, General: 80, Unknown: 100 }))
      .toEqual([]);
  });
  test("equal department scores do not depend on category insertion order", () => {
    expect(recommendPsychDepartments({ ICT: 80, Aesthetics: 80 })).toEqual(["Aesthetics"]);
    expect(recommendPsychDepartments({ Aesthetics: 80, ICT: 80 })).toEqual(["Aesthetics"]);
  });
  test("full exam retains skill scores but recommends the best department", () => {
    const skills = new Set(["Verbal Reasoning", "Numerical Reasoning", "Logical Reasoning", "Situational Judgment"]);
    const answers = Object.fromEntries(PSYCH_EXAM.flatMap((q) => q.answer === null ? [] : [
      [q.n, skills.has(q.cat) || q.cat === "ICT" ? q.answer : (q.answer + 1) % q.options.length],
    ]));
    const graded = gradePsychExam(PSYCH_EXAM, answers);
    expect(graded.scores["Numerical Reasoning"]).toBe(100);
    expect(graded.scores.ICT).toBe(100);
    expect(graded.scores.Aesthetics).toBe(0);
    expect(recommendPsychDepartments(graded.scores)).toEqual(["ICT"]);
  });
});
