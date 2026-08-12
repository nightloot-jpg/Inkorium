import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "post_status",
  title: "Publicar estado",
  description: "Publica un nuevo estado en el feed de nocturno como la persona conectada.",
  inputSchema: { body: z.string().trim().min(1).max(280).describe("Texto del estado") },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ body }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("status_updates")
      .insert({ user_id: ctx.getUserId(), body })
      .select("id, body, created_at")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Estado publicado: ${body}` }],
      structuredContent: { status: data },
    };
  },
});