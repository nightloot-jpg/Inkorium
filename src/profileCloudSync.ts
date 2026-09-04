import { supabase } from './lib/supabase';

const USERS_KEY = 'inkorium:users';
const SNAPSHOT_KEY = 'inkorium:profile-cloud-snapshot';

let installed = false;
let syncInFlight = false;
let syncQueued = false;

function normalizeId(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/^user-/, '');
}

function profileSignature(user: any): string {
  if (!user || typeof user !== 'object') return '';
  return JSON.stringify({
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    nombre: user.nombre,
    apellidos: user.apellidos,
    avatar: user.avatar,
    ciudad: user.ciudad,
    pais: user.pais,
    provincia: user.provincia,
    fnac: user.fnac,
    estado: user.estado,
    sexo: user.sexo,
    situacionSentimental: user.situacionSentimental,
    ocupacion: user.ocupacion,
    intereses: user.intereses,
    musica: user.musica,
    presencia: user.presencia
  });
}

function toInterestArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  return String(value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

async function persistCurrentProfile(rawUsers: string): Promise<void> {
  if (syncInFlight || !rawUsers) return;

  let users: any[];
  try {
    const parsed = JSON.parse(rawUsers);
    if (!Array.isArray(parsed)) return;
    users = parsed;
  } catch {
    return;
  }

  const currentId = localStorage.getItem('inkorium:user_id');
  if (!currentId) return;

  const currentUser = users.find(user => normalizeId(user?.id) === normalizeId(currentId));
  if (!currentUser) return;

  const signature = profileSignature(currentUser);
  if (!signature) return;

  const previousSignature = sessionStorage.getItem(SNAPSHOT_KEY);
  sessionStorage.setItem(SNAPSHOT_KEY, signature);
  if (!previousSignature || previousSignature === signature) return;

  syncInFlight = true;
  try {
    const sessionResult = await supabase.auth.getSession().catch(() => null);
    const session = sessionResult?.data?.session;
    const sessionUserId = session?.user?.id;
    if (!sessionUserId || normalizeId(sessionUserId) !== normalizeId(currentId)) return;

    const interests = toInterestArray(currentUser.intereses);
    const fullName = String(
      currentUser.full_name || `${currentUser.nombre || ''} ${currentUser.apellidos || ''}`
    ).trim();

    const payload = {
      username: currentUser.username || undefined,
      full_name: fullName || undefined,
      avatar_url: currentUser.avatar || undefined,
      city: currentUser.ciudad || null,
      country: currentUser.pais || null,
      province: currentUser.provincia || null,
      birth_date: currentUser.fnac || null,
      user_status: currentUser.estado || null,
      gender: currentUser.sexo || null,
      relationship_status: currentUser.situacionSentimental || null,
      occupation: currentUser.ocupacion || null,
      profile_interests: interests,
      music: currentUser.musica || null,
      presence: currentUser.presencia || null
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', sessionUserId);

    if (error) {
      console.warn('[Inkorium] Profile cloud sync failed:', error.message);
    }
  } catch (error) {
    console.warn('[Inkorium] Profile cloud sync failed:', error);
  } finally {
    syncInFlight = false;
    if (syncQueued) {
      syncQueued = false;
      queueMicrotask(() => {
        const latest = localStorage.getItem(USERS_KEY);
        if (latest) void persistCurrentProfile(latest);
      });
    }
  }
}

export function installProfileCloudSync(): void {
  if (installed || typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  installed = true;

  const originalSetItem = localStorage.setItem.bind(localStorage);

  localStorage.setItem = ((key: string, value: string) => {
    originalSetItem(key, value);

    if (key !== USERS_KEY) return;
    if (syncInFlight) {
      syncQueued = true;
      return;
    }
    queueMicrotask(() => void persistCurrentProfile(value));
  }) as Storage['setItem'];
}
