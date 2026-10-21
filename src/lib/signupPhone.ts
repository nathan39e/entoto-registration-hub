export const SIGNUP_PHONE_PATTERN = /^\+?[0-9]{9,15}$/;

export function signupPhone(value: string): string | null {
  const phone = value.trim();
  return SIGNUP_PHONE_PATTERN.test(phone) ? phone : null;
}