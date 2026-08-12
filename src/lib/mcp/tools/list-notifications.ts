import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_notifications",
  title: "Ver notificaciones",
  description: "Lista las notificaciones de la persona conectada (solicitudes, likes, comentarios, muro).",
  inputSchema: {
    only_unread: z.boolean().optional().describe("Devolver solo las no leídas"),
    limit: z.number().int().optional().describe("Cuántas devolver (por defecto 20, máximo 50)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_unread, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("notifications")
      .select("id, type, entity_id, read, created_at, actor:actor_id (username, display_name)")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(take);
    if (only_unread) query = query.eq("read", false);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { items: data ?? [] },
    };
  },
});