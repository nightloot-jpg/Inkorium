import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { getAllMessages, getMyProfile, getNotifications } from "@/lib/api";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: Boolean(user),
  });

  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: Boolean(user),
  });

  const messages = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: () => getAllMessages(user!.id),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("topbar-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => queryClient.invalidateQueries({ queryKey: ["messages"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const unreadNotifs = (notifications.data ?? []).filter((n) => !n.read).length;
  const unreadMsgs = (messages.data ?? []).filter(
    (m) => m.recipient_id === user?.id && !m.read_at,
  ).length;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", search: { next: "" }, replace: true });
  }

  if (pathname === "/auth") return null;

  return (
    <header className="t-bar sticky top-0 z-40">
      <div className="mx-auto flex h-11 max-w-6xl items-stretch gap-1 px-3">
        <Link to="/" className="flex items-center pr-4 text-lg font-bold lowercase tracking-tight">
          <span className="mr-1 text-[oklch(0.9_0.17_165)]">;)</span>nocturno
        </Link>

        {user ? (
          <>
            <nav className="hidden items-stretch sm:flex">
              <Tab to="/">Inicio</Tab>
              {profile.data ? (
                <Link
                  to="/perfil/$username"
                  params={{ username: profile.data.username }}
                  className="t-tab"
                >
                  Perfil
                </Link>
              ) : null}
              <Tab to="/mensajes" badge={unreadMsgs}>
                Mensajes
              </Tab>
              <Tab to="/fotos">Fotos</Tab>
              <Tab to="/eventos">Eventos</Tab>
              <Tab to="/gente">Gente</Tab>
              <Tab to="/amigos">Amigos</Tab>
            </nav>

            <form
              className="relative ml-auto hidden items-center sm:flex"
              onSubmit={(e) => {
                e.preventDefault();
                void navigate({ to: "/gente", search: { q: term.trim() } });
              }}
            >
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar…"
                maxLength={40}
                aria-label="Buscar gente"
                className="t-input h-6 w-44 pr-7"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-1 text-[oklch(0.55_0.03_250)]"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="ml-auto flex items-center gap-2 sm:ml-2">
              <Link
                to="/notificaciones"
                aria-label="Notificaciones"
                className="relative inline-flex items-center rounded px-2 py-1 hover:bg-[oklch(1_0_0_/_12%)]"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifs ? (
                  <span className="t-badge absolute -right-1 top-0">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                ) : null}
              </Link>
              {profile.data ? (
                <UserAvatar
                  username={profile.data.username}
                  displayName={profile.data.display_name}
                  avatarPath={profile.data.avatar_url}
                  accent={profile.data.accent_color}
                  size={26}
                />
              ) : null}
              <button
                type="button"
                aria-label="Cerrar sesión"
                onClick={() => void signOut()}
                className="inline-flex items-center rounded px-2 py-1 hover:bg-[oklch(1_0_0_/_12%)]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="ml-auto flex items-center">
            <Button asChild size="sm">
              <Link to="/auth" search={{ next: "" }}>Entrar</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

function Tab({
  to,
  badge,
  children,
}: {
  to: "/" | "/amigos" | "/mensajes" | "/gente" | "/fotos" | "/eventos";
  badge?: number;
  children: React.ReactNode;
}) {
  const search =
    to === "/mensajes"
      ? { con: "" }
      : to === "/gente"
        ? { q: "" }
        : to === "/fotos"
          ? { tab: "mias" as const }
          : undefined;
  return (
    <Link
      to={to}
      {...(search ? { search } : {})}
      className="t-tab"
      activeOptions={{ exact: to === "/" }}
      activeProps={{ className: "t-tab t-tab-active" }}
    >
      {children}
      {badge ? <span className="t-badge">{badge > 9 ? "9+" : badge}</span> : null}
    </Link>
  );
}