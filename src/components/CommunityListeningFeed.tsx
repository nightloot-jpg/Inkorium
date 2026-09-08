import React from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { Radio, Play, Pause, Heart, Music, Headset, Sparkles, User } from 'lucide-react';
import { CommunityListeningActivity, Track } from '../types';

interface CommunityListeningFeedProps {
  activities: CommunityListeningActivity[];
  onTrackSelected?: (track: Track) => void;
}

export const CommunityListeningFeed: React.FC<CommunityListeningFeedProps> = ({
  activities,
  onTrackSelected
}) => {
  const { currentTrack, isMusicPlaying, playTrack, togglePlayMusic, viewUserProfile, updateUserData } = useInkorium();

  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-[#ccd5df] dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3869A0] to-[#2c537f] text-white px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Headset className="w-4 h-4 text-blue-200" />
          <h3 className="font-bold text-xs">Lo que están escuchando</h3>
        </div>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-semibold">
          En Vivo
        </span>
      </div>

      {/* Feed List */}
      <div className="p-3 space-y-2.5 divide-y divide-gray-100 dark:divide-slate-800">
        {activities.map((item) => {
          const isCurrent = currentTrack?.id === item.track.id;
          const isPlaying = isCurrent && isMusicPlaying;

          return (
            <div 
              key={item.id} 
              className="pt-2 first:pt-0 flex items-start gap-2.5 group"
            >
              {/* User Avatar */}
              <button
                onClick={() => viewUserProfile(item.userId)}
                className="relative flex-shrink-0 cursor-pointer"
                title={`Ver perfil de ${item.userName}`}
              >
                <img 
                  src={item.userAvatar} 
                  alt={item.userName} 
                  className="w-8 h-8 rounded object-cover border border-gray-200 dark:border-slate-700 group-hover:ring-1 group-hover:ring-[#3869A0]"
                />
                {item.isPlayingNow && (
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
                )}
              </button>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => viewUserProfile(item.userId)}
                    className="font-bold text-gray-900 dark:text-white hover:text-[#3869A0] transition truncate cursor-pointer"
                  >
                    {item.userName}
                  </button>
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                    {item.timestamp}
                  </span>
                </div>

                <div 
                  onClick={() => playTrack(item.track)}
                  className="mt-1 p-1.5 rounded bg-gray-50 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-gray-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img 
                      src={item.track.coverUrl} 
                      alt="" 
                      className="w-6 h-6 rounded object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">
                        {item.track.title}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {item.track.artist}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrent) togglePlayMusic();
                      else playTrack(item.track);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition cursor-pointer ${
                      isPlaying 
                        ? 'bg-[#3869A0] text-white' 
                        : 'bg-white dark:bg-slate-700 text-[#3869A0] dark:text-blue-300 border border-gray-200 dark:border-slate-600 hover:scale-105'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
