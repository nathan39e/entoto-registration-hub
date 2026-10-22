import type { PsychQuestion } from "@/data/psychExam80";

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
