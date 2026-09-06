import React from 'react';
import { Star } from 'lucide-react';
import type { User } from '../../types';

interface ProfileTopFriendsProps {
  profileUser: User;
  isOwnProfile: boolean;
  topAmigosList: User[];
  friendsList: User[];
  viewUserProfile: (userId: string) => void;
  onEditTop: () => void;
}

export const ProfileTopFriends: React.FC<ProfileTopFriendsProps> = ({
  profileUser,
  isOwnProfile,
  topAmigosList,
  friendsList,
  viewUserProfile,
  onEditTop
}) => {
  const displayList = topAmigosList.length > 0 ? topAmigosList : friendsList.slice(0, 6);
  const count = topAmigosList.length > 0 ? topAmigosList.length : Math.min(friendsList.length, 6);

  return (
    <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-2.5">
      <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-900">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>Top Amigos</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
            {count}/8
          </span>
        </div>
        {isOwnProfile && (
          <button
            type="button"
            onClick={onEditTop}
            className="text-[#3869A0] hover:underline font-bold text-[11px] cursor-pointer"
          >
            Editar Top
          </button>
        )}
      </div>

      {topAmigosList.length === 0 && friendsList.length === 0 ? (
        <p className="text-[11px] text-gray-400 py-2 text-center">
          Aún no hay amigos en el Top.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {displayList.map((friend) => (
            <div
              key={friend.id}
              onClick={() => viewUserProfile(friend.id)}
              className="cursor-pointer group text-center space-y-1 relative"
            >
              <div className="relative">
                <img
                  src={friend.avatar}
                  alt={friend.nombre}
                  className="w-full aspect-square object-cover rounded border border-gray-200 group-hover:border-[#3869A0] transition"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
                  }}
                />
                <span
                  className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-white ${
                    friend.online || friend.presencia === 'conectado' ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-400 absolute top-0.5 left-0.5 drop-shadow-xs" />
              </div>
              <p className="text-[10px] font-semibold text-[#3869A0] group-hover:underline truncate">
                {friend.nombre}
              </p>
            </div>
          ))}
        </div>
      )}

      {isOwnProfile && topAmigosList.length === 0 && friendsList.length > 0 && (
        <div className="pt-2 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={onEditTop}
            className="text-[11px] text-[#3869A0] font-bold hover:underline cursor-pointer"
          >
            ★ Personalizar mis 6-8 amigos del Top
          </button>
        </div>
      )}
    </div>
  );
};
