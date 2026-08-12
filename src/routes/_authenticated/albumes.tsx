import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronDown,
  Globe,
  Images,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";

import { SideMenu } from "@/components/SideMenu";
import { MediaImage } from "@/components/MediaImage";
import { CalendarWidget } from "@/components/CalendarWidget";
import { useSession } from "@/lib/session";
import {
  createAlbum,
  getAlbumPhotos,
  getAlbumsByUser,
  getFriendIds,
  getPublicAlbumsByUsers,
  type Album,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/albumes")({
  head: () => ({
    meta: [
      { title: "Mis álbumes — nocturno" },
      {
        name: "description",
        content:
          "Organiza tus fotos en álbumes: crea álbumes públicos o privados y ordena tus recuerdos.",
      },
      { property: "og:title", content: "Mis álbumes — nocturno" },
      {
        property: "og:description",
        content: "Crea y gestiona tus álbumes de fotos en nocturno.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AlbumesPage,
});

const TABS = ["Todos", "Públicos", "Privados", "Compartidos conmigo"] as const;
type Tab = (typeof TABS)[number];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const PAGE = 12;

function AlbumesPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("Todos");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"Más recientes" | "Más fotos" | "A-Z">("Más recientes");
  const [view, setView] = useState<"Cuadrícula" | "Lista">("Cuadrícula");
  const [visible, setVisible] = useState(PAGE);
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState("");
  const [priv, setPriv] = useState(false);

  const albums = useQuery({
    queryKey: ["albums", user?.id],
    queryFn: () => getAlbumsByUser(user!.id),
    enabled: Boolean(user),
  });
  const photos = useQuery({
    queryKey: ["album-photos", user?.id],
    queryFn: () => getAlbumPhotos(user!.id),
    enabled: Boolean(user),
  });
  const friendIds = useQuery({
    queryKey: ["friend-ids", user?.id],
    queryFn: () => getFriendIds(user!.id),
    enabled: Boolean(user),
  });
  const shared = useQuery({
    queryKey: ["shared-albums", friendIds.data],
    queryFn: () => getPublicAlbumsByUsers(friendIds.data ?? []),
    enabled: (friendIds.data ?? []).length > 0,
  });

  const create = useMutation({
    mutationFn: () =>
      createAlbum({ user_id: user!.id, title: title.trim(), description: "", is_private: priv }),
    onSuccess: () => {
      setTitle("");
      setPriv(false);
      setOpenForm(false);
      toast.success("Álbum creado");
      void qc.invalidateQueries({ queryKey: ["albums", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = albums.data ?? [];
  const pics = photos.data ?? [];
  const sharedRows = shared.data ?? [];

  const countOf = (id: string) => pics.filter((p) => p.album_id === id).length;
  const coverOf = (a: Album) =>
    a.cover_url ?? pics.find((p) => p.album_id === a.id)?.image_url ?? null;
  const mosaicOf = (a: Album) =>
    pics.filter((p) => p.album_id === a.id).slice(0, 4).map((p) => p.image_url);

  const list = useMemo(() => {
    const base = tab === "Compartidos conmigo" ? sharedRows : rows;
    let out = base.filter((a) => a.title.toLowerCase().includes(query.trim().toLowerCase()));
    if (tab === "Públicos") out = out.filter((a) => !a.is_private);
    if (tab === "Privados") out = out.filter((a) => a.is_private);
    if (sort === "A-Z") out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "Más fotos") out = [...out].sort((a, b) => countOf(b.id) - countOf(a.id));
    return out;
  }, [rows, sharedRows, pics, query, tab, sort]);

  const shownList = list.slice(0, visible);

  const publicCount = rows.filter((a) => !a.is_private).length;
  const privateCount = rows.filter((a) => a.is_private).length;
  const tabCount = (t: Tab) =>
    t === "Todos"
      ? rows.length
      : t === "Públicos"
        ? publicCount
        : t === "Privados"
          ? privateCount
          : sharedRows.length;

  const featured = [...rows].sort((a, b) => countOf(b.id) - countOf(a.id))[0];
  const popular = [...rows].sort((a, b) => countOf(b.id) - countOf(a.id)).slice(0, 4);
  const marks = Array.from(new Set(rows.map((a) => new Date(a.created_at).getDate())));

  const Cover = ({ a, h }: { a: Album; h: string }) => {
    const mosaic = mosaicOf(a);
    if (mosaic.length >= 4) {
      return (
        <div className={`grid grid-cols-2 grid-rows-2 gap-[2px] ${h} w-full overflow-hidden bg-[oklch(0.93_0.02_245)]`}>
          {mosaic.map((m, i) => (
            <MediaImage
              key={`${a.id}-${i}`}
              path={m}
              alt={a.title}
              className="h-full w-full object-cover"
              fallback={<span className="block h-full w-full" />}
            />
          ))}
        </div>
      );
    }
    return (
      <div className={`${h} w-full overflow-hidden bg-[oklch(0.93_0.02_245)]`}>
        <MediaImage
          path={coverOf(a)}
          alt={a.title}
          className={`${h} w-full object-cover`}
          fallback={
            <div className={`flex ${h} w-full items-center justify-center`}>
              <Images size={22} className="text-[var(--t-ink-soft)]" />
            </div>
          }
        />
      </div>
    );
  };

  return (
    <div className="t-shell min-h-screen">
      <main className="mx-auto grid max-w-6xl gap-3 px-3 py-4 lg:grid-cols-[230px_1fr_240px]">
        <aside className="space-y-3">
          <SideMenu active="albumes" />
        </aside>

        <section className="space-y-3">
          <div className="t-panel p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[oklch(0.93_0.03_245)]">
                  <Images size={18} className="text-[var(--t-blue)]" />
                </span>
                <div>
                  <h1 className="text-[18px] font-bold text-[var(--t-ink)]">Mis álbumes</h1>
                  <p className="text-[11px] text-[var(--t-ink-soft)]">
                    Todos mis recuerdos, ordenados como más te gustan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="t-btn rounded-full px-3"
                onClick={() => setOpenForm((v) => !v)}
              >
                <Plus size={12} className="mr-1 inline" /> Crear álbum
              </button>
            </div>

            {openForm ? (
              <form
                className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--t-line)] pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!title.trim()) {
                    toast.error("Ponle un título al álbum");
                    return;
                  }
                  create.mutate();
                }}
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nombre del nuevo álbum..."
                  className="min-w-[200px] flex-1 border border-[var(--t-line)] bg-white px-2 py-1.5 text-[12px] outline-none"
                />
                <label className="flex items-center gap-1.5 text-[11px] text-[var(--t-ink-soft)]">
                  <input
                    type="checkbox"
                    checked={priv}
                    onChange={(e) => setPriv(e.target.checked)}
                  />
                  Privado
                </label>
                <button type="submit" className="t-btn" disabled={create.isPending}>
                  Guardar
                </button>
              </form>
            ) : null}
          </div>

          <div className="t-panel">
            <div className="flex flex-wrap gap-4 border-b border-[var(--t-line)] px-3">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setVisible(PAGE);
                  }}
                  className={
                    t === tab
                      ? "-mb-px border-b-2 border-[var(--t-blue)] py-2 text-[12px] font-bold text-[var(--t-blue)]"
                      : "py-2 text-[12px] text-[var(--t-ink-soft)]"
                  }
                >
                  {t} <span className="text-[10px]">{tabCount(t)}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 p-3">
              <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-[var(--t-line)] bg-white px-2 py-1.5">
                <Search size={14} className="text-[var(--t-ink-soft)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar álbumes..."
                  className="w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--t-ink-soft)]"
                />
              </label>
              <div className="flex items-center gap-1 rounded-md border border-[var(--t-line)] bg-white px-2 py-1.5 text-[11px]">
                <span className="text-[var(--t-ink-soft)]">Ordenar por:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  aria-label="Ordenar álbumes"
                  className="bg-transparent text-[11px] outline-none"
                >
                  <option>Más recientes</option>
                  <option>Más fotos</option>
                  <option>A-Z</option>
                </select>
                <ChevronDown size={12} className="text-[var(--t-ink-soft)]" />
              </div>
              <div className="flex items-center gap-1 rounded-md border border-[var(--t-line)] bg-white px-2 py-1.5 text-[11px]">
                <span className="text-[var(--t-ink-soft)]">Vista:</span>
                <select
                  value={view}
                  onChange={(e) => setView(e.target.value as typeof view)}
                  aria-label="Cambiar vista"
                  className="bg-transparent text-[11px] outline-none"
                >
                  <option>Cuadrícula</option>
                  <option>Lista</option>
                </select>
                <ChevronDown size={12} className="text-[var(--t-ink-soft)]" />
              </div>
            </div>

            <div
              className={
                view === "Cuadrícula"
                  ? "grid gap-3 px-3 pb-3 sm:grid-cols-2 lg:grid-cols-4"
                  : "flex flex-col gap-2 px-3 pb-3"
              }
            >
              {shownList.length === 0 ? (
                <p className="col-span-full py-8 text-center text-[12px] text-[var(--t-ink-soft)]">
                  {tab === "Compartidos conmigo"
                    ? "Tus amigos aún no han compartido álbumes."
                    : rows.length === 0
                      ? "Todavía no tienes álbumes. Crea el primero arriba."
                      : "No hay álbumes que coincidan con tu búsqueda."}
                </p>
              ) : (
                shownList.map((a) =>
                  view === "Cuadrícula" ? (
                    <Link
                      key={a.id}
                      to="/album/$albumId"
                      params={{ albumId: a.id }}
                      className="block overflow-hidden rounded-md border border-[var(--t-line)] bg-white"
                    >
                      <Cover a={a} h="h-32" />
                      <div className="p-2">
                        <p className="truncate text-[12px] font-bold text-[var(--t-ink)]">
                          {a.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--t-ink-soft)]">
                          {formatDate(a.created_at)} · {a.is_private ? "Privado" : "Público"}
                          {a.is_private ? <Lock size={10} /> : null}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between border-t border-[var(--t-line)] pt-1.5">
                          <span className="text-[10px] text-[var(--t-ink-soft)]">
                            {countOf(a.id)} fotos
                          </span>
                          {a.is_private ? (
                            <MoreHorizontal size={13} className="text-[var(--t-ink-soft)]" />
                          ) : (
                            <Globe size={12} className="text-[var(--t-ink-soft)]" />
                          )}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      key={a.id}
                      to="/album/$albumId"
                      params={{ albumId: a.id }}
                      className="flex items-center gap-3 rounded-md border border-[var(--t-line)] bg-white p-2"
                    >
                      <span className="h-12 w-16 shrink-0 overflow-hidden">
                        <Cover a={a} h="h-12" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-bold text-[var(--t-ink)]">
                          {a.title}
                        </span>
                        <span className="block text-[10px] text-[var(--t-ink-soft)]">
                          {formatDate(a.created_at)} · {a.is_private ? "Privado" : "Público"} ·{" "}
                          {countOf(a.id)} fotos
                        </span>
                      </span>
                      {a.is_private ? (
                        <Lock size={12} className="text-[var(--t-ink-soft)]" />
                      ) : (
                        <Globe size={12} className="text-[var(--t-ink-soft)]" />
                      )}
                    </Link>
                  ),
                )
              )}
            </div>

            {list.length > visible ? (
              <div className="border-t border-[var(--t-line)] p-3 text-center">
                <button
                  type="button"
                  className="t-btn rounded-full px-4"
                  onClick={() => setVisible((v) => v + PAGE)}
                >
                  <ChevronDown size={12} className="mr-1 inline" /> Cargar más álbumes
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-3">
          <CalendarWidget marks={marks} />

          <div className="t-panel p-3">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
              Álbum destacado
            </h2>
            {featured ? (
              <>
                <Cover a={featured} h="h-24" />
                <p className="mt-2 text-[12px] font-bold text-[var(--t-ink)]">{featured.title}</p>
                <p className="text-[10px] text-[var(--t-ink-soft)]">
                  {formatDate(featured.created_at)} · {countOf(featured.id)} fotos
                </p>
                <Link
                  to="/album/$albumId"
                  params={{ albumId: featured.id }}
                  className="t-btn mt-2 inline-block rounded-full px-3"
                >
                  Ver álbum
                </Link>
              </>
            ) : (
              <p className="text-[11px] text-[var(--t-ink-soft)]">Aún no hay álbumes.</p>
            )}
          </div>

          <div className="t-panel p-3">
            <h2 className="mb-2 flex items-center justify-between border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
              Álbumes populares
              <Link to="/albumes" className="t-link text-[10px] font-normal normal-case">
                Ver todos
              </Link>
            </h2>
            {popular.length === 0 ? (
              <p className="text-[11px] text-[var(--t-ink-soft)]">Todavía nada por aquí.</p>
            ) : (
              <ul className="space-y-2">
                {popular.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className="h-8 w-8 shrink-0 overflow-hidden bg-[oklch(0.93_0.02_245)]">
                      <MediaImage
                        path={coverOf(a)}
                        alt={a.title}
                        className="h-8 w-8 object-cover"
                        fallback={<span className="block h-8 w-8" />}
                      />
                    </span>
                    <span className="min-w-0">
                      <Link
                        to="/album/$albumId"
                        params={{ albumId: a.id }}
                        className="block truncate text-[11px] font-bold text-[var(--t-blue)]"
                      >
                        {a.title}
                      </Link>
                      <span className="block text-[10px] text-[var(--t-ink-soft)]">
                        {countOf(a.id)} fotos
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="t-panel p-3">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
              Crea tu álbum
            </h2>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md border border-[var(--t-line)] p-2 text-left"
              onClick={() => setOpenForm(true)}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[oklch(0.93_0.03_245)]">
                <Plus size={16} className="text-[var(--t-blue)]" />
              </span>
              <span>
                <span className="block text-[11px] font-bold text-[var(--t-blue)]">
                  Crea un nuevo álbum
                </span>
                <span className="block text-[10px] text-[var(--t-ink-soft)]">
                  Comparte tus mejores momentos
                </span>
              </span>
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
