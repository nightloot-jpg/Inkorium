import { defineTool } from "@lovable.dev/mcp-js";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_friends",
  title: "Ver mis amigos",
  description: "Lista los amigos aceptados y las solicitudes de amistad pendientes de la persona conectada.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const userId = ctx.getUserId();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("friendships")
      .select(
        "id, status, requester_id, addressee_id, requester:requester_id (username, display_name), addressee:addressee_id (username, display_name)",
      )
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const friends = rows.filter((r) => r.status === "accepted");
    const pending = rows.filter((r) => r.status !== "accepted");
    const payload = { friends, pending };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});