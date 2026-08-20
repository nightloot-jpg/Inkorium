import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Camera, MapPin, Music2, Pencil, Users, Video } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import "./profile-view.css";

type Profile = {
  id?: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

type ProfileViewProps = {
  session: Session;
  profile: Profile | null;
  username: string;
};

type UserPost = {
  id: string;
  content: string | null;
  created_at: string;
  media_data?: any;
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

export function ProfileView({ session, profile, username }: ProfileViewProps) {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState("Inicio");

  const displayName = profile?.full_name || profile?.username || username || "Usuario";
  const handle = profile?.username ? `@${profile.username}` : `@${username}`;
  const avatar = profile?.avatar_url || "";
  const banner = profile?.banner_url || "";

  useEffect(() => {
    let cancelled = false;
    async function loadPosts() {
      setLoadingPosts(true);
      const { data } = await supabase
        .from("posts")
        .select("id, content, created_at, media_data")
        .eq("author_id", session.user.id)
        .is("group_id", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!cancelled) {
        setPosts((data || []) as UserPost[]);
        setLoadingPosts(false);
      }
    }
    void loadPosts();
    return () => { cancelled = true; };
  }, [session.user.id]);

  const postCountLabel = useMemo(() => `${posts.length}${posts.length === 20 ? "+" : ""}`, [posts.length]);

  return (
    <section className="profile-view-page">
      <div
        className="profile-view-cover"
        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
      >
        {!banner && <div className="profile-view-cover-placeholder" />}
      </div>

      <div className="profile-view-header">
        <div className="profile-view-avatar-wrap">
          {avatar ? (
            <img className="profile-view-avatar" src={avatar} alt={displayName} />
          ) : (
            <div className="profile-view-avatar profile-view-avatar-fallback">{initials(displayName)}</div>
          )}
        </div>
        <div className="profile-view-identity">
          <div className="profile-view-name-row">
            <h1>{displayName}</h1>
            <span className="profile-view-verified" aria-label="Perfil verificado">✓</span>
          </div>
          <div className="profile-view-handle">{handle}</div>
          <p>{profile?.bio || "Comparte música, fotos y momentos en Inkorium."}</p>
          <div className="profile-view-meta">
            {profile?.city && <span><MapPin size={15} /> {profile.city}</span>}
            <span><Music2 size={15} /> Música</span>
            <span><Users size={15} /> Inkorium</span>
          </div>
        </div>
        <button className="profile-view-edit" type="button">
          <Pencil size={16} /> Editar perfil
        </button>
      </div>

      <div className="profile-view-tabs" role="tablist">
        {["Inicio", "Música", "Fotos", "Vídeos", "Eventos", "Amigos"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="profile-view-grid">
        <main className="profile-view-main">
          <div className="profile-view-card profile-view-intro-card">
            <div className="profile-view-card-title"><Music2 size={18} /> ¿Qué estás escuchando ahora?</div>
            <div className="profile-view-listening">Añade tu música del día desde el feed.</div>
          </div>

          <div className="profile-view-card">
            <div className="profile-view-section-head">
              <h2>Publicaciones</h2>
              <span>{postCountLabel}</span>
            </div>
            {loadingPosts ? (
              <div className="profile-view-empty">Cargando publicaciones…</div>
            ) : posts.length === 0 ? (
              <div className="profile-view-empty">Todavía no has publicado nada.</div>
            ) : (
              <div className="profile-view-posts">
                {posts.map((post) => (
                  <article key={post.id} className="profile-view-post">
                    <div className="profile-view-post-date">
                      {new Date(post.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    {post.content && <p>{post.content}</p>}
                    {post.media_data?.type === "photo" && <img src={post.media_data.url} alt="Publicación" />}
                    {post.media_data?.type === "video" && <div className="profile-view-media-label"><Video size={16} /> Vídeo compartido</div>}
                    {post.media_data?.type === "youtube_song" && <div className="profile-view-media-label"><Music2 size={16} /> Música compartida</div>}
                    {!post.content && !post.media_data && <p className="muted">Publicación sin texto.</p>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="profile-view-side">
          <div className="profile-view-card">
            <h2>Sobre mí</h2>
            <p>{profile?.bio || "Este perfil todavía no tiene una biografía."}</p>
            {profile?.city && <div className="profile-view-side-row"><MapPin size={17} /> {profile.city}</div>}
          </div>
          <div className="profile-view-card">
            <h2>Tu Inkorium</h2>
            <div className="profile-view-feature"><Music2 size={18} /><span><strong>Música destacada</strong><small>Tu canción del día</small></span></div>
            <div className="profile-view-feature"><Camera size={18} /><span><strong>Fotos</strong><small>Comparte tus momentos</small></span></div>
            <div className="profile-view-feature"><CalendarDays size={18} /><span><strong>Eventos</strong><small>Descubre y organiza planes</small></span></div>
          </div>
          <div className="profile-view-card profile-view-stats">
            <div><strong>{postCountLabel}</strong><span>Publicaciones</span></div>
            <div><strong>0</strong><span>Amigos</span></div>
            <div><strong>0</strong><span>Seguidores</span></div>
          </div>
        </aside>
      </div>
    </section>
  );
}
