import { test, expect } from "bun:test";
import { contactSchema, lookupSchema } from "./rules";

test("contact submissions require sender details and a message", () => {
  expect(contactSchema.safeParse({ name: "Visitor", email: "visitor@example.com", subject: "Admissions", message: "Please help" }).success).toBe(true);
  expect(contactSchema.safeParse({ name: "Visitor", email: "bad", subject: "Admissions", message: "" }).success).toBe(false);
});
test("private replies require both a message ID and a secure token", () => {
  expect(lookupSchema.safeParse({ id: crypto.randomUUID(), token: "a".repeat(64) }).success).toBe(true);
  expect(lookupSchema.safeParse({ id: crypto.randomUUID() }).success).toBe(false);
});