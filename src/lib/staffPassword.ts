const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** High-entropy staff-issued password accepted by leaked-password protection. */
export const randomPassword = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(36));
  const randomPart = Array.from(bytes, (byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length]).join("");
  return `Tm7!${randomPart}`;
};
