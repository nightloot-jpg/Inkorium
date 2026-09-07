import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Send, Trash2, RefreshCw, Lock, UserPlus, Info } from 'lucide-react';
import type { User, WallComment } from '../../types';
import {
  signatureEventBus,
  isSignatureForProfile,
  deduplicateAndSortSignatures,
  cleanId,
  normalizeId
} from '../../lib/signatureEventBus';

interface ProfileWallProps {
  profileUser: User;
  isOwnProfile: boolean;
  currentUser: User;
  wallComments: WallComment[];
  postWallComment: (receptorId: string, text: string) => void;
  deleteWallComment: (commentId: string) => void;
  viewUserProfile: (userId: string) => void;
  canViewWall?: boolean;
  canCommentWall?: boolean;
  onRequestFriend?: () => void;
  isPendingFriend?: boolean;
}

export const ProfileWall: React.FC<ProfileWallProps> = ({
  profileUser,
  isOwnProfile,
  currentUser,
  wallComments,
  postWallComment,
  deleteWallComment,
  viewUserProfile,
  canViewWall = true,
  canCommentWall = true,
  onRequestFriend,
  isPendingFriend = false
}) => {
  const [wallInput, setWallInput] = useState('');
  const [signatureRevision, setSignatureRevision] = useState(0);
  const [isSignatureSyncing, setIsSignatureSyncing] = useState(false);

  const bumpRevision = useCallback(() => {
    setSignatureRevision(r => r + 1);
  }, []);

  // Request latest signatures for this profile on mount or target switch
  useEffect(() => {
    const targetId = profileUser?.id || currentUser?.id;
    if (targetId) {
      signatureEventBus.requestSync(targetId, 'profile_wall_mount');
    }
  }, [profileUser?.id, currentUser?.id]);

  // Subscribe to central event bus and window custom events for immediate reactive update
  useEffect(() => {
    const isEventForCurrentProfile = (targetProfileId?: string) => {
      if (!targetProfileId || targetProfileId === '*') return true;
      const tClean = cleanId(targetProfileId);
      const tNorm = normalizeId(targetProfileId);
      const pClean = cleanId(profileUser.id);
      const pNorm = normalizeId(profileUser.id);
      const pUnameClean = cleanId(profileUser.username);
      const pUnameNorm = normalizeId(profileUser.username);
      const cClean = cleanId(currentUser.id);
      const cNorm = normalizeId(currentUser.id);
      const cUnameClean = cleanId(currentUser.username);
      const cUnameNorm = normalizeId(currentUser.username);

      return (
        tClean === pClean ||
        tNorm === pNorm ||
        (pUnameNorm && (tNorm === pUnameNorm || tClean === pUnameClean)) ||
        (isOwnProfile && (
          tClean === cClean ||
          tNorm === cNorm ||
          (cUnameNorm && (tNorm === cUnameNorm || tClean === cUnameClean))
        ))
      );
    };

    const unsubSync = signatureEventBus.on('SIGNATURES_SYNCED', (data) => {
      if (isEventForCurrentProfile(data.profileId)) {
        bumpRevision();
      }
    });

    const unsubPost = signatureEventBus.on('SIGNATURE_POSTED', (data) => {
      if (isEventForCurrentProfile(data.profileId)) {
        bumpRevision();
      }
    });

    const unsubDelete = signatureEventBus.on('SIGNATURE_DELETED', (data) => {
      if (isEventForCurrentProfile(data.profileId)) {
        bumpRevision();
      }
    });

    const unsubStatus = signatureEventBus.on('SIGNATURE_STATUS_CHANGE', (data) => {
      if (isEventForCurrentProfile(data.profileId)) {
        setIsSignatureSyncing(data.isSyncing);
      }
    });

    // Window events fallback for cross-component or SSE dispatches
    const handleWindowSigUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      const profId = customEvt.detail?.profileId || customEvt.detail?.comment?.receptorId || customEvt.detail?.comment?.propietarioId;
      if (isEventForCurrentProfile(profId)) {
        bumpRevision();
      }
    };

    window.addEventListener('inkorium:signature_update', handleWindowSigUpdate);
    window.addEventListener('inkorium:signature_bus_event', handleWindowSigUpdate);

    return () => {
      unsubSync();
      unsubPost();
      unsubDelete();
      unsubStatus();
      window.removeEventListener('inkorium:signature_update', handleWindowSigUpdate);
      window.removeEventListener('inkorium:signature_bus_event', handleWindowSigUpdate);
    };
  }, [profileUser.id, profileUser.username, currentUser.id, currentUser.username, isOwnProfile, bumpRevision]);

  // Normalized and deduplicated signatures for this profile
  const userWallComments = useMemo(() => {
    const matched = wallComments.filter(w =>
      isSignatureForProfile(w, profileUser) ||
      (isOwnProfile && isSignatureForProfile(w, currentUser))
    );
    return deduplicateAndSortSignatures(matched);
  }, [
    wallComments,
    signatureRevision,
    profileUser,
    isOwnProfile,
    currentUser
  ]);

  const handleSendWall = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = wallInput.trim();
    if (!cleanText) return;
    setWallInput('');
    postWallComment(profileUser.id, cleanText);
    signatureEventBus.requestSync(profileUser.id, 'user_send_wall');
    bumpRevision();
  };

  if (!canViewWall) {
    return (
      <div className="bg-white rounded border border-[#ccd5df] p-6 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-[#3869A0] border border-blue-200">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-gray-900">
            Tablón de firmas privado
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            El tablón de {profileUser.nombre} solo es visible para sus amigos. {isPendingFriend ? 'Ya has enviado una solicitud de amistad.' : 'Agrega a esta persona a tus amigos para leer sus firmas y dejarle un comentario.'}
          </p>
        </div>
        {onRequestFriend && !isPendingFriend && (
          <button
            type="button"
            onClick={onRequestFriend}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold text-xs rounded transition shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Añadir a mis amigos</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-[#ccd5df] p-3 text-xs shadow-xs space-y-3">
      {/* Header */}
      <div className="font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#3869A0]" />
          <span>
            {isOwnProfile ? 'Tablón de firmas de tu perfil' : `Tablón de firmas de ${profileUser.nombre}`} ({userWallComments.length})
          </span>
          {isSignatureSyncing && (
            <span className="ml-1.5 text-[10px] text-[#3869A0] font-normal flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              sincronizando...
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            signatureEventBus.requestSync(profileUser.id, 'user_tablon_click');
            bumpRevision();
          }}
          disabled={isSignatureSyncing}
          className="text-[11px] text-[#3869A0] hover:underline font-normal flex items-center gap-1 cursor-pointer disabled:opacity-50"
          title="Sincronizar firmas con la nube"
        >
          <RefreshCw className={`w-3 h-3 ${isSignatureSyncing ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Info notice for own profile */}
      {isOwnProfile && (
        <div className="p-2.5 bg-[#f0f4f8] rounded border border-[#d6e2ee] flex items-center gap-2 text-[11px] text-gray-600">
          <Info className="w-3.5 h-3.5 text-[#3869A0] flex-shrink-0" />
          <span>
            Este es tu tablón personal. Los usuarios y amigos que visiten tu perfil podrán leer y escribir firmas aquí.
          </span>
        </div>
      )}

      {/* Input to write on wall or privacy notice */}
      {canCommentWall ? (
        <form onSubmit={handleSendWall} className="space-y-2">
          <textarea
            value={wallInput}
            onChange={e => setWallInput(e.target.value)}
            placeholder={isOwnProfile ? 'Escribe una dedicatoria o nota en tu propio tablón...' : `Escribe algo en el tablón de ${profileUser.nombre}...`}
            rows={2}
            className="w-full p-2.5 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#3869A0] focus:border-[#3869A0] resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400">
              {isOwnProfile ? 'Firma visible para quienes visitan tu perfil' : '¡Déjale una firma o saludo nostálgico! :)'}
            </span>
            <button
              type="submit"
              disabled={!wallInput.trim()}
              className="px-3.5 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] disabled:bg-gray-300 text-white font-bold text-xs rounded transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <Send className="w-3 h-3" />
              <span>Firmar tablón</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>Solo los amigos de {profileUser.nombre} pueden escribir o firmar en su tablón.</span>
        </div>
      )}

      {/* Wall Comments Stream */}
      <div className="divide-y divide-gray-100 pt-2 space-y-3">
        {userWallComments.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            {isOwnProfile
              ? 'Todavía no tienes firmas en tu tablón. Tus amigos podrán firmarte al visitar tu perfil.'
              : 'Todavía no hay comentarios en este tablón. ¡Sé el primero en firmar!'}
          </div>
        ) : (
          userWallComments.map(comment => {
            const authorId = comment.autorId || comment.emisorId || '';
            const authorName = comment.autorNombre || comment.emisorNombre || 'Usuario';
            const authorAvatar = comment.autorAvatar || comment.emisorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
            const commentText = comment.texto || comment.comentario || '';
            const canDelete = isOwnProfile || authorId === currentUser.id;

            return (
              <div key={comment.id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-10 h-10 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90 flex-shrink-0"
                  onClick={() => authorId && viewUserProfile(authorId)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="flex-1 bg-[#f9fafb] p-2.5 rounded border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      onClick={() => authorId && viewUserProfile(authorId)}
                      className="font-bold text-[#3869A0] hover:underline cursor-pointer text-xs"
                    >
                      {authorName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{comment.fecha}</span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            deleteWallComment(comment.id);
                            signatureEventBus.notifySignatureDeleted(comment.id, profileUser.id);
                            bumpRevision();
                          }}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Borrar comentario del tablón"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-800 text-xs whitespace-pre-line leading-relaxed">
                    {commentText}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
