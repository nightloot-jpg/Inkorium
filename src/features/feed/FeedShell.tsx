import type { Session } from "@supabase/supabase-js";
import { Feed, type ProfileData } from "./Feed";
import { FeedRightRail } from "./feed-right-rail";
import { RouteContentBridge, useRouteState } from "../RouteContentBridge";
import "./feed-shell.css";
import "../../player-layer-fix.css";
import "../../tuenti-chat.css";
import "../../chat-global-zindex.css";
import "../../chat-2026.css";
import "../../chat-media-2026.css";
import "../../notifications.css";
import "../../feed-layout-fixes.css";
import "../../tuenti-classic-feed.css";
import "../../topbar-modern-fix.css";
import "../../navbar-dropdown-fix.css";
import "../../navbar-dropdown-escape-fix.css";
import "../../composer-r2-fix.css";
import "../../components/composer-2026.css";
import "./feed-post-media-2026.css";
import "./feed-comments-2026.css";
import "./feed-left-rail-2026.css";
import "./feed-right-rail-2026.css";
import "../../nuenti-migration.css";
// Final visual layer: supplied Tuenti/Nuenti ZIP design.
import "../../tuenti-2026.css";
import "../../tuenti-zip-design.css";

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
