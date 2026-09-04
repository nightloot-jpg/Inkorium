import { useEffect, useRef } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import type { User } from '../types';

function normalizeUserId(id?: string): string {
  return String(id || '').trim().toLowerCase().replace(/^user-/, '');
}

function applyRemoteProfile(profile: any, current: User): User {
  const fullName = String(profile.full_name ?? '').trim();
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const interests = Array.isArray(profile.profile_interests)
    ? profile.profile_interests.join(', ')
    : String(profile.profile_interests ?? '').trim();
  const presence = String(profile.presence ?? current.presencia ?? 'conectado').trim().toLowerCase();
  const gender = String(profile.gender ?? current.sexo ?? 'otro').trim().toLowerCase();

  return {
    ...current,
    username: profile.username ?? current.username,
    full_name: fullName || current.full_name,
    nombre: nameParts[0] || current.nombre,
    apellidos: nameParts.slice(1).join(' ') || current.apellidos,
    avatar: profile.avatar_url ?? current.avatar,
    ciudad: profile.city ?? current.ciudad,
    fnac: profile.birth_date ?? current.fnac,
    estado: profile.user_status ?? current.estado,
    intereses: interests || current.intereses,
    sexo: gender === 'female' || gender === 'mujer' || gender === 'm'
      ? 'm'
      : gender === 'male' || gender === 'hombre' || gender === 'h'
        ? 'h'
        : current.sexo,
    situacionSentimental: profile.relationship_status ?? current.situacionSentimental,
    ocupacion: profile.occupation ?? current.ocupacion,
    musica: profile.music ?? current.musica,
    presencia: ['conectado', 'ausente', 'ocupado', 'invisible'].includes(presence)
      ? presence as User['presencia']
      : current.presencia,
    online: presence === 'invisible' ? false : current.online,
    ultimoAcceso: profile.updated_at ? new Date(profile.updated_at).toLocaleString('es-ES') : current.ultimoAcceso
  };
}

function profileNeedsSync(local: User, remote: User): boolean {
  const fields: Array<keyof User> = [
    'username', 'full_name', 'nombre', 'apellidos', 'avatar', 'ciudad', 'fnac',
    'estado', 'intereses', 'sexo', 'situacionSentimental', 'ocupacion', 'musica', 'presencia'
  ];
  return fields.some(field => String(local[field] ?? '') !== String(remote[field] ?? ''));
}

export function PublicProfileSync() {
  const { selectedUserId, currentUser, users } = useInkorium();
  const syncingRef = useRef(false);

  useEffect(() => {
    const targetId = String(selectedUserId || '').trim();
    if (!targetId || normalizeUserId(targetId) === normalizeUserId(currentUser.id) || syncingRef.current) return;

    const localTarget = users.find(
      user => user.id === targetId || normalizeUserId(user.id) === normalizeUserId(targetId)
    );
    if (!localTarget) return;

    const syncKey = `inkorium:profile-sync:${localTarget.id}`;
    const previousRemoteStamp = sessionStorage.getItem(syncKey);
    syncingRef.current = true;

    void fetch(`/api/profiles?id=eq.${encodeURIComponent(localTarget.id)}&select=*`, {
      cache: 'no-store',
      credentials: 'omit',
      headers: { Accept: 'application/json' }
    })
      .then(response => response.ok ? response.json() : null)
      .then(rows => {
        const remoteProfile = Array.isArray(rows) ? rows[0] : null;
        if (!remoteProfile || String(remoteProfile.id) !== String(localTarget.id)) return;

        const remoteUser = applyRemoteProfile(remoteProfile, localTarget);
        const remoteStamp = String(remoteProfile.updated_at ?? '');
        const changed = profileNeedsSync(localTarget, remoteUser);

        if (remoteStamp && remoteStamp === previousRemoteStamp) return;
        if (!changed && remoteStamp) {
          sessionStorage.setItem(syncKey, remoteStamp);
          return;
        }
        if (!changed) return;

        try {
          const stored = localStorage.getItem('inkorium:users');
          const parsed = stored ? JSON.parse(stored) : [];
          if (!Array.isArray(parsed)) return;
          const updated = parsed.map((user: User) =>
            String(user?.id) === String(localTarget.id) ? remoteUser : user
          );
          localStorage.setItem('inkorium:users', JSON.stringify(updated));
          if (remoteStamp) sessionStorage.setItem(syncKey, remoteStamp);
        } catch {
          return;
        }

        window.location.reload();
      })
      .catch(() => null)
      .finally(() => {
        syncingRef.current = false;
      });
  }, [selectedUserId, currentUser.id, users]);

  return null;
}
