import type { Session } from "@supabase/supabase-js";
import { Feed, type ProfileData } from "./Feed";
import { FeedRightRail } from "./feed-right-rail";
import { RouteContentBridge, useRouteState } from "../RouteContentBridge";
import "./feed-shell.css";

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
