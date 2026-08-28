import type { Session } from "@supabase/supabase-js";
import { Feed, type ProfileData } from "./Feed";
import { FeedRightRail } from "./feed-right-rail";
import { RouteContentBridge, useRouteState } from "../RouteContentBridge";
import "./feed-shell.css";
import "../../player-layer-fix.css";
import "../../tuenti-chat.css";
import "../../chat-global-zindex.css";
import "../../people-requests-light.css";
import "../../notifications.css";
import "../../feed-layout-fixes.css";
import "../../tuenti-classic-feed.css";
import "../../topbar-modern-fix.css";
import "../../navbar-dropdown-fix.css";
import "../../navbar-dropdown-escape-fix.css";
import "../../composer-r2-fix.css";
import "../../composer-2026.css";
import "./feed-post-media-2026.css";
import "./feed-comments-2026.css";
import "./feed-left-rail-2026.css";
import "./feed-right-rail-2026.css";

type Props = {
  session: Session;
  profile: ProfileData | null;
};

export function FeedShell({ session, profile }: Props) {
  const [route, navigate] = useRouteState();

  return (
    <div className="feed-shell">
      <Feed session={session} profile={profile} />
      <aside className="feed-shell-right-rail">
        <FeedRightRail userId={session.user.id} />
      </aside>
      <RouteContentBridge route={route} navigate={navigate} />
    </div>
  );
}
