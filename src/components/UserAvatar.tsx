import { Link } from "@tanstack/react-router";
import { MediaImage } from "@/components/MediaImage";
import { cn } from "@/lib/utils";

type Props = {
  username: string;
  displayName: string;
  avatarPath?: string | null | undefined;
  accent?: string | undefined;
  size?: number | undefined;
  className?: string | undefined;
  link?: boolean | undefined;
};

export function UserAvatar({
  username,
  displayName,
  avatarPath,
  accent = "#4f46e5",
  size = 40,
  className,
  link = true,
}: Props) {
  const inner = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border font-display text-sm font-semibold uppercase",
        className,
      )}
      style={{ width: size, height: size, borderColor: accent, backgroundColor: `${accent}33` }}
    >
      <MediaImage
        path={avatarPath}
        alt={displayName}
        className="h-full w-full object-cover"
        fallback={<span>{displayName.slice(0, 2)}</span>}
      />
    </span>
  );

  if (!link) return inner;
  return (
    <Link to="/perfil/$username" params={{ username }} aria-label={displayName}>
      {inner}
    </Link>
  );
}