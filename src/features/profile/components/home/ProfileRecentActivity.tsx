import { MoreHorizontal, Sparkles } from 'lucide-react';
import { formatPostTime } from '../../../../utils';
import type { ProfileActivityItem } from '../../services/profile-activity.service';

type Props = {
  items: ProfileActivityItem[];
  loading: boolean;
  displayName: string;
  avatar: string;
};

export function ProfileRecentActivity({ items, loading, displayName, avatar }: Props) {
  return (
    <div className="profile-view-card profile-activity-card">
      <div className="profile-view-section-head"><h2><Sparkles size={17} /> Actividad reciente</h2></div>
      {loading ? (
        <div className="profile-view-empty">Cargando actividad...</div>
      ) : items.length === 0 ? (
        <div className="profile-view-empty">Todavía no hay actividad reciente.</div>
      ) : (
        <div className="profile-activity-list">
          {items.map(item => (
            <article key={item.id} className="profile-activity-item">
              <div className="profile-activity-item-head">
                {avatar ? <img className="profile-activity-avatar" src={avatar} alt={displayName} /> : <span className="profile-activity-avatar profile-activity-avatar-fallback">{displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span>}
                <div>
                  <strong>{displayName}</strong>
                  <small>{formatPostTime(item.created_at)}</small>
                </div>
                <button type="button" className="profile-activity-menu" aria-label="Más opciones"><MoreHorizontal size={16} /></button>
              </div>
              {item.content && <p>{item.content}</p>}
              {item.media_data?.type === 'photo' && item.media_data?.url && <img className="profile-activity-media" src={item.media_data.url} alt="" />}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
