export const SUBJECTS = [["english", "English"], ["physics", "Physics"], ["civics", "Civics"], ["geography", "Geography"], ["naturalMath", "Natural Math"], ["biology", "Biology"], ["socialMath", "Social Math"], ["economics", "Economics"], ["aptitude", "Aptitude"], ["chemistry", "Chemistry"], ["history", "History"]] as const;

const mark = (value: unknown, max: number): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) return null;
  return Math.round(value * 100) / 100;
};

export function normalizeGradeResult(raw: Record<string, unknown>) {
  const isDocument = raw.is_result_document === true;
  const source = raw.subject_marks && typeof raw.subject_marks === "object" ? raw.subject_marks as Record<string, unknown> : {};
  const subjects: Record<string, number> = {};
  if (isDocument) for (const [key] of SUBJECTS) {
    const score = mark(source[key], 100);
    if (score !== null) subjects[key] = score;
  }
  return { isDocument, extracted: isDocument ? mark(raw.score, 700) : null, subjects };
}