import { describe, expect, test } from "bun:test";
import { normalizeGradeResult } from "./grade-results";

describe("Grade 12 document subject marks", () => {
  test("retains individual decimal and zero marks separately from the total", () => {
    expect(normalizeGradeResult({ is_result_document: true, score: 177.5, subject_marks: { english: 42.32, physics: 0, naturalMath: 55.18 } })).toEqual({ isDocument: true, extracted: 177.5, subjects: { english: 42.32, physics: 0, naturalMath: 55.18 } });
  });
  test("does not fabricate missing, unreadable or invalid subject results", () => {
    expect(normalizeGradeResult({ is_result_document: true, score: 160, subject_marks: { english: null, biology: "unreadable", chemistry: 101, physics: -1, history: 25, unknown: 50 } }).subjects).toEqual({ history: 25 });
  });
  test("rejects marks from unrelated documents", () => {
    expect(normalizeGradeResult({ is_result_document: false, score: 177.5, subject_marks: { english: 42.32 } })).toEqual({ isDocument: false, extracted: null, subjects: {} });
  });
});