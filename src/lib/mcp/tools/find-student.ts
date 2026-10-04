import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "find_student",
  title: "Find student by code",
  description: "Staff only: look up a student and their application by student code (e.g. EPC1A2B3C4D).",
  inputSchema: { student_code: z.string().trim().min(3).describe("The student's permanent code.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ student_code }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const sb = supabaseForUser(ctx);
    const { data: prof, error } = await sb
      .from("profiles").select("id, full_name, email, phone, student_code, created_at")
      .eq("student_code", student_code.toUpperCase()).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!prof) throw new ToolError("No student found with that code, or you don't have access.");
    const { data: app } = await sb
      .from("applications").select("status, program, first_choice, second_choice, third_choice, created_at")
      .eq("user_id", prof.id).maybeSingle();
    return { content: [{ type: "text", text: JSON.stringify({ student: prof, application: app }, null, 2) }] };
  },
});
