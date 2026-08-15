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
