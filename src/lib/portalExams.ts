import type { Database } from "@/integrations/supabase/types";
export type Question = { id: string; prompt: string; type: "choice" | "short" | "paragraph"; options: string[]; points: number; required: boolean };
export type PortalExam = Database["public"]["Tables"]["portal_exams"]["Row"];
export type Attempt = Database["public"]["Tables"]["portal_exam_attempts"]["Row"];
export type Grade = Database["public"]["Tables"]["portal_exam_grades"]["Row"];
export const questionsOf = (value: unknown): Question[] => Array.isArray(value) ? value as Question[] : [];
export const newQuestion = (): Question => ({ id: crypto.randomUUID(), prompt: "", type: "choice", options: ["", ""], points: 1, required: true });
export const validAward = (points: number, max: number) => Number.isFinite(points) && points >= 0 && points <= max;
export const attemptExpired = (deadline: string, now = Date.now()) => now >= new Date(deadline).getTime();