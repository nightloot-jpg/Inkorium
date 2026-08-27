import React, { StrictMode } from "react";
import { FeedShell } from "./features/feed/FeedShell";
import type { ProfileData } from "./features/feed/Feed";
import "./features/RouteContentBridge";
import "./features/route-content-bridge.css";
import "./features/route-content-bridge-header-stable-2026.css";
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
import "./features/profile/profile-final-polish-2026.css";
import "./features/profile/profile-background-fix-2026.css";
import "./features/music/music-2026.css";
import "./features/music/music-library-playlists-2026.css";
import "./features/music/music-upload-player-2026.css";
import "./features/videos/videos-2026.css";
import "./features/videos/videos-player-library-2026.css";
import "./features/videos/videos-uploader-2026.css";
import "./chat-2026.css";
import "./chat-media-2026.css";
import type { Session } from "@supabase/supabase-js";

type Props = { session: Session; profile: ProfileData | null };

export function App({ session, profile }: Props) {
  return (
    <StrictMode>
      <FeedShell session={session} profile={profile} />
    </StrictMode>
  );
}
