import { expect, test } from "bun:test";
import { ACCOUNT_REQUEST_TTL_MS, PRIVATE_REPLY_DELAY_MS, RECOVERY_REDIRECT, recoverOwnAccount, type RecoveryServices } from "./recovery";

function fixture() {
  const calls: string[] = [];
  const services: RecoveryServices = {
    findPersonalPhone: async (phone) => { calls.push(`phone:${phone}`); return [{ id: "student" }]; },
    getAccount: async () => ({ email: "student@example.test" }),
    sendResetEmail: async (email, redirect) => { calls.push(`reset:${email}:${redirect}`); return true; },
    showPrivateAccount: async (email, sent) => { calls.push(`show:${email}:${sent}`); },
  };
  return { calls, services };
}

test("account recovery requires the sender's own contact, not typed numbers or another person's contact", async () => {
  const { services, calls } = fixture();
  expect(await recoverOwnAccount(123, 123, undefined, services)).toBe("unverified");
  expect(await recoverOwnAccount(123, 123, { user_id: 456, phone_number: "0912345678" }, services)).toBe("unverified");
  expect(await recoverOwnAccount(-123, 123, { user_id: 123, phone_number: "0912345678" }, services)).toBe("unverified");
  expect(calls).toEqual([]);
});
test("own-contact recovery shows only email and sends password reset through email", async () => {
  const { services, calls } = fixture();
  expect(await recoverOwnAccount(123, 123, { user_id: 123, phone_number: "0912345678" }, services)).toBe("shown");
  expect(calls).toEqual(["phone:0912345678", `reset:student@example.test:${RECOVERY_REDIRECT}`, "show:student@example.test:true"]);
});
test("ambiguous phone numbers cannot reveal an email or send a recovery link", async () => {
  const { services, calls } = fixture();
  services.findPersonalPhone = async () => [{ id: "one" }, { id: "two" }];
  expect(await recoverOwnAccount(123, 123, { user_id: 123, phone_number: "0912345678" }, services)).toBe("not_found");
  expect(calls).toEqual([]);
});
test("blocked accounts cannot use recovery", async () => {
  const { services, calls } = fixture();
  services.getAccount = async () => ({ email: "student@example.test", banned_until: new Date(Date.now() + 60000).toISOString() });
  expect(await recoverOwnAccount(123, 123, { user_id: 123, phone_number: "0912345678" }, services)).toBe("not_found");
  expect(calls).toEqual(["phone:0912345678"]);
});
test("deletion becomes due at four minutes so minute checks meet the five-minute window", () => {
  expect(PRIVATE_REPLY_DELAY_MS).toBe(240000);
  expect(PRIVATE_REPLY_DELAY_MS + 60000).toBe(300000);
});
test("a new contact request expires after five minutes", () => {
  expect(ACCOUNT_REQUEST_TTL_MS).toBe(300000);
});