import { useSignedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function MediaImage({
  path,
  alt,
  className,
  fallback,
}: {
  path?: string | null | undefined;
  alt: string;
  className?: string | undefined;
  fallback?: React.ReactNode | undefined;
}) {
  const isExternal = Boolean(path && /^https?:\/\//.test(path));
  const { data, isLoading } = useSignedUrl(isExternal ? undefined : path);

  if (isExternal) {
    return <img src={path as string} alt={alt} loading="lazy" className={className} />;
  }

  if (!path || (!data && !isLoading)) {
    return <>{fallback ?? <div className={cn("bg-muted", className)} aria-hidden />}</>;
  }
  if (!data) return <div className={cn("bg-muted animate-pulse", className)} aria-hidden />;
  return <img src={data} alt={alt} loading="lazy" className={className} />;
}