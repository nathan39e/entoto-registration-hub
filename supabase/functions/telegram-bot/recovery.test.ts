import { expect, test } from "bun:test";
import { ACCOUNT_REQUEST_TTL_MS, PRIVATE_REPLY_DELAY_MS, randomStudentPassword, recoverOwnAccount, type RecoveryServices } from "./recovery";

function fixture() {
  const calls: string[] = [];
  const services: RecoveryServices = {
    findPersonalPhone: async (phone) => { calls.push(`phone:${phone}`); return [{ id: "student" }]; },
    getAccount: async () => ({ email: "student@example.test" }),
    setPassword: async (id, pw) => { calls.push(`set:${id}:${pw}`); return true; },
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
test("own-contact recovery sets a new random password and shows it with the email", async () => {
  const { services, calls } = fixture();
  expect(await recoverOwnAccount(123, 123, { user_id: 123, phone_number: "0912345678" }, services, () => "Pw#Test12345ab")).toBe("shown");
  expect(calls).toEqual(["phone:0912345678", "set:student:Pw#Test12345ab", "show:student@example.test:Pw#Test12345ab"]);
});
test("generated passwords are 14 chars with upper, lower, digit and symbol", () => {
  for (let i = 0; i < 50; i++) {
    const p = randomStudentPassword();
    expect(p.length).toBe(14);
    expect(/[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[#@$%&*!?]/.test(p)).toBe(true);
  }
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
test("password reply is deleted within ten minutes", () => {
  expect(PRIVATE_REPLY_DELAY_MS).toBe(540000);
  expect(PRIVATE_REPLY_DELAY_MS + 60000).toBe(600000);
});
test("a new contact request expires after five minutes", () => {
  expect(ACCOUNT_REQUEST_TTL_MS).toBe(300000);
});