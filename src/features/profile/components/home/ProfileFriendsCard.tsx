import { Users } from 'lucide-react';
import type { ProfileFriend } from '../../services/profile-friends.service';

type Props = {
  friends: ProfileFriend[];
  loading: boolean;
  friendsCount: number;
  onViewAll?: () => void;
};

export function ProfileFriendsCard({ friends, loading, friendsCount, onViewAll }: Props) {
  return (
    <div className="profile-view-card profile-friends-card">
      <div className="profile-view-section-head">
        <h2><Users size={16} /> Amigos ({friendsCount})</h2>
        {friendsCount > 0 && <button type="button" className="profile-view-see-all" onClick={onViewAll}>Ver todos</button>}
      </div>
      {loading ? (
        <div className="profile-friends-grid">{[1, 2, 3, 4].map(item => <span key={item} className="profile-friends-skeleton" />)}</div>
      ) : friends.length === 0 ? (
        <div className="profile-view-empty">Todavía no tiene amigos.</div>
      ) : (
        <div className="profile-friends-grid">
          {friends.map(friend => (
            <a key={friend.id} className="profile-friends-item" href={friend.username ? `/${friend.username}` : undefined}>
              {friend.avatar_url ? <img src={friend.avatar_url} alt={friend.full_name || friend.username || 'Amigo'} /> : <span className="profile-friends-fallback">{(friend.full_name || friend.username || 'U').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</span>}
              <strong>{friend.full_name || friend.username}</strong>
              {friend.username && <small>@{friend.username}</small>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
