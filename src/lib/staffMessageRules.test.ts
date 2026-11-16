import { expect, test } from "bun:test";
import { canChangeStaffMessage, validStaffMessage } from "./staffMessageRules";
test("messages must contain text and stay within 4000 characters", () => {
  expect(validStaffMessage("   ")).toBe(false);
  expect(validStaffMessage("Hello department head")).toBe(true);
  expect(validStaffMessage("a".repeat(4000))).toBe(true);
  expect(validStaffMessage("a".repeat(4001))).toBe(false);
});
test("only the sender can edit or delete a message", () => {
  expect(canChangeStaffMessage("sender", "sender")).toBe(true);
  expect(canChangeStaffMessage("recipient", "sender")).toBe(false);
});