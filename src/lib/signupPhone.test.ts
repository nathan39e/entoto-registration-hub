import { expect, test } from "bun:test";
import { signupPhone } from "./signupPhone";

test("student signup requires a phone number", () => {
  expect(signupPhone("")).toBeNull();
  expect(signupPhone("   ")).toBeNull();
});

test("signup accepts local and international phone numbers", () => {
  expect(signupPhone("0912345678")).toBe("0912345678");
  expect(signupPhone(" +251912345678 ")).toBe("+251912345678");
});

test("signup rejects invalid phone numbers", () => {
  expect(signupPhone("not-a-number")).toBeNull();
  expect(signupPhone("123")).toBeNull();
  expect(signupPhone("1234567890123456")).toBeNull();
});