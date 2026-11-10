import { SUBJECTS } from "../../supabase/functions/verify-grade/grade-results";

const SUBJECT_PATTERNS: Record<string, RegExp> = {
  english: /\benglish\b/i,
  physics: /\bphysics\b/i,
  civics: /\bcivics?\b|\bcivies\b|\bcivic\s+(?:and\s+)?ethical\b/i,
  geography: /\bgeography\b/i,
  naturalMath: /\bmath(?:s|ematics)?\s*(?:\(\s*natural\s*\)|natural\b)|\bnatural\s+math(?:s|ematics)?\b/i,
  socialMath: /\bmath(?:s|ematics)?\s*(?:\(\s*social\s*\)|social\b)|\bsocial\s+math(?:s|ematics)?['’]?s?\b/i,
  biology: /\bbiology\b/i,
  economics: /\beconomics\b/i,
  aptitude: /\baptitude\b|\bscholastic\s+aptitude\b/i,
  chemistry: /\bchemistry\b/i,
  history: /\bhistory\b/i,
};

type SubjectMatch = { key: string; index: number; length: number };

function marksIn(fragment: string, max: number) {
  const tokens = fragment.match(/(?<![\d.,])[0-9OolI|]{1,3}(?:[.,][0-9OolI|]{1,2})?(?![\d.,])/g) ?? [];
  return tokens.map((token) => {
    if (!/\d/.test(token)) return null;
    const normalized = token.replace(/[Oo]/g, "0").replace(/[lI|]/g, "1").replace(",", ".");
    const value = Number(normalized);
    return Number.isFinite(value) && value >= 0 && value <= max ? value : null;
  }).filter((value): value is number => value !== null);
}

/** Parse OCR text from a Grade 12 result slip into subject marks and its printed total. */
export function parseSlipText(text: string) {
  const lines = text.replace(/\r/g, "\n").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const subjects: Record<string, number> = {};

  for (const line of lines) {
    const matches: SubjectMatch[] = [];
    for (const [key] of SUBJECTS) {
      const match = SUBJECT_PATTERNS[key].exec(line);
      if (match && match.index !== undefined) matches.push({ key, index: match.index, length: match[0].length });
    }
    matches.sort((a, b) => a.index - b.index);
    matches.forEach((match, index) => {
      if (subjects[match.key] !== undefined) return;
      const start = match.index + match.length;
      const end = matches[index + 1]?.index ?? line.length;
      const [score] = marksIn(line.slice(start, end), 100);
      if (score !== undefined) subjects[match.key] = score;
    });
  }

  let extracted: number | null = null;
  for (const line of lines) {
    const total = /\b(?:total|sum)\b|ጠቅላላ/i.exec(line);
    if (!total || total.index === undefined) continue;
    const [score] = marksIn(line.slice(total.index + total[0].length), 700);
    if (score !== undefined && score > 0) { extracted = score; break; }
  }

  const count = Object.keys(subjects).length;
  const isDocument = count >= 2 || extracted !== null || /grade\s*12|eslce|esslce|eheece|entrance\s+examination|result/i.test(text);
  return { isDocument, extracted, subjects };
}

async function prepareImage(file: File) {
  const source = "createImageBitmap" in window
    ? await createImageBitmap(file)
    : await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not open the image")); };
      image.src = url;
    });
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  const scale = Math.min(3, Math.max(1, 2400 / Math.max(width, height)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image preparation is not supported by this browser");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.filter = "grayscale(1) contrast(1.2)";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source && typeof source.close === "function") source.close();
  return canvas;
}

/** Free, in-browser OCR fallback (no API key and no uploaded image data). */
export async function readSlipInBrowser(file: File) {
  const [{ createWorker, PSM }, canvas] = await Promise.all([import("tesseract.js"), prepareImage(file)]);
  const worker = await createWorker("eng");
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
    });
    const { data } = await worker.recognize(canvas);
    return parseSlipText(data.text ?? "");
  } finally {
    await worker.terminate();
  }
}
