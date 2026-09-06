import { useEffect, useRef, useCallback } from 'react';
import { useInkorium, toProfileAvatarUrl } from '../context/InkoriumContext';
import { broadcastCrossTabEvent } from '../lib/chatHistory';
import type { User, UserPresence } from '../types';

const PENDING_PROFILE_KEY = 'inkorium:pending-public-profile';

function normalizeUserId(id?: string): string {
  return String(id || '').trim().toLowerCase().replace(/^user-/, '');
}

function matchesTarget(profile: any, target: string): boolean {
  if (!profile || !target) return false;
  const pId = String(profile.id || '').trim();
  const pNorm = normalizeUserId(pId);
  const tNorm = normalizeUserId(target);
  const pUser = String(profile.username || '').trim().toLowerCase();
  const tLower = target.trim().toLowerCase();
  return pId.toLowerCase() === target.toLowerCase() || pNorm === tNorm || pUser === tLower || pUser === tNorm;
}

function applyRemoteProfile(profile: any, current?: Partial<User>): User {
  const fullName = String(profile.full_name ?? profile.fullName ?? current?.full_name ?? '').trim();
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const displayName = fullName || nameParts[0] || profile.username || current?.nombre || 'Usuario';
  const interests = Array.isArray(profile.profile_interests)
    ? profile.profile_interests.join(', ')
    : String(profile.profile_interests ?? profile.intereses ?? current?.intereses ?? '').trim();
  
  const presenceRaw = String(profile.presence ?? profile.presencia ?? current?.presencia ?? 'conectado').trim().toLowerCase();
  const presence: UserPresence = ['conectado', 'ausente', 'ocupado', 'invisible'].includes(presenceRaw)
    ? presenceRaw as UserPresence
    : (current?.presencia || 'conectado');

  const genderRaw = String(profile.gender ?? profile.sexo ?? current?.sexo ?? 'otro').trim().toLowerCase();
  const gender = (genderRaw === 'female' || genderRaw === 'mujer' || genderRaw === 'm')
    ? 'm'
    : (genderRaw === 'male' || genderRaw === 'hombre' || genderRaw === 'h')
      ? 'h'
      : (current?.sexo || 'otro');

  const rawAvatar = profile.avatar_url ?? profile.avatar;
  const avatar = rawAvatar ? toProfileAvatarUrl(rawAvatar, displayName) : (current?.avatar || toProfileAvatarUrl('', displayName));
  const id = String(profile.id || current?.id || '').trim();

  // Visibility: when presence is 'invisible', the user appears offline with chat disabled
  const isOnline = presence !== 'invisible';
  const chatEstado = presence === 'invisible' ? '0' : (current?.chatEstado ?? '1');

  return {
    id,
    username: profile.username ?? current?.username,
    full_name: fullName || current?.full_name,
    nombre: nameParts[0] || profile.username || current?.nombre || 'Usuario',
    apellidos: nameParts.slice(1).join(' ') || current?.apellidos || '',
    email: profile.email || current?.email || `${profile.username || id}@tuenti.es`,
    avatar,
    avatar_url: rawAvatar ? String(rawAvatar) : current?.avatar_url,
    ciudad: profile.city ?? profile.ciudad ?? current?.ciudad,
    pais: profile.country ?? profile.pais ?? current?.pais,
    provincia: profile.province ?? profile.provincia ?? current?.provincia ?? 'Madrid',
    fnac: profile.birth_date ?? profile.fnac ?? current?.fnac ?? '1992-05-15',
    estado: profile.user_status ?? profile.estado ?? current?.estado ?? '',
    estadoFecha: profile.updated_at ? 'Reciente' : (current?.estadoFecha || ''),
    intereses: interests,
    sexo: gender,
    situacionSentimental: profile.relationship_status ?? profile.situacionSentimental ?? current?.situacionSentimental ?? 'Soltero/a',
    ocupacion: profile.occupation ?? profile.ocupacion ?? current?.ocupacion ?? '',
    musica: profile.music ?? profile.musica ?? current?.musica ?? '',
    presencia: presence,
    online: isOnline,
    chatEstado,
    fechaReg: profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : (current?.fechaReg || '2008-01-01'),
    ultimoAcceso: profile.updated_at ? new Date(profile.updated_at).toLocaleString('es-ES') : (current?.ultimoAcceso || 'Recientemente'),
    topAmigos: profile.top_friends || profile.topAmigos || current?.topAmigos || []
  };
}

function profileNeedsSync(local: User, remote: User): boolean {
  const fields: Array<keyof User> = [
    'username', 'full_name', 'nombre', 'apellidos', 'avatar', 'avatar_url',
    'ciudad', 'pais', 'provincia', 'fnac', 'estado', 'intereses', 'sexo',
    'situacionSentimental', 'ocupacion', 'musica', 'presencia', 'online', 'chatEstado'
  ];
  return fields.some(field => String(local[field] ?? '') !== String(remote[field] ?? ''));
}

export function PublicProfileSync() {
  const { 
    selectedUserId, 
    activeTab, 
    currentUser, 
    users, 
    viewUserProfile, 
    refreshProfiles 
  } = useInkorium();

  const syncingRef = useRef(false);
  const lastSyncTargetRef = useRef<string>('');

  // 1. Check URL query parameters and pending state on mount and popstate
  // e.g., ?perfil=ID or ?user=ID or #perfil/ID
  useEffect(() => {
    const handleUrlRouting = () => {
      try {
        const pendingId = localStorage.getItem(PENDING_PROFILE_KEY);
        if (pendingId) {
          localStorage.removeItem(PENDING_PROFILE_KEY);
          if (normalizeUserId(pendingId) !== normalizeUserId(currentUser.id)) {
            viewUserProfile(pendingId);
            return;
          }
        }

        const params = new URLSearchParams(window.location.search);
        const urlProfileId = params.get('perfil') || params.get('user') || params.get('id');
        if (urlProfileId && normalizeUserId(urlProfileId) !== normalizeUserId(currentUser.id)) {
          viewUserProfile(urlProfileId);
          return;
        }

        const hash = window.location.hash;
        if (hash.startsWith('#perfil/')) {
          const hashId = hash.replace('#perfil/', '').trim();
          if (hashId && normalizeUserId(hashId) !== normalizeUserId(currentUser.id)) {
            viewUserProfile(hashId);
          }
        }
      } catch {}
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
    };
  }, [currentUser.id, viewUserProfile]);

  // 2. Core profile loading and visibility synchronization
  const syncTargetProfile = useCallback(async (targetId: string, force = false) => {
    const cleanTargetId = String(targetId || '').trim();
    if (!cleanTargetId || normalizeUserId(cleanTargetId) === normalizeUserId(currentUser.id)) {
      return;
    }
    if (syncingRef.current && !force) return;

    const localTarget = users.find(
      user => user.id === cleanTargetId || normalizeUserId(user.id) === normalizeUserId(cleanTargetId)
    );

    const targetKey = localTarget?.id || cleanTargetId;
    const syncKey = `inkorium:profile-sync:${targetKey}`;
    const previousRemoteStamp = sessionStorage.getItem(syncKey);

    syncingRef.current = true;
    lastSyncTargetRef.current = targetKey;

    try {
      // First attempt: direct single profile lookup or query by id
      let remoteProfile: any = null;

      try {
        const directResp = await fetch(`/api/profiles/${encodeURIComponent(cleanTargetId)}`, {
          cache: 'no-store',
          credentials: 'omit',
          headers: { Accept: 'application/json' }
        });
        if (directResp.ok) {
          const directData = await directResp.json();
          if (directData && !directData.error && matchesTarget(directData, cleanTargetId)) {
            remoteProfile = directData;
          }
        }
      } catch {}

      // Second attempt: query endpoint by id filter
      if (!remoteProfile) {
        try {
          const queryResp = await fetch(`/api/profiles?id=eq.${encodeURIComponent(cleanTargetId)}&select=*`, {
            cache: 'no-store',
            credentials: 'omit',
            headers: { Accept: 'application/json' }
          });
          if (queryResp.ok) {
            const rows = await queryResp.json();
            if (Array.isArray(rows) && rows.length > 0) {
              remoteProfile = rows.find(r => matchesTarget(r, cleanTargetId)) || rows[0];
            }
          }
        } catch {}
      }

      // Third attempt: fallback to normalized id variant if not found yet
      if (!remoteProfile) {
        const altId = cleanTargetId.startsWith('user-') 
          ? cleanTargetId.replace(/^user-/, '') 
          : `user-${cleanTargetId}`;
        try {
          const altResp = await fetch(`/api/profiles?id=eq.${encodeURIComponent(altId)}&select=*`, {
            cache: 'no-store',
            credentials: 'omit',
            headers: { Accept: 'application/json' }
          });
          if (altResp.ok) {
            const rows = await altResp.json();
            if (Array.isArray(rows) && rows.length > 0) {
              remoteProfile = rows.find(r => matchesTarget(r, cleanTargetId)) || rows[0];
            }
          }
        } catch {}
      }

      if (!remoteProfile) {
        return;
      }

      const remoteUser = applyRemoteProfile(remoteProfile, localTarget);
      const remoteStamp = String(remoteProfile.updated_at ?? '');
      const changed = !localTarget || profileNeedsSync(localTarget, remoteUser);

      if (!force && remoteStamp && remoteStamp === previousRemoteStamp && !changed) {
        return;
      }

      if (!changed && remoteStamp) {
        sessionStorage.setItem(syncKey, remoteStamp);
        return;
      }

      // Sync with global persistence and InkoriumContext state
      try {
        const stored = localStorage.getItem('inkorium:users');
        const parsed = stored ? JSON.parse(stored) : [];
        const validParsed = Array.isArray(parsed) ? parsed : [];

        const existingIdx = validParsed.findIndex((u: User) =>
          u?.id === remoteUser.id || 
          normalizeUserId(u?.id) === normalizeUserId(remoteUser.id) ||
          (u?.username && u.username.toLowerCase() === (remoteUser.username || '').toLowerCase())
        );

        let updatedUsers: User[];
        if (existingIdx >= 0) {
          updatedUsers = validParsed.map((user: User, idx: number) =>
            idx === existingIdx ? { ...user, ...remoteUser } : user
          );
        } else {
          updatedUsers = [...validParsed, remoteUser];
        }

        localStorage.setItem('inkorium:users', JSON.stringify(updatedUsers));
        localStorage.setItem(`inkorium:user_profile_${remoteUser.id}`, JSON.stringify(remoteUser));
        if (remoteStamp) sessionStorage.setItem(syncKey, remoteStamp);

        // Broadcast cross-tab and cross-component update
        broadcastCrossTabEvent({
          type: 'PROFILE_UPDATE',
          payload: {
            userId: remoteUser.id,
            data: remoteUser
          }
        });

        // Trigger context refresh to re-evaluate active user profile
        await refreshProfiles();
      } catch (err) {
        console.warn('[PublicProfileSync] Persistence update error:', err);
      }
    } catch (err) {
      console.warn('[PublicProfileSync] Target sync error:', err);
    } finally {
      syncingRef.current = false;
    }
  }, [currentUser.id, users, refreshProfiles]);

  // 3. React whenever selectedUserId or activeTab changes (e.g. visiting a profile)
  useEffect(() => {
    const targetId = String(selectedUserId || '').trim();
    if (!targetId || normalizeUserId(targetId) === normalizeUserId(currentUser.id)) {
      return;
    }

    // When the user is on the profile page or selectedUserId changed
    void syncTargetProfile(targetId);
  }, [selectedUserId, activeTab, currentUser.id, syncTargetProfile]);

  // 4. Synchronize visibility on tab focus / document visibilitychange
  // If the user returns to the tab while looking at a profile, refresh it from the backend
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const targetId = String(selectedUserId || '').trim();
        if (activeTab === 'perfil' && targetId && normalizeUserId(targetId) !== normalizeUserId(currentUser.id)) {
          void syncTargetProfile(targetId, true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [selectedUserId, activeTab, currentUser.id, syncTargetProfile]);

  // 5. Periodic heartbeat sync while actively viewing another user's profile
  // Ensures presence and status visibility remain completely up-to-date
  useEffect(() => {
    const targetId = String(selectedUserId || '').trim();
    if (activeTab !== 'perfil' || !targetId || normalizeUserId(targetId) === normalizeUserId(currentUser.id)) {
      return;
    }

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void syncTargetProfile(targetId);
      }
    }, 20000);

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedUserId, activeTab, currentUser.id, syncTargetProfile]);

  return null;
}
