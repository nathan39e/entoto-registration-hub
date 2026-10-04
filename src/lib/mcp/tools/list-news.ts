import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_news",
  title: "List college news",
  description: "List the latest published news articles from the college.",
  inputSchema: { limit: z.number().int().min(1).max(20).default(5).describe("How many articles to return.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("news_articles").select("title, summary, body, published_at")
      .eq("published", true).order("published_at", { ascending: false }).limit(limit);
    if (error) throw new ToolError(error.message);
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  },
});
