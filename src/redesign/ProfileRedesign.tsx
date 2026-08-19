import React from "react";
import "./profile-reference.css";

type ProfileRedesignProps = {
  name: string;
  username?: string | null;
  bio?: string | null;
  avatar?: string | null;
  banner?: string | null;
};

export function ProfileRedesign({ name, username, bio, avatar, banner }: ProfileRedesignProps) {
  return (
    <section className="profile-reference-page">
      <div className="profile-cover" style={{ backgroundImage: banner ? `url(${banner})` : undefined }} />
      <div className="profile-header">
        <img className="profile-avatar" src={avatar || "/default-avatar.png"} alt="" />
        <div className="profile-info">
          <h1>{name} <span className="verified">✓</span></h1>
          {username && <p>@{username}</p>}
          <span>{bio || "Comparte música, fotos y momentos"}</span>
          <div className="profile-meta">📍 Madrid, España · 🎵 Música · ✨ Inkorium</div>
        </div>
        <button className="profile-button">Editar perfil</button>
      </div>
      <nav className="profile-tabs">
        <span className="active">Inicio</span>
        <span>Música</span>
        <span>Fotos</span>
        <span>Vídeos</span>
        <span>Eventos</span>
        <span>Amigos</span>
      </nav>
      <div className="profile-columns">
        <main>
          <div className="profile-card composer-card">¿Qué estás escuchando ahora?</div>
          <div className="profile-card">Publicaciones del usuario</div>
        </main>
        <aside>
          <div className="profile-card">🎧 Reproductor</div>
          <div className="profile-card">🎵 Música destacada</div>
          <div className="profile-card">🎉 Próximos eventos</div>
          <div className="profile-card">👥 Amigos en común</div>
        </aside>
      </div>
    </section>
  );
}
