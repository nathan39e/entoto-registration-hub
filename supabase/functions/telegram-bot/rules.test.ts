import { describe, expect, test } from "bun:test";
import { ownContact, validFullName } from "./rules";

describe("Telegram own-name editing", () => {
  test("only the sender's Telegram contact verifies ownership", () => {
    expect(ownContact(123, { user_id: 123, phone_number: "+251912345678" })).toBe("+251912345678");
    expect(ownContact(123, { user_id: 456, phone_number: "+251912345678" })).toBeNull();
    expect(ownContact(123, { phone_number: "+251912345678" })).toBeNull();
    expect(ownContact(123)).toBeNull();
  });
  test("accepts English and Amharic full names, not commands or other fields", () => {
    expect(validFullName("Abebe Kebede Bekele")).toBe(true);
    expect(validFullName("አበበ ከበደ በቀለ")).toBe(true);
    expect(validFullName("Abebe")).toBe(false);
    expect(validFullName("/status TMP-2026-0001")).toBe(false);
    expect(validFullName('{"phone":"0912345678"}')).toBe(false);
    expect(validFullName("Abebe " + "a".repeat(100))).toBe(false);
  });
});