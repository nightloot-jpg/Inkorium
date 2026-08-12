import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Images, Lock, Trash2, Upload } from "lucide-react";

import { SideMenu } from "@/components/SideMenu";
import { MediaImage } from "@/components/MediaImage";
import { useSession } from "@/lib/session";
import { uploadMedia } from "@/lib/media";
import {
  createPhoto,
  deleteAlbum,
  getAlbum,
  getPhotosByAlbum,
  updateAlbum,
  updatePhoto,
} from "@/lib/api";
import { photoSchema } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/album/$albumId")({
  head: () => ({
    meta: [
      { title: "Álbum de fotos — nocturno" },
      {
        name: "description",
        content: "Mira y organiza las fotos de este álbum: sube nuevas, cambia la portada y etiqueta.",
      },
      { property: "og:title", content: "Álbum de fotos — nocturno" },
      { property: "og:description", content: "Las fotos de este álbum en nocturno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AlbumPage,
  notFoundComponent: () => (
    <div className="t-shell min-h-screen p-10 text-center text-[12px]">Álbum no encontrado.</div>
  ),
});

function AlbumPage() {
  const { albumId } = Route.useParams();
  const { user } = useSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [priv, setPriv] = useState(false);

  const album = useQuery({ queryKey: ["album", albumId], queryFn: () => getAlbum(albumId) });
  const photos = useQuery({
    queryKey: ["photos-by-album", albumId],
    queryFn: () => getPhotosByAlbum(albumId),
  });

  const isMine = Boolean(user && album.data && album.data.user_id === user.id);

  const upload = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Elige una foto");
      const parsed = photoSchema.safeParse({
        title,
        description: "",
        is_private: priv || Boolean(album.data?.is_private),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      const path = await uploadMedia(user!.id, file, "photos");
      await createPhoto({ user_id: user!.id, image_url: path, ...parsed.data, album_id: albumId });
    },
    onSuccess: () => {
      setTitle("");
      setPriv(false);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Foto añadida al álbum");
      void qc.invalidateQueries({ queryKey: ["photos-by-album", albumId] });
      void qc.invalidateQueries({ queryKey: ["album-photos", user?.id] });
      void qc.invalidateQueries({ queryKey: ["photos-by-user", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setCover = useMutation({
    mutationFn: (path: string) => updateAlbum(albumId, { cover_url: path }),
    onSuccess: () => {
      toast.success("Portada actualizada");
      void qc.invalidateQueries({ queryKey: ["album", albumId] });
      void qc.invalidateQueries({ queryKey: ["albums", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const detach = useMutation({
    mutationFn: (photoId: string) => updatePhoto(photoId, { album_id: null }),
    onSuccess: () => {
      toast.success("Foto sacada del álbum");
      void qc.invalidateQueries({ queryKey: ["photos-by-album", albumId] });
      void qc.invalidateQueries({ queryKey: ["album-photos", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAlbum = useMutation({
    mutationFn: () => deleteAlbum(albumId),
    onSuccess: () => {
      toast.success("Álbum eliminado");
      void qc.invalidateQueries({ queryKey: ["albums", user?.id] });
      void navigate({ to: "/albumes" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = photos.data ?? [];

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
                <Images size={22} className="mt-0.5 text-[var(--t-blue)]" />
                <div>
                  <h1 className="text-[16px] font-bold text-[var(--t-ink)]">
                    {album.data?.title ?? "Álbum"}
                  </h1>
                  <p className="flex items-center gap-1 text-[11px] text-[var(--t-ink-soft)]">
                    {rows.length} fotos ·{" "}
                    {album.data?.is_private ? (
                      <>
                        Privado <Lock size={10} />
                      </>
                    ) : (
                      <>
                        Público <Globe size={10} />
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Link to="/albumes" className="t-link text-[11px] font-bold">
                « Mis álbumes
              </Link>
            </div>

            {isMine ? (
              <form
                className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--t-line)] pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  upload.mutate();
                }}
              >
                <input ref={fileRef} type="file" accept="image/*" aria-label="Elegir foto" className="text-[11px]" />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la foto"
                  maxLength={80}
                  className="min-w-[160px] flex-1 border border-[var(--t-line)] bg-white px-2 py-1.5 text-[12px] outline-none"
                />
                <label className="flex items-center gap-1.5 text-[11px] text-[var(--t-ink-soft)]">
                  <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} />
                  Privada
                </label>
                <button type="submit" className="t-btn" disabled={upload.isPending}>
                  <Upload size={12} className="mr-1 inline" />
                  {upload.isPending ? "Subiendo…" : "Añadir foto"}
                </button>
              </form>
            ) : null}
          </div>

          <div className="t-panel p-3">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {rows.length === 0 ? (
                <p className="col-span-full py-8 text-center text-[12px] text-[var(--t-ink-soft)]">
                  Este álbum todavía no tiene fotos.
                </p>
              ) : (
                rows.map((p) => (
                  <article key={p.id} className="border border-[var(--t-line)] bg-white">
                    <Link to="/foto/$photoId" params={{ photoId: p.id }}>
                      <MediaImage
                        path={p.image_url}
                        alt={p.title || "Foto del álbum"}
                        className="h-28 w-full object-cover"
                        fallback={
                          <div className="flex h-28 w-full items-center justify-center bg-[oklch(0.93_0.02_245)]">
                            <Images size={20} className="text-[var(--t-ink-soft)]" />
                          </div>
                        }
                      />
                    </Link>
                    <div className="p-1.5">
                      <p className="truncate text-[11px] font-bold text-[var(--t-ink)]">
                        {p.title || "Sin título"}
                      </p>
                      {isMine ? (
                        <div className="mt-1 flex items-center justify-between">
                          <button
                            type="button"
                            className="text-[10px] text-[var(--t-blue)] hover:underline"
                            onClick={() => setCover.mutate(p.image_url)}
                          >
                            Portada
                          </button>
                          <button
                            type="button"
                            className="text-[10px] text-[var(--t-ink-soft)] hover:underline"
                            onClick={() => detach.mutate(p.id)}
                          >
                            Sacar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="t-panel p-3">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
              Sobre el álbum
            </h2>
            <p className="text-[11px] text-[var(--t-ink-soft)]">
              {album.data?.description || "Sin descripción."}
            </p>
            {isMine ? (
              <button
                type="button"
                className="mt-2 flex items-center gap-1 text-[11px] text-[var(--t-ink-soft)] hover:underline"
                onClick={() => removeAlbum.mutate()}
              >
                <Trash2 size={11} /> Eliminar álbum
              </button>
            ) : null}
          </div>

          <div className="t-panel p-3">
            <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[12px] font-bold uppercase text-[var(--t-ink)]">
              Etiquetas
            </h2>
            <p className="text-[11px] text-[var(--t-ink-soft)]">
              Abre una foto para etiquetar a tus amigos y ver quién sale en ella.
            </p>
            <Link to="/fotos" search={{ tab: "salgo" }} className="t-link mt-2 inline-block text-[11px] font-bold">
              Fotos en las que salgo »
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}
