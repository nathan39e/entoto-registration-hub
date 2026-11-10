import { describe, expect, test } from "bun:test";
import { randomPassword } from "./staffPassword";

describe("staff-issued student passwords", () => {
  test("generates a 40-character password with every required character class", () => {
    const password = randomPassword();
    expect(password).toHaveLength(40);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^A-Za-z0-9]/);
  });

  test("does not reuse a password across student registrations", () => {
    expect(new Set(Array.from({ length: 20 }, randomPassword)).size).toBe(20);
  });
});
