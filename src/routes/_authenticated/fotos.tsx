import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, ChevronDown, Images, Lock, Search, Tag, Upload } from "lucide-react";

import { SideMenu } from "@/components/SideMenu";
import { MediaImage } from "@/components/MediaImage";
import { CalendarWidget } from "@/components/CalendarWidget";
import { useSession } from "@/lib/session";
import { uploadMedia } from "@/lib/media";
import {
  createPhoto,
  getAlbumsByUser,
  getPhotosByIds,
  getPhotosByUser,
  getProfilesByIds,
  getTagsByTagger,
  getTagsWhereTagged,
  removePhotoTag,
  type Photo,
} from "@/lib/api";
import { photoSchema } from "@/lib/validation";

type Tab = "mias" | "salgo" | "etiquetas";

export const Route = createFileRoute("/_authenticated/fotos")({
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => {
    const tab = search['tab'];
    return { tab: tab === "salgo" || tab === "etiquetas" ? tab : "mias" };
  },
  head: () => ({
    meta: [
      { title: "Mis fotos — nocturno" },
      {
        name: "description",
        content:
          "Sube fotos, míralas todas, descubre en cuáles sales etiquetado y gestiona tus etiquetas.",
      },
      { property: "og:title", content: "Mis fotos — nocturno" },
      {
        property: "og:description",
        content: "Tu fotolog: subidas, fotos en las que sales y etiquetas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FotosPage,
});

function PhotoGrid({
  photos,
  empty,
  view,
}: {
  photos: Photo[];
  empty: string;
  view: "Cuadrícula" | "Lista";
}) {
  if (photos.length === 0) {
    return (
      <p className="col-span-full py-8 text-center text-[12px] text-[var(--t-ink-soft)]">{empty}</p>
    );
  }
  if (view === "Lista") {
    return (
      <>
        {photos.map((p) => (
          <Link
            key={p.id}
            to="/foto/$photoId"
            params={{ photoId: p.id }}
            className="col-span-full flex items-center gap-3 rounded-md border border-[var(--t-line)] bg-white p-2"
          >
            <MediaImage
              path={p.image_url}
              alt={p.title || "Foto"}
              className="h-12 w-16 object-cover"
              fallback={<span className="block h-12 w-16 bg-[oklch(0.93_0.02_245)]" />}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold text-[var(--t-ink)]">
                {p.title || "Sin título"}
              </span>
              <span className="block text-[10px] text-[var(--t-ink-soft)]">
                {new Date(p.created_at).toLocaleDateString("es-ES")}
              </span>
            </span>
            {p.is_private ? <Lock size={11} className="text-[var(--t-ink-soft)]" /> : null}
          </Link>
        ))}
      </>
    );
  }
  return (
    <>
      {photos.map((p) => (
        <Link
          key={p.id}
          to="/foto/$photoId"
          params={{ photoId: p.id }}
          className="block overflow-hidden rounded-md border border-[var(--t-line)] bg-white"
        >
          <MediaImage
            path={p.image_url}
            alt={p.title || "Foto"}
            className="h-28 w-full object-cover"
            fallback={
              <div className="flex h-28 w-full items-center justify-center bg-[oklch(0.93_0.02_245)]">
                <Images size={20} className="text-[var(--t-ink-soft)]" />
              </div>
            }
          />
          <div className="p-1.5">
            <p className="truncate text-[11px] font-bold text-[var(--t-ink)]">
              {p.title || "Sin título"}
            </p>
            <p className="flex items-center gap-1 text-[10px] text-[var(--t-ink-soft)]">
              {new Date(p.created_at).toLocaleDateString("es-ES")}
              {p.is_private ? <Lock size={9} /> : null}
            </p>
          </div>
        </Link>
      ))}
    </>
  );
}

function FotosPage() {
  const { user } = useSession();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priv, setPriv] = useState(false);
  const [albumId, setAlbumId] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"Cuadrícula" | "Lista">("Cuadrícula");
  const [openForm, setOpenForm] = useState(false);

  const mine = useQuery({
    queryKey: ["photos-by-user", user?.id],
    queryFn: () => getPhotosByUser(user!.id),
    enabled: Boolean(user),
  });
  const albums = useQuery({
    queryKey: ["albums", user?.id],
    queryFn: () => getAlbumsByUser(user!.id),
    enabled: Boolean(user),
  });
  const tagged = useQuery({
    queryKey: ["tags-where-tagged", user?.id],
    queryFn: () => getTagsWhereTagged(user!.id),
    enabled: Boolean(user),
  });
  const myTags = useQuery({
    queryKey: ["tags-by-tagger", user?.id],
    queryFn: () => getTagsByTagger(user!.id),
    enabled: Boolean(user),
  });

  const taggedIds = (tagged.data ?? []).map((t) => t.photo_id);
  const taggedPhotos = useQuery({
    queryKey: ["photos-by-ids", taggedIds],
    queryFn: () => getPhotosByIds(taggedIds),
    enabled: taggedIds.length > 0,
  });

  const myTagPhotoIds = (myTags.data ?? []).map((t) => t.photo_id);
  const myTagPhotos = useQuery({
    queryKey: ["photos-by-ids", myTagPhotoIds],
    queryFn: () => getPhotosByIds(myTagPhotoIds),
    enabled: myTagPhotoIds.length > 0,
  });
  const taggedPeopleIds = Array.from(new Set((myTags.data ?? []).map((t) => t.tagged_id)));
  const taggedPeople = useQuery({
    queryKey: ["profiles-by-ids", taggedPeopleIds],
    queryFn: () => getProfilesByIds(taggedPeopleIds),
    enabled: taggedPeopleIds.length > 0,
  });
  const peopleMap = new Map((taggedPeople.data ?? []).map((p) => [p.id, p]));

  const upload = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Elige una foto");
      const parsed = photoSchema.safeParse({ title, description, is_private: priv });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      const path = await uploadMedia(user!.id, file, "photos");
      await createPhoto({
        user_id: user!.id,
        image_url: path,
        ...parsed.data,
        album_id: albumId || null,
      });
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setPriv(false);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Foto subida");
      void qc.invalidateQueries({ queryKey: ["photos-by-user", user?.id] });
      void qc.invalidateQueries({ queryKey: ["album-photos", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const untag = useMutation({
    mutationFn: (photoId: string) => removePhotoTag(photoId, user!.id),
    onSuccess: () => {
      toast.success("Etiqueta quitada");
      void qc.invalidateQueries({ queryKey: ["tags-where-tagged", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMyTag = useMutation({
    mutationFn: (v: { photoId: string; taggedId: string }) => removePhotoTag(v.photoId, v.taggedId),
    onSuccess: () => {
      toast.success("Etiqueta eliminada");
      void qc.invalidateQueries({ queryKey: ["tags-by-tagger", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "mias", label: "Mis fotos", count: (mine.data ?? []).length },
    { key: "salgo", label: "Fotos en las que salgo", count: taggedIds.length },
    { key: "etiquetas", label: "Mis etiquetas", count: (myTags.data ?? []).length },
  ];

  const filter = (arr: Photo[]) =>
    arr.filter((p) => (p.title ?? "").toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="t-shell min-h-screen">
      <main className="mx-auto grid max-w-6xl gap-3 px-3 py-4 lg:grid-cols-[230px_1fr_240px]">
        <aside className="space-y-3">
          <SideMenu active="fotos" />
        </aside>

        <section className="space-y-3">
          <div className="t-panel p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[oklch(0.93_0.03_245)]">
                  <Camera size={18} className="text-[var(--t-blue)]" />
                </span>
                <div>
                  <h1 className="text-[18px] font-bold text-[var(--t-ink)]">Mis fotos</h1>
                  <p className="text-[11px] text-[var(--t-ink-soft)]">
                    Sube fotos, mira en cuáles sales y gestiona tus etiquetas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="t-btn rounded-full px-3"
                onClick={() => setOpenForm((v) => !v)}
              >
                <Upload size={12} className="mr-1 inline" /> Subir foto
              </button>
            </div>

            {openForm ? (
            <form
              className="mt-3 space-y-2 border-t border-[var(--t-line)] pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                upload.mutate();
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  aria-label="Elegir foto"
                  className="text-[11px]"
                />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título"
                  maxLength={80}
                  className="min-w-[140px] flex-1 border border-[var(--t-line)] bg-white px-2 py-1.5 text-[12px] outline-none"
                />
                <select
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  aria-label="Álbum"
                  className="border border-[var(--t-line)] bg-white px-2 py-1.5 text-[11px] outline-none"
                >
                  <option value="">Sin álbum</option>
                  {(albums.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción"
                  maxLength={500}
                  className="min-w-[200px] flex-1 border border-[var(--t-line)] bg-white px-2 py-1.5 text-[12px] outline-none"
                />
                <label className="flex items-center gap-1.5 text-[11px] text-[var(--t-ink-soft)]">
                  <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} />
                  Privada
                </label>
                <button type="submit" className="t-btn" disabled={upload.isPending}>
                  <Upload size={12} className="mr-1 inline" />
                  {upload.isPending ? "Subiendo…" : "Subir foto"}
                </button>
              </div>
            </form>
            ) : null}
          </div>

          <div className="t-panel">
            <div className="flex flex-wrap gap-4 border-b border-[var(--t-line)] px-3">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => void navigate({ to: "/fotos", search: { tab: t.key } })}
                  className={
                    t.key === tab
                      ? "-mb-px border-b-2 border-[var(--t-blue)] py-2 text-[12px] font-bold text-[var(--t-blue)]"
                      : "py-2 text-[12px] text-[var(--t-ink-soft)]"
                  }
                >
                  {t.label} <span className="text-[10px]">{t.count}</span>
                </button>
              ))}
            </div>

            {tab === "etiquetas" ? (
              <ul className="divide-y divide-[var(--t-line)] p-3 pt-0">
                {(myTags.data ?? []).length === 0 ? (
                  <li className="py-8 text-center text-[12px] text-[var(--t-ink-soft)]">
                    Todavía no has etiquetado a nadie.
                  </li>
                ) : (
                  (myTags.data ?? []).map((t) => {
                    const photo = (myTagPhotos.data ?? []).find((p) => p.id === t.photo_id);
                    const person = peopleMap.get(t.tagged_id);
                    return (
                      <li key={`${t.photo_id}-${t.tagged_id}`} className="flex items-center gap-2 py-2">
                        <Link to="/foto/$photoId" params={{ photoId: t.photo_id }}>
                          <MediaImage
                            path={photo?.image_url}
                            alt={photo?.title || "Foto etiquetada"}
                            className="h-10 w-10 object-cover"
                            fallback={
                              <div className="h-10 w-10 bg-[oklch(0.93_0.02_245)]" aria-hidden />
                            }
                          />
                        </Link>
                        <p className="min-w-0 flex-1 text-[12px]">
                          Etiquetaste a{" "}
                          {person ? (
                            <Link
                              to="/perfil/$username"
                              params={{ username: person.username }}
                              className="t-link font-bold"
                            >
                              {person.display_name || person.username}
                            </Link>
                          ) : (
                            "alguien"
                          )}{" "}
                          <span className="text-[10px] text-[var(--t-ink-soft)]">
                            {new Date(t.created_at).toLocaleDateString("es-ES")}
                          </span>
                        </p>
                        <button
                          type="button"
                          className="text-[11px] text-[var(--t-ink-soft)] hover:underline"
                          onClick={() =>
                            removeMyTag.mutate({ photoId: t.photo_id, taggedId: t.tagged_id })
                          }
                        >
                          Quitar
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 p-3 pb-0">
                  <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border border-[var(--t-line)] bg-white px-2 py-1.5">
                    <Search size={14} className="text-[var(--t-ink-soft)]" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar fotos..."
                      className="w-full bg-transparent text-[12px] outline-none placeholder:text-[var(--t-ink-soft)]"
                    />
                  </label>
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
                <div className="grid gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
                  {tab === "mias" ? (
                    <PhotoGrid
                      photos={filter(mine.data ?? [])}
                      empty="Todavía no has subido ninguna foto."
                      view={view}
                    />
                  ) : (
                    <PhotoGrid
                      photos={filter(taggedPhotos.data ?? [])}
                      empty="Nadie te ha etiquetado en ninguna foto."
                      view={view}
                    />
                  )}
                </div>
              </>
            )}

            {tab === "salgo" && (taggedPhotos.data ?? []).length > 0 ? (
              <div className="border-t border-[var(--t-line)] p-3">
                <p className="mb-1.5 text-[11px] font-bold text-[var(--t-ink)]">
                  Quitar mis etiquetas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(taggedPhotos.data ?? []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="border border-[var(--t-line)] bg-white px-2 py-1 text-[10px] text-[var(--t-ink-soft)] hover:underline"
                      onClick={() => untag.mutate(p.id)}
                    >
                      × {p.title || "Sin título"}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-3">
          <CalendarWidget
            marks={Array.from(
              new Set((mine.data ?? []).map((p) => new Date(p.created_at).getDate())),
            )}
          />
          <div className="t-panel p-3">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
              Resumen
            </h2>
            <p className="text-[11px] text-[var(--t-ink-soft)]">
              <strong className="text-[var(--t-green)]">{(mine.data ?? []).length}</strong> fotos
              subidas
            </p>
            <p className="text-[11px] text-[var(--t-ink-soft)]">
              <strong className="text-[var(--t-green)]">{taggedIds.length}</strong> fotos en las que
              sales
            </p>
            <p className="text-[11px] text-[var(--t-ink-soft)]">
              <strong className="text-[var(--t-green)]">{(myTags.data ?? []).length}</strong>{" "}
              etiquetas puestas
            </p>
          </div>

          <div className="t-panel p-3">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
              Mis álbumes
            </h2>
            {(albums.data ?? []).length === 0 ? (
              <p className="text-[11px] text-[var(--t-ink-soft)]">Aún no tienes álbumes.</p>
            ) : (
              <ul className="space-y-1">
                {(albums.data ?? []).slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <Link
                      to="/album/$albumId"
                      params={{ albumId: a.id }}
                      className="t-link text-[11px]"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/albumes" className="t-link mt-2 inline-block text-[11px] font-bold">
              Ver todos »
            </Link>
          </div>

          <div className="t-panel p-3">
            <h2 className="mb-2 flex items-center gap-1.5 border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
              <Tag size={12} /> Etiquetas
            </h2>
            <p className="text-[11px] text-[var(--t-ink-soft)]">
              Puedes etiquetar a tus amigos abriendo cualquier foto.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
