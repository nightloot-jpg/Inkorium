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
