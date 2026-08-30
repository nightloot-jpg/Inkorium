import React, { useState, useMemo } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { UserActivity, UserActivityType } from '../types';
import { 
  Clock, UserPlus, Image as ImageIcon, MessageSquare, 
  FolderPlus, UserCheck, Trash2, Camera, MessageCircle, 
  Edit3, Info
} from 'lucide-react';

interface ActivityLogProps {
  userId: string;
  userName: string;
  isOwnProfile: boolean;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ userId, userName, isOwnProfile }) => {
  const { 
    activities, 
    deleteUserActivity, 
    viewUserProfile, 
    viewPhoto, 
    viewAlbum,
    openChatWith
  } = useInkorium();

  const [activeFilter, setActiveFilter] = useState<'all' | 'friends' | 'photos' | 'status'>('all');
  const [maxDisplay, setMaxDisplay] = useState<number>(5);

  // Filter activities for this user
  const userActivities = useMemo(() => {
    const list = activities.filter(a => a.userId === userId);
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [activities, userId]);

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') return userActivities;
    if (activeFilter === 'friends') {
      return userActivities.filter(a => a.type === 'friend_added');
    }
    if (activeFilter === 'photos') {
      return userActivities.filter(a => 
        a.type === 'photo_upload' || a.type === 'photo_comment' || a.type === 'avatar_change' || a.type === 'album_created'
      );
    }
    if (activeFilter === 'status') {
      return userActivities.filter(a => 
        a.type === 'status_update' || a.type === 'wall_post' || a.type === 'info_update'
      );
    }
    return userActivities;
  }, [userActivities, activeFilter]);

  const displayedActivities = filteredActivities.slice(0, maxDisplay);

  const getActivityIcon = (type: UserActivityType) => {
    switch (type) {
      case 'avatar_change':
        return <Camera className="w-3 h-3 text-amber-600" />;
      case 'friend_added':
        return <UserCheck className="w-3 h-3 text-emerald-600" />;
      case 'photo_upload':
        return <ImageIcon className="w-3 h-3 text-blue-600" />;
      case 'photo_comment':
        return <MessageCircle className="w-3 h-3 text-indigo-600" />;
      case 'album_created':
        return <FolderPlus className="w-3 h-3 text-teal-600" />;
      case 'status_update':
        return <Edit3 className="w-3 h-3 text-purple-600" />;
      case 'wall_post':
        return <MessageSquare className="w-3 h-3 text-[#3869A0]" />;
      case 'info_update':
        return <Info className="w-3 h-3 text-cyan-600" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getActivityBadgeBg = (type: UserActivityType) => {
    switch (type) {
      case 'avatar_change':
        return 'bg-amber-50 border-amber-200';
      case 'friend_added':
        return 'bg-emerald-50 border-emerald-200';
      case 'photo_upload':
        return 'bg-blue-50 border-blue-200';
      case 'photo_comment':
        return 'bg-indigo-50 border-indigo-200';
      case 'album_created':
        return 'bg-teal-50 border-teal-200';
      case 'status_update':
        return 'bg-purple-50 border-purple-200';
      case 'wall_post':
        return 'bg-sky-50 border-sky-200';
      case 'info_update':
        return 'bg-cyan-50 border-cyan-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-2.5">
      {/* Widget Header */}
      <div className="pb-2 border-b border-gray-200 flex items-center justify-between">
        <div className="font-bold text-gray-800 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#3869A0]" />
          <span>Actividad reciente</span>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">
          {filteredActivities.length} {filteredActivities.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      {/* Mini Filter Chips */}
      <div className="flex items-center gap-1 flex-wrap pb-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
            activeFilter === 'all'
              ? 'bg-[#3869A0] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todo
        </button>
        <button
          onClick={() => setActiveFilter('friends')}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
            activeFilter === 'friends'
              ? 'bg-[#3869A0] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Amigos
        </button>
        <button
          onClick={() => setActiveFilter('photos')}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
            activeFilter === 'photos'
              ? 'bg-[#3869A0] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Fotos
        </button>
        <button
          onClick={() => setActiveFilter('status')}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
            activeFilter === 'status'
              ? 'bg-[#3869A0] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Estados
        </button>
      </div>

      {/* Widget List */}
      {displayedActivities.length === 0 ? (
        <div className="py-5 text-center text-gray-400 text-[11px]">
          <Clock className="w-5 h-5 mx-auto mb-1 opacity-30 text-gray-400" />
          <p>Sin actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-2.5 pt-0.5">
          {displayedActivities.map(activity => (
            <div 
              key={activity.id} 
              className="group bg-[#fbfcff] hover:bg-white border border-gray-100 hover:border-gray-200 rounded p-2 transition shadow-2xs space-y-1.5"
            >
              {/* Top row: Icon + Action text + Delete button */}
              <div className="flex items-start gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-2xs flex-shrink-0 mt-0.5 ${getActivityBadgeBg(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 min-w-0 text-[11px] leading-tight text-gray-700">
                  <span 
                    onClick={() => viewUserProfile(activity.userId)}
                    className="font-bold text-[#3869A0] hover:underline cursor-pointer"
                  >
                    {isOwnProfile && activity.userId === userId ? 'Tú' : activity.userName.split(' ')[0]}
                  </span>{' '}
                  <span className="text-gray-600">{activity.title}</span>
                  {activity.targetUserName && (
                    <>
                      {' '}
                      <span 
                        onClick={() => activity.targetUserId && viewUserProfile(activity.targetUserId)}
                        className="font-bold text-[#3869A0] hover:underline cursor-pointer"
                      >
                        {activity.targetUserName}
                      </span>
                    </>
                  )}
                  {activity.targetAlbumName && (
                    <>
                      {' '}
                      <span 
                        onClick={() => activity.targetAlbumId && viewAlbum(activity.targetAlbumId)}
                        className="font-bold text-[#3869A0] hover:underline cursor-pointer"
                      >
                        «{activity.targetAlbumName}»
                      </span>
                    </>
                  )}
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => deleteUserActivity(activity.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5 flex-shrink-0"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Extra visual detail */}
              {activity.type === 'avatar_change' && activity.targetPhotoUrl && (
                <div className="flex items-center gap-2 pl-6">
                  <img 
                    src={activity.targetPhotoUrl} 
                    alt="Avatar"
                    className="w-8 h-8 rounded object-cover border border-amber-200 cursor-pointer hover:opacity-80"
                    onClick={() => activity.targetPhotoId ? viewPhoto(activity.targetPhotoId) : null}
                  />
                  <span className="text-[10px] text-gray-500">Nuevo avatar</span>
                </div>
              )}

              {activity.type === 'photo_upload' && activity.targetPhotoUrl && (
                <div className="flex items-center gap-2 pl-6">
                  <img 
                    src={activity.targetPhotoUrl} 
                    alt="Foto"
                    className="w-10 h-10 rounded object-cover border border-blue-200 cursor-pointer hover:opacity-80 flex-shrink-0"
                    onClick={() => activity.targetPhotoId && viewPhoto(activity.targetPhotoId)}
                  />
                  <div className="min-w-0">
                    {activity.detail && (
                      <p className="text-[10px] text-gray-700 truncate font-medium">"{activity.detail}"</p>
                    )}
                    <button
                      onClick={() => activity.targetPhotoId && viewPhoto(activity.targetPhotoId)}
                      className="text-[10px] text-[#3869A0] hover:underline font-bold cursor-pointer"
                    >
                      Ver foto →
                    </button>
                  </div>
                </div>
              )}

              {activity.type === 'friend_added' && activity.targetUserName && (
                <div className="flex items-center justify-between pl-6 gap-2 bg-emerald-50/50 p-1 rounded border border-emerald-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {activity.targetUserAvatar && (
                      <img 
                        src={activity.targetUserAvatar} 
                        alt=""
                        className="w-6 h-6 rounded object-cover border border-emerald-200 cursor-pointer flex-shrink-0"
                        onClick={() => activity.targetUserId && viewUserProfile(activity.targetUserId)}
                      />
                    )}
                    <span 
                      onClick={() => activity.targetUserId && viewUserProfile(activity.targetUserId)}
                      className="text-[10px] font-bold text-[#3869A0] hover:underline cursor-pointer truncate"
                    >
                      {activity.targetUserName}
                    </span>
                  </div>
                  {activity.targetUserId && (
                    <button
                      onClick={() => openChatWith(activity.targetUserId!)}
                      className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded cursor-pointer flex-shrink-0"
                    >
                      Chat
                    </button>
                  )}
                </div>
              )}

              {activity.type === 'status_update' && activity.detail && (
                <p className="pl-6 text-[10px] text-gray-600 italic bg-purple-50/50 p-1 rounded border border-purple-100 line-clamp-2">
                  “{activity.detail}”
                </p>
              )}

              {activity.type === 'wall_post' && activity.detail && (
                <p className="pl-6 text-[10px] text-gray-600 italic bg-sky-50/50 p-1 rounded border border-sky-100 line-clamp-2">
                  "{activity.detail}"
                </p>
              )}

              {activity.type === 'photo_comment' && (
                <div className="flex items-center gap-1.5 pl-6">
                  {activity.targetPhotoUrl && (
                    <img 
                      src={activity.targetPhotoUrl} 
                      alt=""
                      className="w-6 h-6 rounded object-cover border border-indigo-200 cursor-pointer flex-shrink-0"
                      onClick={() => activity.targetPhotoId && viewPhoto(activity.targetPhotoId)}
                    />
                  )}
                  {activity.targetPhotoId && (
                    <button
                      onClick={() => viewPhoto(activity.targetPhotoId!)}
                      className="text-[10px] text-[#3869A0] hover:underline cursor-pointer font-medium truncate"
                    >
                      Ver comentario
                    </button>
                  )}
                </div>
              )}

              {/* Timestamp footer */}
              <div className="text-right">
                <span className="text-[9px] text-gray-400">{activity.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expand / Show More Button */}
      {filteredActivities.length > maxDisplay && (
        <div className="pt-1.5 border-t border-gray-100 text-center">
          <button
            onClick={() => setMaxDisplay(prev => prev + 5)}
            className="text-[10px] font-bold text-[#3869A0] hover:underline cursor-pointer"
          >
            Ver más ({filteredActivities.length - maxDisplay} más) ↓
          </button>
        </div>
      )}
      {maxDisplay > 5 && filteredActivities.length <= maxDisplay && (
        <div className="pt-1.5 border-t border-gray-100 text-center">
          <button
            onClick={() => setMaxDisplay(5)}
            className="text-[9px] text-gray-400 hover:underline cursor-pointer"
          >
            Mostrar menos ↑
          </button>
        </div>
      )}
    </div>
  );
};

