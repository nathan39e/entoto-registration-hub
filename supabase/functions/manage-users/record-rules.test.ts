import { describe, test, expect } from "bun:test";
import { canEditDepartments, canAttachManualForm, validManualForm, canCreateAdmin, canManageCreatedAdmin } from "./record-rules";

describe("student record rules", () => {
  test("admins can manage admins they created", () => expect(canManageCreatedAdmin("a", "a")).toBe(true));
  test("admins cannot manage admins created by others", () => expect(canManageCreatedAdmin("a", "b")).toBe(false));
  test("admins without a creator record cannot be managed", () => expect(canManageCreatedAdmin("a", null)).toBe(false));
  test("existing authorized admins can create admins", () => expect(canCreateAdmin(["admin"], true)).toBe(true));
  test("created admins cannot create further admins", () => expect(canCreateAdmin(["admin"], false)).toBe(false));
  test("non-admins cannot use creation authority", () => expect(canCreateAdmin(["sub_admin"], true)).toBe(false));
  test("manual form can be left empty", () => expect(validManualForm(null)).toBe(true));
  test("admins can attach a manual form", () => expect(canAttachManualForm(["admin"])).toBe(true));
  test("sub-admins can attach forms without department-edit permission", () => expect(canAttachManualForm(["sub_admin"])).toBe(true));
  test("students and department heads cannot attach forms as staff", () => {
    expect(canAttachManualForm(["student"])).toBe(false);
    expect(canAttachManualForm(["department_head"])).toBe(false);
  });
  test("sub-admin editing is denied by default", () => expect(canEditDepartments(["sub_admin"], false)).toBe(false));
  test("individual grant enables sub-admin editing", () => expect(canEditDepartments(["sub_admin"], true)).toBe(true));
  test("revoking permission disables editing", () => expect(canEditDepartments(["sub_admin"], false)).toBe(false));
  test("other roles cannot use a department-edit grant", () => expect(canEditDepartments(["student", "department_head"], true)).toBe(false));
  test("admins can edit choices", () => expect(canEditDepartments(["admin"], false)).toBe(true));
  test("manual form rejects oversized files", () => expect(validManualForm({ type: "application/pdf", size: 5 * 1024 * 1024 + 1 })).toBe(false));
});