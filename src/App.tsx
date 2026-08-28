import React, { StrictMode } from "react";
import { FeedShell } from "./features/feed/FeedShell";
import type { ProfileData } from "./features/feed/Feed";

type Props = { session: import("@supabase/supabase-js").Session; profile: ProfileData | null };

export function App({ session, profile }: Props) {
  return (
    <StrictMode>
      <FeedShell session={session} profile={profile} />
    </StrictMode>
  );
}
