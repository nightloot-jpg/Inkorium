import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthenticated, supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_my_profile",
  title: "Actualizar mi perfil",
  description: "Cambia el nombre visible, el estado de ánimo, la bio o la frase favorita del perfil conectado.",
  inputSchema: {
    display_name: z.string().trim().max(60).optional().describe("Nombre visible"),
    mood: z.string().trim().max(60).optional().describe("Estado de ánimo"),
    bio: z.string().trim().max(500).optional().describe("Descripción del perfil"),
    favorite_quote: z.string().trim().max(200).optional().describe("Frase favorita"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
    if (Object.keys(patch).length === 0)
      return { content: [{ type: "text", text: "No hay nada que actualizar." }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", ctx.getUserId())
      .select("username, display_name, mood, bio, favorite_quote")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { profile: data },
    };
  },
});