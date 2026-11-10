import { ownContact } from "./rules.ts";

/** Reply deletion is due at 9 minutes; the every-minute cleanup removes it within 10 minutes. */
export const PRIVATE_REPLY_DELAY_MS = 9 * 60 * 1000;
export const ACCOUNT_REQUEST_TTL_MS = 5 * 60 * 1000;

/** Strong random password (letters, digits, symbol) that passes leaked-password checks. */
export function randomStudentPassword() {
  const sets = ["ABCDEFGHJKMNPQRSTUVWXYZ", "abcdefghjkmnpqrstuvwxyz", "23456789", "#@$%&*!?"];
  const all = sets.join("");
  const r = crypto.getRandomValues(new Uint32Array(14));
  const chars = Array.from(r, (x, i) => (i < 4 ? sets[i] : all)[x % (i < 4 ? sets[i] : all).length]);
  const s = crypto.getRandomValues(new Uint32Array(chars.length));
  for (let i = chars.length - 1; i > 0; i--) { const j = s[i] % (i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join("");
}

type Contact = { user_id?: number; phone_number?: string };
export interface RecoveryServices {
  findPersonalPhone: (phone: string) => Promise<{ id: string }[]>;
  getAccount: (id: string) => Promise<{ email?: string; banned_until?: string } | null>;
  setPassword: (id: string, password: string) => Promise<boolean>;
  showPrivateAccount: (email: string, password: string | null) => Promise<void>;
}

// This path never accepts student IDs, emergency contacts or typed phone numbers.
export async function recoverOwnAccount(chat: number, sender: number, contact: Contact | undefined, services: RecoveryServices, makePassword = randomStudentPassword) {
  if (chat !== sender || !Number.isSafeInteger(sender) || sender <= 0) return "unverified";
  const phone = ownContact(sender, contact);
  if (!phone) return "unverified";
  const matches = await services.findPersonalPhone(phone);
  if (matches.length !== 1) return "not_found";
  const account = await services.getAccount(matches[0].id);
  if (!account?.email || (account.banned_until && Date.parse(account.banned_until) > Date.now())) return "not_found";
  const password = makePassword();
  const ok = await services.setPassword(matches[0].id, password);
  await services.showPrivateAccount(account.email, ok ? password : null);
  return "shown";
}
