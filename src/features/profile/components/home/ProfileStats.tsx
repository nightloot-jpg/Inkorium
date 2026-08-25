import { Heart, Images, UserRound, Users } from 'lucide-react';
import type { ProfileStats as ProfileStatsModel } from '../../types/profile.types';

type Props = { stats: ProfileStatsModel };

export function ProfileStats({ stats }: Props) {
  return (
    <div className="profile-view-card">
      <div className="profile-view-section-head"><h2><Users size={16} /> Estadísticas</h2></div>
      <div className="profile-view-stats-list">
        <div><Users size={16} /><span>Amigos</span><strong>{stats.friends_count}</strong></div>
        <div><Heart size={16} /><span>Seguidores</span><strong>{stats.followers_count}</strong></div>
        <div><UserRound size={16} /><span>Siguiendo</span><strong>{stats.following_count}</strong></div>
        <div><Images size={16} /><span>Álbumes</span><strong>{stats.albums_count}</strong></div>
      </div>
    </div>
  );
}
