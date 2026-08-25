import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useAuthStore } from "./lib/store";
import { supabase } from "./lib/supabase";
import { FeedShell } from "./features/feed/FeedShell";
import type { ProfileData } from "./features/feed/Feed";
import "./features/RouteContentBridge";

async function bootstrap() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, city, avatar_url, banner_url")
    .eq("id", data.session.user.id)
    .maybeSingle();

  useAuthStore.getState().setSession(data.session);
  useAuthStore.getState().setProfile((profile as ProfileData | null) ?? null);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <FeedShell session={data.session} profile={profile as ProfileData | null} />
    </StrictMode>
  );
}

void bootstrap();
