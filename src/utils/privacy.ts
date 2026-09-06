import type { User, ProfilePrivacySettings, PrivacyAudience } from '../types';
import { DEFAULT_PROFILE_PRIVACY } from '../types';

/**
 * Returns the effective privacy settings of a user profile,
 * falling back to DEFAULT_PROFILE_PRIVACY for missing keys.
 */
export function getProfilePrivacy(user?: Partial<User> | null): ProfilePrivacySettings {
  if (!user || !user.privacidadPerfil) {
    return { ...DEFAULT_PROFILE_PRIVACY };
  }
  return {
    fotos: user.privacidadPerfil.fotos || DEFAULT_PROFILE_PRIVACY.fotos,
    tablon: user.privacidadPerfil.tablon || DEFAULT_PROFILE_PRIVACY.tablon,
    amigos: user.privacidadPerfil.amigos || DEFAULT_PROFILE_PRIVACY.amigos,
    info: user.privacidadPerfil.info || DEFAULT_PROFILE_PRIVACY.info,
    comentarTablon: user.privacidadPerfil.comentarTablon || DEFAULT_PROFILE_PRIVACY.comentarTablon,
    permitirNoRegistrados: user.privacidadPerfil.permitirNoRegistrados ?? DEFAULT_PROFILE_PRIVACY.permitirNoRegistrados,
  };
}

/**
 * Checks if a viewer can access a specific section of a user's profile.
 *
 * @param section 'fotos' | 'tablon' | 'amigos' | 'info'
 * @param profileUser The owner of the profile
 * @param viewerUser The currently viewing user (or null/undefined if unregistered guest)
 * @param isFriendWithViewer Whether viewerUser and profileUser are confirmed friends
 * @param isOwn Whether the viewer is the profile owner themselves
 */
export function canViewProfileSection(
  section: 'fotos' | 'tablon' | 'amigos' | 'info',
  profileUser: Partial<User>,
  viewerUser: Partial<User> | null | undefined,
  isFriendWithViewer: boolean,
  isOwn: boolean = false
): boolean {
  // The profile owner can always see everything on their own profile
  if (isOwn) return true;

  const privacy = getProfilePrivacy(profileUser);
  const setting: PrivacyAudience = privacy[section] || 'amigos';

  // Case 1: Section is restricted to Friends Only ('amigos')
  if (setting === 'amigos') {
    // Unregistered visitors or people outside friends list cannot view
    return Boolean(viewerUser && isFriendWithViewer);
  }

  // Case 2: Section is configured for Everyone ('todos')
  if (setting === 'todos') {
    // If the viewer is NOT registered (guest / not logged in)
    if (!viewerUser) {
      // Must also have general un-registered access allowed
      return Boolean(privacy.permitirNoRegistrados);
    }
    // Registered user (whether friend or not) can view
    return true;
  }

  return false;
}

/**
 * Checks if a viewer is allowed to post/sign on the profile's wall.
 */
export function canCommentOnWall(
  profileUser: Partial<User>,
  viewerUser: Partial<User> | null | undefined,
  isFriendWithViewer: boolean,
  isOwn: boolean = false
): boolean {
  if (isOwn) return true;
  // Unregistered users can never comment
  if (!viewerUser) return false;

  const privacy = getProfilePrivacy(profileUser);
  const setting = privacy.comentarTablon || 'amigos';

  if (setting === 'todos') return true;
  return isFriendWithViewer;
}

/**
 * Calculates privacy rating for visual indicators in settings
 */
export function calculatePrivacyLevel(privacy: ProfilePrivacySettings): {
  label: 'Máxima' | 'Protegida' | 'Personalizada' | 'Pública';
  color: string;
  badgeClass: string;
  description: string;
} {
  const isFriendsOnlyPhotos = privacy.fotos === 'amigos';
  const isFriendsOnlyWall = privacy.tablon === 'amigos';
  const isFriendsOnlyFriends = privacy.amigos === 'amigos';
  const noGuest = !privacy.permitirNoRegistrados;

  if (isFriendsOnlyPhotos && isFriendsOnlyWall && isFriendsOnlyFriends && noGuest) {
    return {
      label: 'Máxima',
      color: '#059669',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200',
      description: 'Tu perfil está protegido: solo tus amigos pueden ver fotos, tablón y amigos, y está cerrado a visitantes no registrados.'
    };
  }

  if (isFriendsOnlyPhotos && isFriendsOnlyWall && isFriendsOnlyFriends) {
    return {
      label: 'Protegida',
      color: '#0284c7',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-200',
      description: 'Tus fotos, tablón y amigos solo son visibles para tus amigos.'
    };
  }

  if (!isFriendsOnlyPhotos && !isFriendsOnlyWall && !isFriendsOnlyFriends && privacy.permitirNoRegistrados) {
    return {
      label: 'Pública',
      color: '#d97706',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200',
      description: 'Cualquier persona registrada o visitante web puede ver tus fotos, tablón y lista de amigos.'
    };
  }

  return {
    label: 'Personalizada',
    color: '#3869A0',
    badgeClass: 'bg-blue-100 text-[#3869A0] border-blue-300 dark:bg-blue-950 dark:text-blue-200',
    description: 'Tienes una configuración mixta con permisos específicos por sección.'
  };
}
