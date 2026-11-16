export type PaymentState = { status?: string | null; payment_method?: string | null } | null | undefined;

// An initialized checkout is not a submitted receipt or proof of payment.
export function receiptAwaitingReview(payment: PaymentState): boolean {
  return payment?.status === "pending" && payment.payment_method !== "chapa";
}

export function receiptUploadBlocked(payment: PaymentState): boolean {
  return payment?.status === "completed" || receiptAwaitingReview(payment);
}

export function paymentDisplayStatus(payment: PaymentState): string | null {
  if (!payment) return null;
  if (payment.status === "pending" && payment.payment_method === "chapa") return "checkout unfinished";
  return receiptAwaitingReview(payment) ? "awaiting verification" : payment.status ?? null;
}