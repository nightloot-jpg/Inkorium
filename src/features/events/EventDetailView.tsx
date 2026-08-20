import React, { useState } from "react";
import { ChevronLeft, Share2, MapPin, CalendarDays, Clock3 } from "lucide-react";
import { type EventItem } from "./EventsView";

export function EventDetailView({ event, onBack }: { event: EventItem, onBack: () => void }) {
  const [isFollowing, setIsFollowing] = useState(false);

  // Fallback data mapping if actual data is missing
  const title = event.title || "Noche de San Juan";
  const dateStr = event.date || "2026-06-23";
  const timeStr = event.time || "23:00";
  const city = event.city || "Elche, Alicante";
  const imageUrl = event.image || "https://images.unsplash.com/photo-1533174000220-db635db15eb8?auto=format&fit=crop&w=900&q=80";
  const category = event.category || "Fiestas";

  const formattedDate = new Date(`${dateStr}T12:00:00`).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long" }).toUpperCase();
  const formattedTime = timeStr;

  return (
    <div className="event-detail-container events-panel">
      <style>{`
        .event-detail-container {
          background: #fff;
          border-radius: 5px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .event-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #e4e7ee;
          background: #fff;
        }
        .event-detail-header button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #17243a;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          padding: 0;
        }
        .event-detail-cover {
          width: 100%;
          height: 240px;
          object-fit: cover;
          display: block;
        }
        .event-detail-content {
          padding: 24px;
        }
        .event-detail-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 16px 0;
          color: #17243a;
        }
        .event-detail-info-row {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
          color: #58708a;
          font-size: 15px;
        }
        .event-detail-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .event-detail-organizer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .organizer-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .organizer-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ff5a00;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
        }
        .organizer-details h4 {
          margin: 0;
          font-size: 16px;
          color: #17243a;
        }
        .organizer-details span {
          font-size: 13px;
          color: #58708a;
        }
        .btn-follow {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: 1px solid #e4e7ee;
          background: white;
          color: #17243a;
        }
        .btn-follow.following {
          background: #f1f5f9;
        }
        .event-detail-actions {
          margin-bottom: 32px;
        }
        .btn-buy {
          width: 100%;
          padding: 16px;
          background: #5b2db5;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }
        .btn-buy span {
          font-weight: 400;
          opacity: 0.9;
        }
        .event-detail-section {
          margin-bottom: 24px;
        }
        .event-detail-section h3 {
          font-size: 18px;
          margin: 0 0 12px 0;
          color: #17243a;
        }
        .event-detail-section p {
          color: #58708a;
          line-height: 1.6;
          margin: 0;
        }
        .event-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .event-tag {
          padding: 6px 12px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }
      `}</style>

      <div className="event-detail-header">
        <button onClick={onBack}>
          <ChevronLeft size={20} /> Eventos
        </button>
        <button onClick={() => {
          if (navigator.share) {
            navigator.share({ title: title, text: `Mira este evento: ${title}`, url: window.location.href }).catch(()=>{});
          } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Enlace copiado al portapapeles");
          }
        }}>
          <Share2 size={18} />
        </button>
      </div>

      <img src={imageUrl} alt={title} className="event-detail-cover" />

      <div className="event-detail-content">
        <h1 className="event-detail-title">{title}</h1>

        <div className="event-detail-info-row">
          <div className="event-detail-info-item">
            <CalendarDays size={18} />
            <span>{formattedDate}</span>
          </div>
          <div className="event-detail-info-item">
            <Clock3 size={18} />
            <span>{formattedTime}</span>
          </div>
          <div className="event-detail-info-item">
            <MapPin size={18} />
            <span>{city}</span>
          </div>
        </div>

        <div className="event-detail-organizer">
          <div className="organizer-info">
            <div className="organizer-avatar">
              AS
            </div>
            <div className="organizer-details">
              <h4>Aperol Spritz</h4>
              <span>23.4K seguidores</span>
            </div>
          </div>
          <button
            className={`btn-follow ${isFollowing ? 'following' : ''}`}
            onClick={() => setIsFollowing(!isFollowing)}
          >
            {isFollowing ? 'Siguiendo' : 'Seguir'}
          </button>
        </div>

        <div className="event-detail-actions">
          <button className="btn-buy" onClick={() => alert("Función de compra no disponible actualmente.")}>
            Comprar Entradas <span>· A partir de 15,00€</span>
          </button>
        </div>

        <div className="event-detail-section">
          <h3>Acerca del evento</h3>
          <p>
            Prepárate para la mejor noche del verano. Ven a celebrar la noche de San Juan con nosotros
            en un evento inolvidable lleno de música, buen ambiente y muchas sorpresas.
            ¡No te lo puedes perder!
          </p>
        </div>

        <div className="event-detail-section">
          <h3>Categorías</h3>
          <div className="event-tags">
            <span className="event-tag">{category}</span>
            <span className="event-tag">Reggaeton</span>
            <span className="event-tag">Techno</span>
            <span className="event-tag">House</span>
            <span className="event-tag">18+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
