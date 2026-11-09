export function ownContact(sender: number, contact?: { user_id?: number; phone_number?: string }): string | null {
  return contact?.user_id === sender && typeof contact.phone_number === "string" ? contact.phone_number : null;
}

export function validFullName(value: string): boolean {
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 3 && name.length <= 100 && /^[\p{L} .’'\-]+$/u.test(name) && name.split(" ").length >= 2;
}