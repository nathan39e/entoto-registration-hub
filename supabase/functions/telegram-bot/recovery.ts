import { ownContact } from "./rules.ts";

export const PRIVATE_REPLY_DELAY_MS = 4 * 60 * 1000;
export const ACCOUNT_REQUEST_TTL_MS = 5 * 60 * 1000;
export const RECOVERY_REDIRECT = "https://tafarimakonnenn.onrender.com/reset-password";

type Contact = { user_id?: number; phone_number?: string };
export interface RecoveryServices {
  findPersonalPhone: (phone: string) => Promise<{ id: string }[]>;
  getAccount: (id: string) => Promise<{ email?: string; banned_until?: string } | null>;
  sendResetEmail: (email: string, redirect: string) => Promise<boolean>;
  showPrivateAccount: (email: string, resetSent: boolean) => Promise<void>;
}

// This path never accepts student IDs, emergency contacts or typed phone numbers.
export async function recoverOwnAccount(chat: number, sender: number, contact: Contact | undefined, services: RecoveryServices) {
  if (chat !== sender || !Number.isSafeInteger(sender) || sender <= 0) return "unverified";
  const phone = ownContact(sender, contact);
  if (!phone) return "unverified";
  const matches = await services.findPersonalPhone(phone);
  if (matches.length !== 1) return "not_found";
  const account = await services.getAccount(matches[0].id);
  if (!account?.email || (account.banned_until && Date.parse(account.banned_until) > Date.now())) return "not_found";
  const sent = await services.sendResetEmail(account.email, RECOVERY_REDIRECT);
  await services.showPrivateAccount(account.email, sent);
  return "shown";
}