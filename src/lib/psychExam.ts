import type { PsychQuestion } from "@/data/psychExam80";
import { DEPARTMENTS } from "@/data/departments";

// The exam's section labels differ from the admissions department catalog.
const DEPARTMENT_CATEGORY_ALIASES: Record<string, string> = {
  "Construction Technology and Wood Work": "Construction Technology",
  "Metal Technology": "Wood Work and Metal Technology",
};

/** Keep skill scores for results, but recommend only an actual admissions department. */
export const recommendPsychDepartments = (scores: Record<string, number>): string[] => {
  const departmentScores = new Map<string, number>();
  for (const [category, score] of Object.entries(scores)) {
    const department = DEPARTMENT_CATEGORY_ALIASES[category] ?? category;
    if (DEPARTMENTS.includes(department) && Number.isFinite(score)) {
      departmentScores.set(department, Math.max(departmentScores.get(department) ?? -Infinity, score));
    }
  }
  // Catalog order breaks equal-score ties independently of question/insertion order.
  return DEPARTMENTS.filter((department) => departmentScores.has(department))
    .sort((a, b) => (departmentScores.get(b) ?? 0) - (departmentScores.get(a) ?? 0))
    .slice(0, 1);
};

/** Answer removes the current question; skip moves it to the end so it returns after the rest. */
export const nextQueue = (queue: number[], action: "answer" | "skip") =>
  action === "answer" ? queue.slice(1) : [...queue.slice(1), queue[0]];

/** Scores only questions with an answer key; personality items (answer null) are excluded. */
export const gradePsychExam = (questions: PsychQuestion[], answers: Record<string, number>) => {
  const scored = questions.filter((q) => q.answer !== null);
  const tally: Record<string, { c: number; t: number }> = {};
  const missed: { q: PsychQuestion; chosen?: number }[] = [];
  let correct = 0;
  for (const q of scored) {
    tally[q.cat] ??= { c: 0, t: 0 };
    tally[q.cat].t++;
    if (answers[q.n] === q.answer) { correct++; tally[q.cat].c++; }
    else missed.push({ q, chosen: answers[q.n] });
  }
  const scores = Object.fromEntries(Object.entries(tally).map(([k, v]) => [k, Math.round((v.c / v.t) * 100)]));
  return { correct, total: scored.length, percent: Math.round((correct / scored.length) * 100), missed, scores };
};
