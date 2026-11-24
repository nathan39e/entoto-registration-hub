import { describe, expect, test } from "bun:test";
import { applicationSummary } from "./adminApplications";
import { matchesStudentExport } from "./studentExport";

describe("lightweight admin applications", () => {
  const summary = applicationSummary({ id: "app", user_id: "student", first_choice: "ICT — Network", second_choice: "Other", third_choice: "Third", first_department: "ICT", program: "Weekend", status: "approved", submitted_at: "2026-11-24", result_doc_path: "student/slip.jpg", score: 540, gender: "Female" });
  test("retains numeric marks, gender and document reference without full form downloads", () => {
    expect(summary.grade_12_results).toEqual({ score: 540, personal_info: { gender: "Female" } });
    expect(summary.result_doc_path).toBe("student/slip.jpg");
    expect("documents" in summary).toBe(false);
  });
  test("retains department, program and status filter behavior", () => {
    const student = { created_at: "2026-11-24", full_name: "Student", email: "student@example.com", student_code: "123" };
    const filters = { from: "", to: "", department: "ICT", program: "Weekend", status: "approved", search: "", occupation: "Network" };
    expect(matchesStudentExport(student, summary, filters)).toBe(true);
    expect(matchesStudentExport(student, summary, { ...filters, program: "Regular" })).toBe(false);
  });
});