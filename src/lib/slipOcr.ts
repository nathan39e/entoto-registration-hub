import { SUBJECTS } from "../../supabase/functions/verify-grade/grade-results";

const ALIASES: Record<string, string[]> = {
  english: ["english"], physics: ["physics"], civics: ["civics"], geography: ["geography"],
  naturalMath: ["natural math", "mathematics (natural)", "math natural", "maths natural"],
  socialMath: ["social math", "mathematics (social)", "math social", "maths social"],
  biology: ["biology"], economics: ["economics"], aptitude: ["aptitude", "scholastic aptitude"],
  chemistry: ["chemistry"], history: ["history"],
};

/** Parse OCR text from a Grade 12 result slip into subject marks and total. */
export function parseSlipText(text: string) {
  const lines = text.toLowerCase().split(/\r?\n/);
  const subjects: Record<string, number> = {};
  for (const [key] of SUBJECTS) {
    for (const line of lines) {
      if (!ALIASES[key].some((a) => line.includes(a))) continue;
      const nums = (line.match(/\d{1,3}(?:\.\d+)?/g) ?? []).map(Number).filter((n) => n >= 0 && n <= 100);
      if (nums.length) { subjects[key] = nums[nums.length - 1]; break; }
    }
  }
  let extracted: number | null = null;
  for (const line of lines) {
    if (!/total|ጠቅላላ|sum/.test(line)) continue;
    const nums = (line.match(/\d{2,3}(?:\.\d+)?/g) ?? []).map(Number).filter((n) => n > 0 && n <= 700);
    if (nums.length) { extracted = nums[nums.length - 1]; break; }
  }
  const count = Object.keys(subjects).length;
  if (extracted === null && count >= 4) extracted = Math.round(Object.values(subjects).reduce((a, b) => a + b, 0) * 100) / 100;
  const isDocument = count >= 2 || extracted !== null || /grade\s*12|eslce|eheece|result|national exam/i.test(text);
  return { isDocument, extracted, subjects };
}

/** Free, in-browser OCR fallback (no API key). */
export async function readSlipInBrowser(file: File) {
  const { recognize } = await import("tesseract.js");
  const { data } = await recognize(file, "eng");
  return parseSlipText(data.text ?? "");
}
