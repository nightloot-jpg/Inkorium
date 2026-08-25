import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useAuthStore } from "./lib/store";
import { supabase } from "./lib/supabase";
import { FeedShell } from "./features/feed/FeedShell";
import type { ProfileData } from "./features/feed/Feed";
import "./features/RouteContentBridge";
import "./components/composer-2026.css";
import "./features/feed/feed-post-media-2026.css";
import "./features/feed/feed-comments-2026.css";
import "./features/feed/feed-left-rail-2026.css";
import "./features/feed/feed-right-rail-2026.css";
import "./features/profile/profile-photos-2026.css";
import "./features/profile/profile-photos-lightbox-2026.css";
import "./features/profile/profile-albums-moments-2026.css";
import "./features/profile/profile-home-2026.css";
import "./features/profile/profile-header-tabs-2026.css";
import "./features/profile/profile-music-2026.css";
import "./features/music/music-2026.css";
import "./features/music/music-library-playlists-2026.css";
import "./features/music/music-upload-player-2026.css";
import "./features/videos/videos-2026.css";
import "./features/videos/videos-player-library-2026.css";
import "./features/videos/videos-uploader-2026.css";

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
