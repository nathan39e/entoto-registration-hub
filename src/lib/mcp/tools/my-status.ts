import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_status",
  title: "Get my registration status",
  description: "Return the signed-in user's profile, student code, application, payment and exam result.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const sb = supabaseForUser(ctx);
    const uid = ctx.getUserId();
    const [p, a, pay, r] = await Promise.all([
      sb.from("profiles").select("full_name, email, phone, student_code, created_at").eq("id", uid).maybeSingle(),
      sb.from("applications").select("status, program, first_choice, second_choice, third_choice, created_at").eq("user_id", uid).maybeSingle(),
      sb.from("payments").select("status, amount, program, transaction_id, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("psychometric_results").select("recommended_departments, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const err = p.error ?? a.error ?? pay.error ?? r.error;
    if (err) throw new ToolError(err.message);
    const result = { profile: p.data, application: a.data, payment: pay.data, exam: r.data };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
});
