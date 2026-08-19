import React from "react";

type ProfileRedesignProps = {
  name: string;
  username?: string | null;
  bio?: string | null;
  avatar?: string | null;
  banner?: string | null;
};

export function ProfileRedesign({ name, username, bio, avatar, banner }: ProfileRedesignProps) {
  return (
    <section className="ink-profile-redesign">
      <div className="ink-profile-cover" style={{ backgroundImage: banner ? `url(${banner})` : undefined }} />
      <div className="ink-profile-head">
        <img className="ink-profile-avatar" src={avatar || "/default-avatar.png"} alt="" />
        <div>
          <h1>{name}</h1>
          {username && <p>@{username}</p>}
          <span>{bio || "Comparte música, fotos y momentos"}</span>
        </div>
      </div>

      <nav className="ink-profile-tabs">
        <button>Inicio</button>
        <button>Música</button>
        <button>Fotos</button>
        <button>Vídeos</button>
        <button>Eventos</button>
        <button>Amigos</button>
      </nav>

      <div className="ink-profile-grid">
        <article><h3>🎧 Canción del día</h3><p>Tu música favorita aparecerá aquí</p></article>
        <article><h3>📸 Fotos</h3><p>Últimos momentos compartidos</p></article>
        <article><h3>🎉 Eventos</h3><p>Próximos eventos</p></article>
      </div>
    </section>
  );
}
