import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Camera, MapPin, Music2, Pencil, Play, Pause, Users, Video } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePlayerStore } from "../../lib/store";
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
  profileId: string;
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

function formatPlayerTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function ProfileView({ session, profile, profileId, username }: ProfileViewProps) {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState("Inicio");
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(profile);
  const [viewedProfileId, setViewedProfileId] = useState(profileId);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pendingPlay = usePlayerStore((state) => state.pendingPlay);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const pause = usePlayerStore((state) => state.pause);
  const resume = usePlayerStore((state) => state.resume);
  const openPlayer = usePlayerStore((state) => state.openPlayer);

  const isOwnProfile = viewedProfileId === session.user.id;
  const displayProfile = isOwnProfile ? profile : viewedProfile;
  const displayName = displayProfile?.full_name || displayProfile?.username || username || "Usuario";
  const handle = displayProfile?.username ? `@${displayProfile.username}` : `@${username}`;
  const avatar = displayProfile?.avatar_url || "";
  const banner = displayProfile?.banner_url || "";

  useEffect(() => {
    let cancelled = false;
    setViewedProfileId(profileId);

    async function resolveProfile() {
      if (profileId === session.user.id) {
        if (!cancelled) setViewedProfile(profile);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, bio, city, avatar_url, banner_url")
        .eq("id", profileId)
        .maybeSingle();

      if (!cancelled) {
        if (error) console.error("Error loading visited profile:", error);
        setViewedProfile((data || null) as Profile | null);
      }
    }

    void resolveProfile();
    return () => { cancelled = true; };
  }, [profile, profileId, session.user.id]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPosts(true);

    async function loadPosts() {
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, created_at, media_data")
        .eq("author_id", profileId)
        .is("group_id", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!cancelled) {
        if (error) console.error("Error loading profile posts:", error);
        setPosts((data || []) as UserPost[]);
        setLoadingPosts(false);
      }
    }

    void loadPosts();
    return () => { cancelled = true; };
  }, [profileId]);

  const postCountLabel = useMemo(() => `${posts.length}${posts.length === 20 ? "+" : ""}`, [posts.length]);
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const togglePlayback = () => {
    if (!currentSong) {
      openPlayer();
      return;
    }
    if (isPlaying || pendingPlay) pause();
    else resume();
  };

  return (
    <section className="profile-view-page">
      <div className="profile-view-cover" style={banner ? { backgroundImage: `url(${banner})` } : undefined}>
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
          <p>{displayProfile?.bio || "Comparte música, fotos y momentos en Inkorium."}</p>
          <div className="profile-view-meta">
            {displayProfile?.city && <span><MapPin size={15} /> {displayProfile.city}</span>}
            <span><Music2 size={15} /> Música</span>
            <span><Users size={15} /> Inkorium</span>
          </div>
        </div>
        {isOwnProfile && (
          <button className="profile-view-edit" type="button">
            <Pencil size={16} /> Editar perfil
          </button>
        )}
      </div>

      <div className="profile-view-tabs" role="tablist">
        {["Inicio", "Música", "Fotos", "Vídeos", "Eventos", "Amigos"].map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="profile-view-grid">
        <main className="profile-view-main">
          <div className="profile-view-card profile-view-intro-card">
            <div className="profile-view-card-title"><Music2 size={18} /> ¿Qué estás escuchando ahora?</div>
            {currentSong ? (
              <div className="profile-view-listening profile-view-listening-active">
                <button type="button" className="profile-view-listening-main" onClick={openPlayer} aria-label="Abrir el reproductor global">
                  {currentSong.thumbnail ? (
                    <img className="profile-view-listening-cover" src={currentSong.thumbnail} alt="" />
                  ) : (
                    <div className="profile-view-listening-cover profile-view-listening-cover-fallback"><Music2 size={20} /></div>
                  )}
                  <span className="profile-view-listening-copy">
                    <strong>{currentSong.title}</strong>
                    <small>{currentSong.artist || currentSong.channel_title || "Inkorium"}</small>
                    <span className="profile-view-listening-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>
                    <small>{formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}</small>
                  </span>
                </button>
                <button type="button" className="profile-view-listening-control" onClick={togglePlayback} aria-label={isPlaying || pendingPlay ? "Pausar" : "Reproducir"}>
                  {isPlaying || pendingPlay ? <Pause size={18} /> : <Play size={18} />}
                </button>
              </div>
            ) : (
              <button type="button" className="profile-view-listening" onClick={openPlayer}>
                Nada reproduciéndose ahora. Abre el reproductor global para empezar a escuchar música.
              </button>
            )}
          </div>

          <div className="profile-view-card">
            <div className="profile-view-section-head"><h2>Publicaciones</h2><span>{postCountLabel}</span></div>
            {loadingPosts ? (
              <div className="profile-view-empty">Cargando publicaciones…</div>
            ) : posts.length === 0 ? (
              <div className="profile-view-empty">Todavía no has publicado nada.</div>
            ) : (
              <div className="profile-view-posts">
                {posts.map((post) => (
                  <article key={post.id} className="profile-view-post">
                    <div className="profile-view-post-date">{new Date(post.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</div>
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
            <p>{displayProfile?.bio || "Este perfil todavía no tiene una biografía."}</p>
            {displayProfile?.city && <div className="profile-view-side-row"><MapPin size={17} /> {displayProfile.city}</div>}
          </div>
          <div className="profile-view-card">
            <h2>Tu Inkorium</h2>
            <div className="profile-view-feature"><Music2 size={18} /><span><strong>Música destacada</strong><small>La canción que escuchas ahora</small></span></div>
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
