import { expect, test } from "bun:test";
import { paymentDisplayStatus, receiptAwaitingReview, receiptUploadBlocked } from "../../supabase/functions/_shared/paymentState";

test("abandoned Chapa checkout allows website and Telegram CBE receipt uploads", () => {
  const payment = { status: "pending", payment_method: "chapa" };
  expect(receiptUploadBlocked(payment)).toBe(false);
  expect(receiptAwaitingReview(payment)).toBe(false);
  expect(paymentDisplayStatus(payment)).toBe("checkout unfinished");
});
test("a submitted CBE receipt blocks duplicate uploads until reviewed", () => {
  const payment = { status: "pending", payment_method: "cbe" };
  expect(receiptUploadBlocked(payment)).toBe(true);
  expect(receiptAwaitingReview(payment)).toBe(true);
  expect(paymentDisplayStatus(payment)).toBe("awaiting verification");
});
test("verified payments remain protected regardless of payment method", () => {
  for (const payment_method of ["chapa", "cbe"]) {
    expect(receiptUploadBlocked({ status: "completed", payment_method })).toBe(true);
    expect(paymentDisplayStatus({ status: "completed", payment_method })).toBe("completed");
  }
});
test("rejected and absent payments allow another receipt", () => {
  expect(receiptUploadBlocked(null)).toBe(false);
  expect(receiptUploadBlocked({ status: "rejected", payment_method: "cbe" })).toBe(false);
});