import React,{useEffect,useState} from "react";
import {supabase} from "./lib/supabase";

const userDisplayNameCache=new Map<string,string>();

export function getDisplayName(profile: { full_name?: string | null; username?: string | null } | null, email?: string): string {
  if (profile?.full_name) return profile.full_name;
  if (profile?.username) return profile.username;
  if (email) return email.split("@")[0];
  return "usuario";
}

export function formatPostTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}
export function parseISO8601Duration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    let formatted = "";
    if (hours > 0) {
        formatted += `${hours}:`;
        formatted += `${minutes.toString().padStart(2, '0')}:`;
    } else {
        formatted += `${minutes}:`;
    }

    formatted += `${seconds.toString().padStart(2, '0')}`;

    return formatted;
}

export function UserLink({ userId, name, avatarUrl, navigate, onClick }: { userId: string; name: string; avatarUrl?: string | null; navigate: (page: string, params?: Record<string, any>) => void; onClick?: () => void }) {
  const [displayName,setDisplayName]=useState(()=>userDisplayNameCache.get(userId)||name||"Usuario");

  useEffect(()=>{
    let active=true;
    const cached=userDisplayNameCache.get(userId);
    if(cached){setDisplayName(cached);return()=>{active=false}};
    setDisplayName(name||"Usuario");
    void supabase.from("profiles").select("full_name").eq("id",userId).maybeSingle().then(({data})=>{
      if(!active)return;
      const resolved=data?.full_name?.trim()||"Usuario";
      userDisplayNameCache.set(userId,resolved);
      setDisplayName(resolved);
    });
    return()=>{active=false};
  },[userId,name]);

  return (
    <div
      className="user-link"
      style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", transition: "opacity 0.2s" }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
        navigate("perfil", { userId });
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    >
      <div className="avatar tiny" style={{ flexShrink: 0, width: "24px", height: "24px" }}>
        {avatarUrl ? <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : displayName[0]?.toUpperCase()}
      </div>
      <strong style={{ fontSize: "0.95em" }}>{displayName}</strong>
    </div>
  );
}

// main.tsx references UserLink without importing it. Expose the component on the
// global object so the repaired legacy JSX can resolve it at runtime.
(globalThis as any).UserLink = UserLink;
