import { toEthiopian, toGregorian } from "ethiopian-date";

export const ETHIOPIAN_MONTHS = ["Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagumen"];
export const daysInEthiopianMonth = (year: number, month: number) => month === 13 ? (year % 4 === 3 ? 6 : 5) : 30;
export function ethiopianToISO(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || year < 1800 || month < 1 || month > 13 || day < 1 || day > daysInEthiopianMonth(year, month)) throw new Error("Invalid Ethiopian date");
  return toGregorian(year, month, day).map((n, i) => String(n).padStart(i === 0 ? 4 : 2, "0")).join("-");
}
export function isoToEthiopian(iso: string): [number, number, number] | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  try { const [y, m, d] = iso.split("-").map(Number); return toEthiopian(y, m, d); } catch { return null; }
}
export const formatEthiopianDate = (iso: string) => {
  const date = isoToEthiopian(iso);
  return date ? `${date[2]} ${ETHIOPIAN_MONTHS[date[1] - 1]} ${date[0]} E.C.` : iso;
};