import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Minus, X, Send, Smile, ArrowDown, Loader2, CheckCheck, Clock, UserCheck } from 'lucide-react';
import { User, ChatWindow, ChatMessage, UserPresence } from '../types';
import { getFullConversation, appendMessageToConversation, formatChatDateDivider } from '../lib/chatHistory';
import EmoticonPicker from './EmoticonPicker';
import { playMessageSound } from '../utils/sound';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 10;

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
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(() => {
    return getFullConversation(currentUser.id, targetUser.id, `${targetUser.nombre} ${targetUser.apellidos}`);
  });

  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [emoticonOpen, setEmoticonOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const preScrollRef = useRef<{ height: number; top: number } | null>(null);
  const isInitialScrollDoneRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  // Sync conversation history when window or active users change
  useEffect(() => {
    const msgs = getFullConversation(currentUser.id, targetUser.id, `${targetUser.nombre} ${targetUser.apellidos}`);
    setAllMessages(msgs);
    // Start with last PAGE_SIZE messages
    setVisibleCount(Math.min(PAGE_SIZE, msgs.length));
    isInitialScrollDoneRef.current = false;
  }, [currentUser.id, targetUser.id, targetUser.nombre, targetUser.apellidos]);

  // Compute sliced visible messages
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

    // Simulate natural fetch latency for historical pagination
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
      // User just loaded older messages: restore scroll offset relative to new height
      const newHeight = container.scrollHeight;
      const heightDiff = newHeight - preScrollRef.current.height;
      container.scrollTop = preScrollRef.current.top + heightDiff;
      preScrollRef.current = null;
    } else if (!isInitialScrollDoneRef.current && visibleMessages.length > 0) {
      // First mount: jump smoothly to bottom
      container.scrollTop = container.scrollHeight;
      isInitialScrollDoneRef.current = true;
    } else if (allMessages.length > prevMessagesLengthRef.current) {
      // New outgoing/incoming message appended to bottom: scroll to bottom
      container.scrollTop = container.scrollHeight;
    }

    prevMessagesLengthRef.current = allMessages.length;
  }, [visibleMessages.length, allMessages.length]);

  // Handle scroll events: Detect top scroll (infinite scroll) and bottom visibility
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // Detect near top for upward infinite scroll
    if (scrollTop <= 30 && hasMore && !isLoadingOlder) {
      loadOlderMessages();
    }

    // Detect if user has scrolled away from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 90);
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !currentUser.id || !targetUser.id) return;
    if (targetUser.id === currentUser.id) return;

    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      emisorId: currentUser.id,
      receptorId: targetUser.id,
      mensaje: text,
      fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      leido: true
    };

    const updated = appendMessageToConversation(currentUser.id, targetUser.id, newMsg);
    setAllMessages(updated);
    setVisibleCount(prev => prev + 1);
    setInputText('');
    setEmoticonOpen(false);

    try {
      playMessageSound();
    } catch {
      // audio error safely ignored
    }

    // Persist chat message to backend / Supabase
    void (async () => {
      try {
        if (supabase) {
          const session = await supabase.auth.getSession().catch(() => null);
          const token = session?.data?.session?.access_token;
          await fetch('/api/private-messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              sender_id: currentUser.id,
              recipient_id: targetUser.id,
              subject: 'Chat instantáneo',
              body: text
            })
          }).catch(() => null);
        }
      } catch (err) {
        console.warn('Chat remote sync error:', err);
      }
    })();
  };

  const handleInsertEmoticon = (val: string) => {
    setInputText(prev => `${prev} ${val} `);
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
            <span className="bg-gray-200/90 text-gray-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-300 shadow-2xs">
              {dateDivider}
            </span>
          </div>
        );
      }

      const isMe = msg.emisorId === currentUser.id;

      elements.push(
        <div
          key={msg.id || `msg-${idx}`}
          className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
        >
          <div
            className={`p-2 rounded-lg text-xs leading-snug shadow-xs select-text ${
              isMe
                ? 'bg-[#3869A0] text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
            }`}
          >
            {msg.mensaje}
          </div>
          <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5 px-1">
            <span>{msg.fecha}</span>
            {isMe && <CheckCheck className="w-3 h-3 text-[#3869A0]/80" title="Enviado" />}
          </div>
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="w-64 sm:w-76 bg-white rounded-t-lg shadow-2xl border border-gray-300 flex flex-col overflow-hidden text-xs select-none">
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

      {/* Chat Window Body */}
      {!win.minimized && (
        <>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-68 p-2.5 overflow-y-auto bg-[#f8fafc] space-y-1.5 flex flex-col relative"
          >
            {/* Top Loading Indicator & Infinite Scroll Button */}
            {hasMore ? (
              <div className="flex flex-col items-center justify-center py-1.5 border-b border-gray-200/80 mb-2">
                {isLoadingOlder ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#3869A0] font-medium py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cargando historial anterior...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={loadOlderMessages}
                    className="flex items-center gap-1 text-[11px] text-[#3869A0] font-semibold hover:underline bg-white border border-gray-300 hover:border-[#3869A0] px-2.5 py-1 rounded-full shadow-2xs cursor-pointer transition"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Ver mensajes anteriores ({remainingCount} más)</span>
                  </button>
                )}
                <span className="text-[9px] text-gray-400 mt-1">
                  Desliza hacia arriba para cargar automáticamente
                </span>
              </div>
            ) : (
              /* Milestone: Beginning of Conversation History */
              <div className="text-center py-3 border-b border-gray-200 mb-2 bg-blue-50/50 rounded-lg p-2">
                <img
                  src={targetUser.avatar}
                  alt=""
                  className="w-10 h-10 rounded-full mx-auto object-cover border border-gray-300 shadow-2xs"
                />
                <p className="font-bold text-gray-800 text-[11px] mt-1">
                  {targetUser.nombre} {targetUser.apellidos}
                </p>
                <p className="text-[10px] text-gray-500">
                  {targetUser.provincia} • {targetUser.online ? '🟢 Conectado' : 'Desconectado'}
                </p>
                <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-gray-600 bg-white/80 py-0.5 px-2 rounded-full border border-blue-200 inline-flex mx-auto">
                  <UserCheck className="w-3 h-3 text-[#3869A0]" />
                  <span>Inicio del historial de chat</span>
                </div>
              </div>
            )}

            {/* Messages Stream with Date Separators */}
            {renderMessagesWithDividers()}

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

          {/* Quick Retro Replies Chips */}
          <div className="px-2 py-1 bg-gray-50 border-t border-gray-200 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {['¡Hola! ^^', '¿Qué tal?', 'Jajaja XD', 'Hablamos luego!'].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => {
                  setInputText(quick);
                }}
                className="whitespace-nowrap bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-[#3869A0] text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition"
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-1.5 bg-white border-t border-gray-200 flex items-center gap-1.5 relative"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setEmoticonOpen(!emoticonOpen)}
                className={`p-1 rounded text-gray-500 hover:text-[#3869A0] hover:bg-gray-100 cursor-pointer transition ${
                  emoticonOpen ? 'text-[#3869A0] bg-blue-50' : ''
                }`}
                title="Insertar emoticonos"
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

            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs p-1.5 rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] focus:ring-1 focus:ring-[#3869A0]"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 bg-[#3869A0] text-white rounded hover:bg-[#2c537f] disabled:bg-gray-300 transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
              title="Enviar mensaje"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
