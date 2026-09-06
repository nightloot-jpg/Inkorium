import React, { useState, useRef } from 'react';
import EmoticonPicker from './EmoticonPicker';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Send, Image as ImageIcon, Smile, MessageCircle, Heart, 
  UserPlus, Sparkles, Clock, CheckCircle2, ChevronRight,
  Upload, Camera, Loader2, X, Edit2, Check, ChevronDown, Music, Disc, Globe, MapPin,
  ShieldCheck, GraduationCap, Users, Shield, SlidersHorizontal, ToggleLeft, ToggleRight,
  Calendar, Building2, Gamepad2
} from 'lucide-react';
import { FeedItem, UserPresence, formatFullLocation } from '../types';
import { uploadMediaFile } from '../lib/storage';
import { validateImageFile, formatFileSize, FileValidationResult } from '../utils/validation';

export const PRESENCE_MAP: Record<UserPresence, { label: string; dot: string; text: string; bg: string }> = {
  conectado: { label: 'Conectado', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  ausente: { label: 'Ausente', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  ocupado: { label: 'Ocupado', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' }
};

export const HomeFeed: React.FC<{ onOpenUpload: () => void }> = ({ onOpenUpload }) => {
  const {
    currentUser,
    users,
    photos,
    feed,
    publishStatus,
    updateStatusText,
    updateUserPresence,
    likeFeedItem,
    commentFeedItem,
    viewUserProfile,
    viewPhoto,
    unreadMessagesCount,
    unreadNotificationsCount,
    pendingRequestsCount,
    setActiveTab,
    openComposeMessage,
    sendFriendRequest,
    isFriend,
    hasPendingRequest,
    openChatWith,
    setChatEstado,
    musicPlaylist,
    currentTrack,
    isMusicPlaying,
    canUserViewPhoto,
    isAntiAlgorithmMode,
    toggleAntiAlgorithmMode,
    campusCommunities,
    events,
    pages
  } = useInkorium();

  const [statusText, setStatusText] = useState('');
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
  const statusTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'estados' | 'fotos'>('todos');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  // Status snippet edit state
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editingStatusText, setEditingStatusText] = useState(currentUser.estado || '');
  const [showPresenceMenu, setShowPresenceMenu] = useState(false);

  const currentPresence: UserPresence = currentUser.presencia || (currentUser.online ? 'conectado' : 'invisible');

  const [feedFileValidation, setFeedFileValidation] = useState<FileValidationResult | null>(null);
  const [feedFileError, setFeedFileError] = useState<string | null>(null);
  const [feedFileName, setFeedFileName] = useState<string>('');

  const feedFileInputRef = useRef<HTMLInputElement>(null);

  const handleFeedFileSelect = async (file: File) => {
    setFeedFileError(null);
    setFeedFileName(file.name);
    setIsUploadingPhoto(true);
    setShowPhotoInput(true);

    try {
      const validation = await validateImageFile(file, {
        maxSizeBytes: 8 * 1024 * 1024, // 8 MB para estados
        maxWidth: 5000,
        maxHeight: 5000
      });

      setFeedFileValidation(validation);

      if (!validation.isValid) {
        setFeedFileError(validation.message || 'El archivo seleccionado no es válido.');
        setIsUploadingPhoto(false);
        return;
      }

      const url = await uploadMediaFile(file, 'wall');
      setAttachedPhotoUrl(url);
    } catch (err: any) {
      console.error('Error subiendo foto al estado:', err);
      setFeedFileError('Error al procesar la imagen seleccionada.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusText.trim() && !attachedPhotoUrl) return;
    publishStatus(statusText, attachedPhotoUrl || undefined);
    setStatusText('');
    setAttachedPhotoUrl('');
    setFeedFileValidation(null);
    setFeedFileError(null);
    setFeedFileName('');
    setShowPhotoInput(false);
  };

  const handleAddComment = (feedId: string) => {
    const text = commentInputs[feedId];
    if (!text || !text.trim()) return;
    commentFeedItem(feedId, text);
    setCommentInputs(prev => ({ ...prev, [feedId]: '' }));
  };

  // Filter feed items
  const filteredFeed = feed.filter(item => {
    // Las firmas en tablón se gestionan exclusivamente en el perfil y en Avisos (notificaciones), nunca en el feed
    if (item.tipo === 'tablon') {
      return false;
    }

    // Excluir explícitamente cualquier interacción/publicación/evento relacionado con "firma recibida".
    // Se inspeccionan todos los campos textuales disponibles del FeedItem para evitar que una variante
    // de tipo evento o publicación termine apareciendo en el feed principal.
    const normalizedFirmaText = [
      item.tipo,
      item.datos,
      item.propietarioNombre,
      item.visitanteNombre
    ]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (\n      normalizedFirmaText.includes('firma recibida') ||\n      normalizedFirmaText.includes('firma_recibida') ||\n      normalizedFirmaText.includes('firmarecibida') ||\n      normalizedFirmaText.includes('firma recibio') ||\n      normalizedFirmaText.includes('recibiste una firma')\n    ) {
      return false;
    }

    // The home feed is reserved for content interactions, not generic relationship/event records.
    if (item.tipo === 'amistad' || item.tipo === 'evento' && normalizedFirmaText.includes('firma')) {
      return false;
    }

    // If it is a photo feed item or has an associated photoId, check privacy
    if (item.fotoId) {
      const associatedPhoto = photos.find(p => p.id === item.fotoId);
      if (associatedPhoto && !canUserViewPhoto(associatedPhoto, currentUser.id)) {
        return false;
      }
    }

    // Anti-Algorithm Filter: Feed 100% cronológico exclusivo de amigos reales
    if (isAntiAlgorithmMode) {
      const isMine = item.propietarioId === currentUser.id;
      const isMyFriend = isFriend(currentUser.id, item.propietarioId);
      if (!isMine && !isMyFriend) {
        return false;
      }
    }

    if (activeFilter === 'estados') return item.tipo === 'estado';
    if (activeFilter === 'fotos') return item.tipo === 'foto' || item.tipo === 'album';
    return true;
  });
