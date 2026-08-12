import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import updateMyProfile from "./tools/update-my-profile";
import postStatus from "./tools/post-status";
import listFeed from "./tools/list-feed";
import listNotifications from "./tools/list-notifications";
import listFriends from "./tools/list-friends";
import listMyPhotos from "./tools/list-my-photos";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

type McpConfig = Parameters<typeof defineMcp>[0];

const tools = [
  getMyProfile,
  updateMyProfile,
  postStatus,
  listFeed,
  listNotifications,
  listFriends,
  listMyPhotos,
] as unknown as McpConfig["tools"];

export default defineMcp({
  name: "mi-espacio-virtual",
  title: "Mi Espacio Virtual",
  version: "0.1.0",
  instructions:
    "Herramientas de la red social nocturno. Actúan siempre como la persona conectada: consultar y editar su perfil, publicar estados, leer el feed, sus notificaciones, sus amigos y su fotolog.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools,
});