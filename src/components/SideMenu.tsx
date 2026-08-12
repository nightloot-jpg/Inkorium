import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bookmark,
  Calendar as CalendarIcon,
  FileText,
  Home,
  Image as ImageIcon,
  Music,
  Settings,
  Users,
  Video,
} from "lucide-react";

import { useSession } from "@/lib/session";
import { getMyProfile } from "@/lib/api";
import { UserAvatar } from "@/components/UserAvatar";

type Active = "novedades" | "eventos" | "fotos" | "albumes" | "ajustes" | null;

export function SideMenu({ active = null }: { active?: Active }) {
  const { user } = useSession();
  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: Boolean(user),
  });
  const data = profile.data;
  const cls = (key: Active) => `t-menu-item${active === key ? " t-menu-item-active" : ""}`;
  const fotosActive = active === "fotos" || active === "albumes";

  return (
    <>
      <div className="t-panel p-3">
        <div className="flex gap-3">
          <UserAvatar
            username={data?.username ?? ""}
            displayName={data?.display_name ?? ""}
            avatarPath={data?.avatar_url ?? undefined}
            accent={data?.accent_color ?? undefined}
            size={56}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-[var(--t-ink)]">
              {data?.display_name ?? "…"}
            </p>
            <p className="truncate text-[11px] text-[var(--t-ink-soft)]">
              {data?.mood || "Sin estado de ánimo"}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--t-green)]">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--t-green)]" aria-hidden />
              Conectado
            </p>
          </div>
        </div>
        {data ? (
          <Link
            to="/perfil/$username"
            params={{ username: data.username }}
            className="t-link mt-2 inline-block text-[11px] font-bold"
          >
            Ver mi perfil »
          </Link>
        ) : null}
      </div>

      <nav className="t-panel p-1.5">
        <Link to="/" className={cls("novedades")}>
          <Home size={15} className="t-menu-ico" /> Novedades
        </Link>
        <Link to="/eventos" className={cls("eventos")}>
          <CalendarIcon size={15} className="t-menu-ico" /> Eventos
          <span className="t-menu-count">2</span>
        </Link>
        <Link
          to="/fotos"
          search={{ tab: "mias" as const }}
          className={`t-menu-item${fotosActive ? " t-menu-item-active" : ""}`}
        >
          <ImageIcon size={15} className="t-menu-ico" /> Fotos
        </Link>
        {fotosActive ? (
          <div className="mb-1 ml-9 flex flex-col gap-0.5">
            <Link
              to="/albumes"
              className="text-[11px] font-bold text-[var(--t-blue)] hover:underline"
            >
              Mis álbumes
            </Link>
            <Link
              to="/fotos"
              search={{ tab: "salgo" as const }}
              className="text-[11px] text-[var(--t-ink-soft)] hover:underline"
            >
              Fotos en las que salgo
            </Link>
            <Link
              to="/fotos"
              search={{ tab: "etiquetas" as const }}
              className="text-[11px] text-[var(--t-ink-soft)] hover:underline"
            >
              Mis etiquetas
            </Link>
          </div>
        ) : null}
        <span className="t-menu-item">
          <Video size={15} className="t-menu-ico" /> Vídeos
        </span>
        <span className="t-menu-item">
          <Music size={15} className="t-menu-ico" /> Música
        </span>
        <Link to="/gente" search={{ q: "" }} className="t-menu-item">
          <Users size={15} className="t-menu-ico" /> Grupos
        </Link>
        <span className="t-menu-item">
          <FileText size={15} className="t-menu-ico" /> Páginas
        </span>
        <span className="t-menu-item">
          <BarChart3 size={15} className="t-menu-ico" /> Encuestas
        </span>
        <span className="t-menu-item">
          <Bookmark size={15} className="t-menu-ico" /> Guardados
        </span>
        <Link to="/ajustes" className={cls("ajustes")}>
          <Settings size={15} className="t-menu-ico" /> Configuración
        </Link>
      </nav>
    </>
  );
}
