import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});
export const lookupSchema = z.object({ id: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) });