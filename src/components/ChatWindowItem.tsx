import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Minus, X, Send, Smile, ArrowDown, Loader2, CheckCheck, Clock, 
  UserCheck, Image as ImageIcon, Zap, Heart, Maximize2, Images, 
  MessageSquare, ChevronLeft, ChevronRight, Download, FileText, Paperclip, File, Archive, Music 
} from 'lucide-react';
import { User, ChatWindow, ChatMessage, UserPresence } from '../types';
import { getFullConversation, formatChatDateDivider, normalizeUserId, subscribeCrossTabEvents } from '../lib/chatHistory';
import EmoticonPicker from './EmoticonPicker';
import { SharedMediaView } from './SharedMediaView';
import { useInkorium } from '../context/InkoriumContext';
import { playMessageSound, playNudgeSound } from '../utils/sound';
import { uploadMediaFile } from '../lib/storage';

const PAGE_SIZE = 12;
const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢'];

interface ChatWindowItemProps {
  win: ChatWindow;
  targetUser: User;
  currentUser: User;
  onClose: (targetUserId: string) => void;
  onToggleMinimize: (targetUserId: string) => void;
  onOpenProfile: (targetUserId: string) => void;
  getUserPresenceDot: (u: { online: boolean; presencia?: UserPresence }) => string;
}

export const ChatWindowItem: React.FC<ChatWindowItemProps> = ({
  win,
  targetUser,
  currentUser,
  onClose,
  onToggleMinimize,
  onOpenProfile,
  getUserPresenceDot,
}) => {
  const { sendChatMessage, sendChatNudge, reactToChatMessage, sendChatTyping } = useInkorium();
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(() => {
    return getFullConversation(currentUser.id, targetUser.id, `${targetUser.nombre} ${targetUser.apellidos}`);
  });

  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [emoticonOpen, setEmoticonOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxActiveIndex, setLightboxActiveIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'media'>('chat');
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; size?: number; type?: string } | null>(null);

  // Derived media lists
  const mediaMessages = useMemo(() => {
    return allMessages.filter(m => Boolean(m.imageUrl || m.fileUrl));
  }, [allMessages]);

  const sharedPhotos = useMemo(() => {
    return allMessages.filter(m => Boolean(m.imageUrl));
  }, [allMessages]);

  const mediaCount = mediaMessages.length;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const preScrollRef = useRef<{ height: number; top: number } | null>(null);
  const isInitialScrollDoneRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);
  const windowRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (val.trim()) {
      sendChatTyping(targetUser.id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendChatTyping(targetUser.id, false);
      }, 1500);
    } else {
      sendChatTyping(targetUser.id, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  // Sync conversation history when window or active users change
  useEffect(() => {
    const msgs = getFullConversation(currentUser.id, targetUser.id, `${targetUser.nombre} ${targetUser.apellidos}`);
    setAllMessages(msgs);
    setVisibleCount(Math.min(PAGE_SIZE, msgs.length));
    isInitialScrollDoneRef.current = false;
  }, [currentUser.id, targetUser.id, targetUser.nombre, targetUser.apellidos]);

  // Listen to synchronized messages, typing events, nudges and reactions
  useEffect(() => {
    const isMessageForThisChat = (m: ChatMessage) => {
      const normSender = normalizeUserId(m.emisorId);
      const normRecipient = normalizeUserId(m.receptorId);
      const normCurrent = normalizeUserId(currentUser.id);
      const normTarget = normalizeUserId(targetUser.id);

      return (
        (normSender === normCurrent && normRecipient === normTarget) ||
        (normSender === normTarget && normRecipient === normCurrent)
      );
    };

    const handleIncomingMessage = (msg: ChatMessage) => {
      if (isMessageForThisChat(msg)) {
        setAllMessages(prev => {
          if (prev.some(m => m.id === msg.id)) {
            return prev.map(m => m.id === msg.id ? { ...m, ...msg } : m);
          }
          return [...prev, msg];
        });
        setVisibleCount(prev => prev + 1);
      }
    };

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetUserId: string; message: ChatMessage }>;
      if (customEvent.detail?.message) {
        handleIncomingMessage(customEvent.detail.message);
      }
    };

    const handleTyping = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetUserId: string; isTyping: boolean }>;
      if (customEvent.detail && normalizeUserId(customEvent.detail.targetUserId) === normalizeUserId(targetUser.id)) {
        setIsPeerTyping(customEvent.detail.isTyping);
      }
    };

    const triggerNudgeShake = () => {
      setIsNudging(true);
      setTimeout(() => {
        setIsNudging(false);
      }, 700);
    };

    const handleNudgeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetUserId: string; senderUserId: string }>;
      const { targetUserId, senderUserId } = customEvent.detail || {};
      const normCur = normalizeUserId(currentUser.id);
      const normTarget = normalizeUserId(targetUser.id);
      if (
        (normalizeUserId(senderUserId) === normTarget && normalizeUserId(targetUserId) === normCur) ||
        (normalizeUserId(senderUserId) === normCur && normalizeUserId(targetUserId) === normTarget)
      ) {
        triggerNudgeShake();
      }
    };

    const handleReactionEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ messageId: string; emoji: string; userId: string; targetUserId: string }>;
      const { messageId, emoji, userId } = customEvent.detail || {};
      if (messageId && emoji && userId) {
        setAllMessages(prev => prev.map(m => {
          if (m.id === messageId) {
            const reactions = { ...(m.reactions || {}) };
            const currentList = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
            if (currentList.includes(userId)) {
              reactions[emoji] = currentList.filter(id => id !== userId);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              reactions[emoji] = [...currentList, userId];
            }
            return { ...m, reactions };
          }
          return m;
        }));
      }
    };

    window.addEventListener('inkorium:chat_message_sync', handleSync);
    window.addEventListener('inkorium:peer_typing', handleTyping);
    window.addEventListener('inkorium:chat_nudge', handleNudgeEvent);
    window.addEventListener('inkorium:chat_reaction', handleReactionEvent);

    // Cross-tab broadcast listener
    const unsubscribeCrossTab = subscribeCrossTabEvents((event) => {
      if (event.type === 'CHAT_MESSAGE') {
        handleIncomingMessage(event.payload.message);
      } else if (event.type === 'PEER_TYPING') {
        if (normalizeUserId(event.payload.targetUserId) === normalizeUserId(targetUser.id)) {
          setIsPeerTyping(event.payload.isTyping);
        }
      } else if (event.type === 'CHAT_NUDGE') {
        const { targetUserId: nTarget, senderUserId: nSender } = event.payload;
        if (
          (normalizeUserId(nSender) === normalizeUserId(targetUser.id) && normalizeUserId(nTarget) === normalizeUserId(currentUser.id)) ||
          (normalizeUserId(nSender) === normalizeUserId(currentUser.id) && normalizeUserId(nTarget) === normalizeUserId(targetUser.id))
        ) {
          triggerNudgeShake();
        }
      } else if (event.type === 'CHAT_REACTION') {
        const { messageId, emoji, userId } = event.payload;
        setAllMessages(prev => prev.map(m => {
          if (m.id === messageId) {
            const reactions = { ...(m.reactions || {}) };
            const currentList = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
            if (currentList.includes(userId)) {
              reactions[emoji] = currentList.filter(id => id !== userId);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              reactions[emoji] = [...currentList, userId];
            }
            return { ...m, reactions };
          }
          return m;
        }));
      }
    });

    return () => {
      window.removeEventListener('inkorium:chat_message_sync', handleSync);
      window.removeEventListener('inkorium:peer_typing', handleTyping);
      window.removeEventListener('inkorium:chat_nudge', handleNudgeEvent);
      window.removeEventListener('inkorium:chat_reaction', handleReactionEvent);
      unsubscribeCrossTab();
    };
  }, [currentUser.id, targetUser.id]);

  // Sliced visible messages
  const visibleMessages = allMessages.slice(-visibleCount);
  const hasMore = allMessages.length > visibleCount;
  const remainingCount = Math.max(0, allMessages.length - visibleCount);

  // Load older messages (infinite scroll up)
  const loadOlderMessages = useCallback(() => {
    if (isLoadingOlder || !hasMore) return;

    const container = scrollContainerRef.current;
    if (container) {
      preScrollRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
    }

    setIsLoadingOlder(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(allMessages.length, prev + PAGE_SIZE));
      setIsLoadingOlder(false);
    }, 280);
  }, [isLoadingOlder, hasMore, allMessages.length]);

  // Scroll height preservation when prepending older messages
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (preScrollRef.current) {
      const newHeight = container.scrollHeight;
      const heightDiff = newHeight - preScrollRef.current.height;
      container.scrollTop = preScrollRef.current.top + heightDiff;
      preScrollRef.current = null;
    } else if (!isInitialScrollDoneRef.current && visibleMessages.length > 0) {
      container.scrollTop = container.scrollHeight;
      isInitialScrollDoneRef.current = true;
    } else if (allMessages.length > prevMessagesLengthRef.current) {
      container.scrollTop = container.scrollHeight;
    }

    prevMessagesLengthRef.current = allMessages.length;
  }, [visibleMessages.length, allMessages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;

    if (scrollTop <= 30 && hasMore && !isLoadingOlder) {
      loadOlderMessages();
    }

    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 90);
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  // Image & File Upload handler
  const processAnyFile = async (file: File) => {
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        // Generate local preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImagePreview(String(e.target.result));
          }
        };
        reader.readAsDataURL(file);

        // Upload to server storage
        const uploadedUrl = await uploadMediaFile(file, 'photos');
        setImagePreview(uploadedUrl);
      } else {
        const uploadedUrl = await uploadMediaFile(file, 'photos');
        setAttachedFile({
          url: uploadedUrl,
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    } catch (err: any) {
      console.warn('Chat file upload error:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadSharedFile = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const uploadedUrl = await uploadMediaFile(file, 'photos');
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        sendChatMessage(targetUser.id, '', uploadedUrl);
      } else {
        sendChatMessage(targetUser.id, '', undefined, {
          url: uploadedUrl,
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    } catch (err: any) {
      console.warn('Shared media upload error:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleJumpToMessage = useCallback((messageId: string) => {
    setActiveTab('chat');
    setLightboxImageUrl(null);

    // Make sure the message is in visible messages
    const revIndex = allMessages.slice().reverse().findIndex(m => m.id === messageId);
    if (revIndex >= visibleCount) {
      setVisibleCount(Math.min(allMessages.length, revIndex + 12));
    }

    setHighlightedMessageId(messageId);

    setTimeout(() => {
      const el = document.getElementById(`chat-msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedMessageId(prev => prev === messageId ? null : prev);
    }, 3500);
  }, [allMessages, visibleCount]);

  const openPhotoLightbox = useCallback((photoUrl: string, msgId?: string) => {
    setLightboxImageUrl(photoUrl);
    if (msgId) {
      const idx = sharedPhotos.findIndex(m => m.id === msgId);
      if (idx !== -1) setLightboxActiveIndex(idx);
    } else {
      const idx = sharedPhotos.findIndex(m => m.imageUrl === photoUrl);
      if (idx !== -1) setLightboxActiveIndex(idx);
    }
  }, [sharedPhotos]);

  const handlePrevPhoto = useCallback(() => {
    if (sharedPhotos.length <= 1) return;
    const newIndex = (lightboxActiveIndex - 1 + sharedPhotos.length) % sharedPhotos.length;
    setLightboxActiveIndex(newIndex);
    setLightboxImageUrl(sharedPhotos[newIndex].imageUrl || null);
  }, [lightboxActiveIndex, sharedPhotos]);

  const handleNextPhoto = useCallback(() => {
    if (sharedPhotos.length <= 1) return;
    const newIndex = (lightboxActiveIndex + 1) % sharedPhotos.length;
    setLightboxActiveIndex(newIndex);
    setLightboxImageUrl(sharedPhotos[newIndex].imageUrl || null);
  }, [lightboxActiveIndex, sharedPhotos]);

  const currentLightboxMessage = useMemo(() => {
    if (!lightboxImageUrl) return null;
    return sharedPhotos[lightboxActiveIndex] || sharedPhotos.find(m => m.imageUrl === lightboxImageUrl) || null;
  }, [lightboxImageUrl, lightboxActiveIndex, sharedPhotos]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxImageUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImageUrl(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImageUrl, handlePrevPhoto, handleNextPhoto]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      void processAnyFile(files[0]);
    }
    // Reset file input value so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag & drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void processAnyFile(e.dataTransfer.files[0]);
    }
  };

  // Paste image support (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          void processAnyFile(file);
          break;
        }
      }
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    const hasImage = Boolean(imagePreview);
    const hasFile = Boolean(attachedFile);

    if ((!text && !hasImage && !hasFile) || !currentUser.id || !targetUser.id) return;
    if (targetUser.id === currentUser.id) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendChatTyping(targetUser.id, false);

    sendChatMessage(targetUser.id, text, imagePreview || undefined, attachedFile || undefined);
    setInputText('');
    setImagePreview(null);
    setAttachedFile(null);
    setEmoticonOpen(false);

    try {
      playMessageSound();
    } catch {
      // ignore
    }
  };

  const handleSendNudge = () => {
    if (!currentUser.id || !targetUser.id) return;
    sendChatNudge(targetUser.id);
  };

  const handleInsertEmoticon = (val: string) => {
    setInputText(prev => `${prev} ${val} `);
  };

  const handleReactionClick = (msgId: string, emoji: string) => {
    reactToChatMessage(targetUser.id, msgId, emoji);
    setActiveReactionPickerMsgId(null);
  };

  // Group visible messages by date
  const renderMessagesWithDividers = () => {
    let lastDateStr = '';
    const elements: React.ReactNode[] = [];

    visibleMessages.forEach((msg, idx) => {
      const dateDivider = formatChatDateDivider(msg.timestamp || msg.fecha);

      if (dateDivider !== lastDateStr) {
        lastDateStr = dateDivider;
        elements.push(
          <div key={`date-divider-${idx}-${dateDivider}`} className="flex items-center justify-center my-2">
            <span className="bg-gray-200/90 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-300 dark:border-slate-700 shadow-2xs">
              {dateDivider}
            </span>
          </div>
        );
      }

      const isMe = msg.emisorId === currentUser.id;
      const isNudge = Boolean(msg.isNudge);
      const isReactionPickerOpen = activeReactionPickerMsgId === msg.id;

      if (isNudge) {
        elements.push(
          <div key={msg.id || `nudge-${idx}`} className="flex justify-center my-2 w-full">
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs px-3 py-1.5 rounded-full shadow-xs animate-bounce font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>
                {isMe ? '¡Has enviado un zumbido!' : `¡${targetUser.nombre} te ha enviado un zumbido!`}
              </span>
              <span className="text-[9px] opacity-70 ml-1">{msg.fecha}</span>
            </div>
          </div>
        );
        return;
      }

      const reactions = msg.reactions || {};
      const reactionEntries = Object.entries(reactions).filter(([_, userIds]) => userIds && userIds.length > 0);
      const isHighlighted = highlightedMessageId === msg.id;

      elements.push(
        <div
          id={`chat-msg-${msg.id}`}
          key={msg.id || `msg-${idx}`}
          className={`group/msg relative flex flex-col max-w-[85%] transition-all duration-300 rounded-lg p-0.5 ${
            isMe ? 'self-end items-end' : 'self-start items-start'
          } ${isHighlighted ? 'bg-amber-100 dark:bg-amber-950/60 ring-2 ring-amber-400 p-1.5 animate-pulse' : ''}`}
        >
          {/* Reaction trigger icon on hover */}
          <div
            className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10 ${
              isMe ? 'left-0 -translate-x-full pr-1.5' : 'right-0 translate-x-full pl-1.5'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveReactionPickerMsgId(isReactionPickerOpen ? null : msg.id)}
              className="p-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-gray-500 hover:text-amber-500 shadow-sm cursor-pointer transition hover:scale-110"
              title="Reaccionar con un emoji"
            >
              <Smile className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Reaction Popup */}
          {isReactionPickerOpen && (
            <div
              className={`absolute bottom-full mb-1 z-20 flex items-center gap-0.5 bg-white dark:bg-[#0e1726] border border-gray-300 dark:border-slate-700 p-1 rounded-full shadow-xl animate-fade-in ${
                isMe ? 'right-0' : 'left-0'
              }`}
            >
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReactionClick(msg.id, emoji)}
                  className="w-6 h-6 flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer rounded-full hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`p-2 rounded-lg text-xs leading-snug shadow-xs select-text flex flex-col gap-1.5 ${
              isMe
                ? 'bg-[#3869A0] text-white rounded-br-none'
                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-slate-700 rounded-bl-none'
            }`}
          >
            {/* Attached Photo */}
            {msg.imageUrl && (
              <div className="relative group/img rounded overflow-hidden cursor-pointer max-w-[200px] border border-black/10 dark:border-white/10">
                <img
                  src={msg.imageUrl}
                  alt="Foto enviada en el chat"
                  className="w-full max-h-48 object-cover rounded hover:opacity-95 transition"
                  onClick={() => openPhotoLightbox(msg.imageUrl!, msg.id)}
                  loading="lazy"
                />
                <div
                  onClick={() => openPhotoLightbox(msg.imageUrl!, msg.id)}
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Maximize2 className="w-4 h-4 drop-shadow" />
                </div>
              </div>
            )}

            {/* Attached Document/File */}
            {msg.fileUrl && !msg.imageUrl && (
              <div className="flex items-center gap-2 p-1.5 rounded bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 max-w-[220px]">
                <div className="p-1 rounded bg-white/30 dark:bg-black/30 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-[10px]">
                  <p className="font-semibold truncate" title={msg.fileName || 'Archivo'}>
                    {msg.fileName || 'Archivo adjunto'}
                  </p>
                  {msg.fileSize && (
                    <p className="text-[9px] opacity-75">
                      {msg.fileSize < 1024 * 1024
                        ? `${(msg.fileSize / 1024).toFixed(0)} KB`
                        : `${(msg.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                    </p>
                  )}
                </div>
                <a
                  href={msg.fileUrl}
                  download={msg.fileName || 'archivo'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded hover:bg-black/15 dark:hover:bg-white/15 transition text-inherit flex-shrink-0"
                  title="Descargar archivo"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Text message */}
            {msg.mensaje && msg.mensaje !== '📷 Foto' && (
              <div className="break-words whitespace-pre-wrap">{msg.mensaje}</div>
            )}
          </div>

          {/* Reactions bar below bubble */}
          {reactionEntries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5 px-0.5">
              {reactionEntries.map(([emoji, userIds]) => {
                const isReactedByMe = userIds.includes(currentUser.id);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReactionClick(msg.id, emoji)}
                    className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border transition cursor-pointer ${
                      isReactedByMe
                        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-[#3869A0] dark:text-blue-300 font-bold'
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{userIds.length}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Time & status */}
          <div className="flex items-center gap-1 text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 px-1">
            <span>{msg.fecha}</span>
            {isMe && <span title="Enviado"><CheckCheck className="w-3 h-3 text-[#3869A0]/80 dark:text-blue-300" /></span>}
          </div>
        </div>
      );
    });

    return elements;
  };

  return (
    <div
      ref={windowRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-68 sm:w-80 bg-white dark:bg-[#0e1726] rounded-t-lg shadow-2xl border border-gray-300 dark:border-slate-700 flex flex-col overflow-hidden text-xs select-none transition-transform ${
        isNudging ? 'animate-chat-shake' : ''
      }`}
    >
      {/* Hidden file input for photos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Chat Window Header */}
      <div
        onClick={() => onToggleMinimize(win.targetUserId)}
        className="bg-[#3869A0] text-white px-3 py-2 flex items-center justify-between cursor-pointer select-none hover:bg-[#2f5988] transition"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="relative flex-shrink-0">
            <img
              src={targetUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt=""
              className="w-5 h-5 rounded object-cover border border-white/80 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onOpenProfile(targetUser.id);
              }}
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getUserPresenceDot(
                targetUser
              )}`}
            />
          </div>
          <span
            className="font-bold text-xs truncate cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile(targetUser.id);
            }}
          >
            {targetUser.nombre} {targetUser.apellidos}
          </span>
        </div>

        <div className="flex items-center gap-1 text-white/80">
          {/* Shared Media toggle button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab(prev => (prev === 'media' ? 'chat' : 'media'));
            }}
            className={`p-1 rounded cursor-pointer transition flex items-center gap-0.5 ${
              activeTab === 'media'
                ? 'bg-white text-[#3869A0] font-bold shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-black/20'
            }`}
            title={activeTab === 'media' ? 'Volver a los mensajes' : `Archivos compartidos (${mediaCount})`}
          >
            <Images className="w-3.5 h-3.5" />
            {mediaCount > 0 && (
              <span className="text-[9px] bg-amber-400 text-gray-950 font-bold px-1 rounded-full leading-tight">
                {mediaCount}
              </span>
            )}
          </button>
          {/* Quick Nudge button in header */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSendNudge();
            }}
            className="p-1 text-amber-300 hover:text-white rounded hover:bg-black/20 cursor-pointer transition"
            title="¡Enviar zumbido!"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-300" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize(win.targetUserId);
            }}
            className="p-0.5 hover:text-white rounded hover:bg-black/10 cursor-pointer"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose(win.targetUserId);
            }}
            className="p-0.5 hover:text-white rounded hover:bg-black/10 cursor-pointer"
            title="Cerrar chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subheader Navigation Tabs */}
      {!win.minimized && (
        <div className="bg-[#2a517c] dark:bg-[#132035] text-white/90 px-2 py-1 flex items-center justify-between border-b border-[#214368] dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                activeTab === 'chat'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Mensajes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer font-medium ${
                activeTab === 'media'
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Images className="w-3 h-3" />
              <span>Multimedia</span>
              {mediaCount > 0 && (
                <span className="text-[9px] bg-amber-400 text-gray-950 font-bold px-1 rounded-full leading-tight">
                  {mediaCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'chat' && mediaCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className="text-[10px] text-blue-200 hover:text-white underline cursor-pointer truncate max-w-[120px]"
              title="Ver fotos y archivos compartidos"
            >
              {mediaCount} {mediaCount === 1 ? 'archivo' : 'archivos'}
            </button>
          )}
        </div>
      )}

      {/* Chat Window Body */}
      {!win.minimized && (
        <>
          {activeTab === 'media' ? (
            <SharedMediaView
              targetUser={targetUser}
              currentUser={currentUser}
              allMessages={allMessages}
              onBackToChat={() => setActiveTab('chat')}
              onJumpToMessage={handleJumpToMessage}
              onSelectPhotoLightbox={(url, msg) => openPhotoLightbox(url, msg?.id)}
              onUploadFile={handleUploadSharedFile}
              isUploading={isUploadingImage}
            />
          ) : (
            <>
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-72 p-2.5 overflow-y-auto bg-[#f8fafc] dark:bg-[#090d16] space-y-1.5 flex flex-col relative"
              >
                {/* Drag and drop overlay */}
                {isDraggingOver && (
                  <div className="absolute inset-0 bg-[#3869A0]/80 z-30 flex flex-col items-center justify-center text-white border-2 border-dashed border-white m-1 rounded-lg backdrop-blur-xs">
                    <ImageIcon className="w-8 h-8 animate-bounce mb-1" />
                    <span className="font-bold text-xs">Suelta la foto o archivo para enviarlo</span>
                  </div>
                )}

                {/* Top Loading Indicator & Infinite Scroll Button */}
                {hasMore ? (
                  <div className="flex flex-col items-center justify-center py-1.5 border-b border-gray-200/80 dark:border-slate-800 mb-2">
                    {isLoadingOlder ? (
                      <div className="flex items-center gap-1.5 text-xs text-[#3869A0] dark:text-blue-400 font-medium py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Cargando historial anterior...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={loadOlderMessages}
                        className="flex items-center gap-1 text-[11px] text-[#3869A0] dark:text-blue-400 font-semibold hover:underline bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:border-[#3869A0] px-2.5 py-1 rounded-full shadow-2xs cursor-pointer transition"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Ver mensajes anteriores ({remainingCount} más)</span>
                      </button>
                    )}
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">
                      Desliza hacia arriba para cargar automáticamente
                    </span>
                  </div>
                ) : (
                  /* Milestone: Beginning of Conversation History */
                  <div className="text-center py-3 border-b border-gray-200 dark:border-slate-800 mb-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-2">
                    <img
                      src={targetUser.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full mx-auto object-cover border border-gray-300 dark:border-slate-700 shadow-2xs"
                    />
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mt-1">
                      {targetUser.nombre} {targetUser.apellidos}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {targetUser.provincia} • {targetUser.online ? '🟢 Conectado' : 'Desconectado'}
                    </p>
                    <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-slate-800 py-0.5 px-2 rounded-full border border-blue-200 dark:border-blue-900/40 inline-flex mx-auto">
                      <UserCheck className="w-3 h-3 text-[#3869A0] dark:text-blue-400" />
                      <span>Inicio del historial de chat</span>
                    </div>
                  </div>
                )}

                {/* Messages Stream with Date Separators */}
                {renderMessagesWithDividers()}

                {/* Contact Typing Indicator */}
                {isPeerTyping && (
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 py-1 px-2.5 rounded-full w-fit text-[11px] shadow-2xs animate-pulse my-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3869A0] dark:bg-blue-400 animate-ping" />
                    <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">
                      {targetUser.nombre} está escribiendo...
                    </span>
                  </div>
                )}

                {/* Floating "Scroll to Recent Messages" button */}
                {showScrollBottom && (
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    className="sticky bottom-2 self-center z-10 flex items-center gap-1 bg-[#3869A0] hover:bg-[#2c537f] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md cursor-pointer transition animate-bounce"
                  >
                    <ArrowDown className="w-3 h-3" />
                    <span>Mensajes recientes</span>
                  </button>
                )}
              </div>

              {/* Attached File preview before sending */}
              {attachedFile && (
                <div className="p-2 bg-blue-50/70 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900/50 flex items-center gap-2">
                  <div className="p-2 rounded bg-blue-100 dark:bg-blue-900 text-[#3869A0] dark:text-blue-300 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                      {attachedFile.name}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {attachedFile.size ? `${(attachedFile.size / 1024).toFixed(0)} KB • ` : ''}Listo para enviar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                    title="Quitar archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image preview before sending */}
              {imagePreview && (
                <div className="p-2 bg-blue-50/70 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-900/50 flex items-center gap-2">
                  <div className="relative w-12 h-12 rounded border border-blue-300 dark:border-blue-800 overflow-hidden flex-shrink-0 bg-white dark:bg-slate-800">
                    <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                      {isUploadingImage ? 'Subiendo foto...' : 'Foto lista para enviar'}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Pulsa Enviar para adjuntarla
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                    title="Quitar foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Quick Retro Replies Chips */}
              <div className="px-2 py-1 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
                {['¡Hola! ^^', '¿Qué tal?', 'Jajaja XD', 'Hablamos luego!'].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => {
                      setInputText(quick);
                    }}
                    className="whitespace-nowrap bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 hover:border-blue-300 text-gray-600 dark:text-gray-300 hover:text-[#3869A0] text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition"
                  >
                    {quick}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSend}
                onPaste={handlePaste}
                className="p-1.5 bg-white dark:bg-[#0e1726] border-t border-gray-200 dark:border-slate-800 flex items-center gap-1.5 relative"
              >
                {/* Emoticon Picker Toggle */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setEmoticonOpen(!emoticonOpen)}
                    className={`p-1 rounded text-gray-500 dark:text-gray-400 hover:text-[#3869A0] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition ${
                      emoticonOpen ? 'text-[#3869A0] bg-blue-50 dark:bg-blue-950/40' : ''
                    }`}
                    title="Insertar emoticonos retro y emojis"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {emoticonOpen && (
                    <EmoticonPicker
                      onSelect={handleInsertEmoticon}
                      onClose={() => setEmoticonOpen(false)}
                    />
                  )}
                </div>

                {/* Photo / File Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-[#3869A0] dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition disabled:opacity-50"
                  title="Enviar foto o archivo"
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#3869A0]" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>

                {/* Zumbido (Nudge) Button */}
                <button
                  type="button"
                  onClick={handleSendNudge}
                  className="p-1 rounded text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer transition"
                  title="¡Enviar zumbido! (hace vibrar la pantalla con sonido)"
                >
                  <Zap className="w-4 h-4 fill-amber-500" />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder="Escribe un mensaje o pega una foto..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 text-xs p-1.5 rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#3869A0] focus:ring-1 focus:ring-[#3869A0]"
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() && !imagePreview && !attachedFile}
                  className="p-1.5 bg-[#3869A0] text-white rounded hover:bg-[#2c537f] disabled:bg-gray-300 dark:disabled:bg-slate-700 transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                  title="Enviar mensaje"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </>
      )}

      {/* Lightbox / Modal for full-size photo viewing with Carousel & Jump to Message */}
      {lightboxImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-[#0e1726] border border-slate-700 rounded-lg overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="bg-[#18253a] px-3 py-2 flex items-center justify-between text-white border-b border-slate-700">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Foto de Inkorium Chat</span>
                {sharedPhotos.length > 1 && (
                  <span className="text-[10px] text-gray-400 ml-1">
                    ({lightboxActiveIndex + 1} de {sharedPhotos.length})
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                {currentLightboxMessage && (
                  <button
                    type="button"
                    onClick={() => handleJumpToMessage(currentLightboxMessage.id)}
                    className="text-[10px] bg-blue-600/60 hover:bg-blue-600 text-white px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1"
                    title="Ver en el chat"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Ver en el chat</span>
                  </button>
                )}
                <a
                  href={lightboxImageUrl}
                  download="foto-inkorium.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-gray-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                  title="Descargar foto"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImageUrl(null)}
                  className="p-1 text-gray-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Stage with Next/Prev navigation */}
            <div className="relative p-2 flex items-center justify-center bg-black/40 overflow-auto max-h-[75vh]">
              {sharedPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition z-10 cursor-pointer shadow-lg"
                    title="Foto anterior (Flecha izquierda)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition z-10 cursor-pointer shadow-lg"
                    title="Siguiente foto (Flecha derecha)"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <img
                src={lightboxImageUrl}
                alt="Foto ampliada"
                className="max-h-[70vh] w-auto object-contain rounded select-none"
              />
            </div>

            {/* Lightbox Footer metadata */}
            {currentLightboxMessage && (
              <div className="bg-[#121c2c] px-3 py-1.5 flex items-center justify-between text-[11px] text-gray-400 border-t border-slate-800">
                <span>
                  Enviada por {currentLightboxMessage.emisorId === currentUser.id ? 'ti' : targetUser.nombre}
                </span>
                <span>{currentLightboxMessage.fecha}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
