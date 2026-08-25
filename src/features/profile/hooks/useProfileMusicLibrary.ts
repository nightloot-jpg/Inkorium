import { useCallback, useEffect, useState } from 'react';
import {
  createPlaylist,
  deletePlaylist,
  deleteTrack,
  getMusicLibrary,
  searchYoutubeTracks,
  saveYoutubeTrack,
  setFavorite,
  updatePlaylist,
  updateTrack,
  addTrackToPlaylist,
  type MusicLibraryTrack,
  type MusicPlaylist,
} from '../services/profile-music-library.service';

export function useProfileMusicLibrary(profileId: string, enabled: boolean) {
  const [tracks, setTracks] = useState<MusicLibraryTrack[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMusicLibrary(profileId);
      setTracks(data.tracks);
      setFavoriteIds(data.favoriteIds);
      setPlaylists(data.playlists);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('No se pudo cargar la biblioteca musical'));
    } finally {
      setLoading(false);
    }
  }, [enabled, profileId]);

  useEffect(() => { void reload(); }, [reload]);

  const toggleFavorite = useCallback(async (trackId: string) => {
    const favorite = !favoriteIds.has(trackId);
    await setFavorite(profileId, trackId, favorite);
    setFavoriteIds(current => {
      const next = new Set(current);
      if (favorite) next.add(trackId); else next.delete(trackId);
      return next;
    });
  }, [favoriteIds, profileId]);

  const editTrack = useCallback(async (trackId: string, draft: { title: string; artist: string; album: string }) => {
    await updateTrack(profileId, trackId, draft);
    setTracks(current => current.map(track => track.id === trackId ? { ...track, title: draft.title.trim(), artist: draft.artist.trim() || null, album: draft.album.trim() || null } : track));
  }, [profileId]);

  const removeTrack = useCallback(async (trackId: string) => {
    await deleteTrack(profileId, trackId);
    setTracks(current => current.filter(track => track.id !== trackId));
    setFavoriteIds(current => { const next = new Set(current); next.delete(trackId); return next; });
  }, [profileId]);

  const createNewPlaylist = useCallback(async (name: string, description: string, isPublic: boolean) => {
    await createPlaylist(profileId, name, description, isPublic);
    await reload();
  }, [profileId, reload]);

  const editPlaylist = useCallback(async (playlistId: string, name: string, description: string, isPublic: boolean) => {
    await updatePlaylist(profileId, playlistId, name, description, isPublic);
    await reload();
  }, [profileId, reload]);

  const removePlaylist = useCallback(async (playlistId: string) => {
    await deletePlaylist(profileId, playlistId);
    setPlaylists(current => current.filter(playlist => playlist.id !== playlistId));
  }, [profileId]);

  const addTrack = useCallback(async (playlistId: string, trackId: string) => {
    await addTrackToPlaylist(playlistId, trackId);
  }, []);

  const importYoutubeTrack = useCallback(async (track: MusicLibraryTrack) => {
    const id = await saveYoutubeTrack(profileId, track);
    const next = { ...track, id, user_id: profileId };
    setTracks(current => current.some(item => item.id === id) ? current : [next, ...current]);
    return id;
  }, [profileId]);

  return {
    tracks,
    favoriteIds,
    playlists,
    loading,
    error,
    reload,
    toggleFavorite,
    editTrack,
    removeTrack,
    createPlaylist: createNewPlaylist,
    updatePlaylist: editPlaylist,
    deletePlaylist: removePlaylist,
    addTrackToPlaylist: addTrack,
    searchYoutube: searchYoutubeTracks,
    importYoutubeTrack,
  };
}
