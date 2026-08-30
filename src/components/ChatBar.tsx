import React, { useState, useRef, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  MessageSquare, ChevronUp, ChevronDown, X, Minus, 
  Send, Search, Smile, Sparkles, Check 
} from 'lucide-react';
import { UserPresence } from '../types';

const PRESENCE_DOTS: Record<UserPresence, { label: string; dot: string; text: string; bg: string }> = {
  conectado: { label: 'Conectado', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  ausente: { label: 'Ausente', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  ocupado: { label: 'Ocupado', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' }
};

export const ChatBar: React.FC = () => {
  const {
    currentUser,
    users,
    activeChatWindows,
    chatMessages,
    closeChat,
    toggleMinimizeChat,
    sendChatMessage,
    openChatWith,
    updateUserPresence,
    viewUserProfile
  } = useInkorium();

  const [dockOpen, setDockOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [inputTexts, setInputTexts] = useState<Record<string, string>>({});
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const myPresence: UserPresence = currentUser.presencia || (currentUser.online ? 'conectado' : 'invisible');

  // Filter friends for chat list
  const chatFriends = users.filter(u => {
    if (u.id === currentUser.id) return false;
    if (chatSearch.trim()) {
      return `${u.nombre} ${u.apellidos}`.toLowerCase().includes(chatSearch.toLowerCase());
    }
    return true;
  });

  const onlineCount = users.filter(u => u.id !== currentUser.id && u.online).length;

  const handleSend = (targetUserId: string) => {
    const text = inputTexts[targetUserId];
    if (!text || !text.trim()) return;
    sendChatMessage(targetUserId, text.trim());
    setInputTexts(prev => ({ ...prev, [targetUserId]: '' }));
  };

  const getUserPresenceDot = (u: { online: boolean; presencia?: UserPresence }) => {
    if (!u.online || u.presencia === 'invisible') return 'bg-gray-400';
    if (u.presencia === 'ausente') return 'bg-amber-500';
    if (u.presencia === 'ocupado') return 'bg-red-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="fixed bottom-0 right-3 z-40 flex items-end gap-2 pointer-events-none">
      {/* ================= OPEN CHAT WINDOWS ================= */}
      <div className="flex items-end gap-2 pointer-events-auto">
        {activeChatWindows.map(win => {
          const targetUser = users.find(u => u.id === win.targetUserId);
          if (!targetUser) return null;

          // Messages between current user and target user
          const convMessages = chatMessages.filter(
            m => (m.emisorId === currentUser.id && m.receptorId === targetUser.id) ||
                 (m.emisorId === targetUser.id && m.receptorId === currentUser.id)
          );

          return (
            <div
              key={win.targetUserId}
              className="w-64 sm:w-72 bg-white rounded-t-lg shadow-2xl border border-gray-300 flex flex-col overflow-hidden text-xs transition-all duration-200 animate-slide-up"
            >
              {/* Chat Header */}
              <div 
                onClick={() => toggleMinimizeChat(win.targetUserId)}
                className="bg-[#3869A0] text-white px-3 py-2 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="relative flex-shrink-0">
                    <img src={targetUser.avatar} alt="" className="w-5 h-5 rounded object-cover border border-white/80" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getUserPresenceDot(targetUser)}`} />
                  </div>
                  <span className="font-bold text-xs truncate">{targetUser.nombre} {targetUser.apellidos}</span>
                </div>

                <div className="flex items-center gap-1 text-white/80">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMinimizeChat(win.targetUserId); }}
                    className="p-0.5 hover:text-white"
                    title={win.minimized ? 'Expandir' : 'Minimizar'}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); closeChat(win.targetUserId); }}
                    className="p-0.5 hover:text-white"
                    title="Cerrar chat"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Body (if not minimized) */}
              {!win.minimized && (
                <>
                  {/* Messages scroll area */}
                  <div className="h-60 p-2.5 overflow-y-auto bg-[#f8fafc] space-y-2 flex flex-col">
                    {/* User profile snippet at top */}
                    <div className="text-center py-2 border-b border-gray-200 mb-1">
                      <img src={targetUser.avatar} alt="" className="w-10 h-10 rounded-full mx-auto object-cover border shadow-xs" />
                      <p className="font-bold text-gray-800 text-[11px] mt-1">{targetUser.nombre} {targetUser.apellidos}</p>
                      <p className="text-[10px] text-gray-500">{targetUser.provincia} • {targetUser.online ? '🟢 Conectado' : 'Desconectado'}</p>
                    </div>

                    {convMessages.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-[11px]">
                        Inicia una conversación con {targetUser.nombre}...
                      </div>
                    ) : (
                      convMessages.map(msg => {
                        const isMe = msg.emisorId === currentUser.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                          >
                            <div
                              className={`p-2 rounded-lg text-xs leading-snug shadow-xs ${
                                isMe 
                                  ? 'bg-[#3869A0] text-white rounded-br-none' 
                                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                              }`}
                            >
                              {msg.mensaje}
                            </div>
                            <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.fecha}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input field */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend(win.targetUserId);
                    }}
                    className="p-2 bg-white border-t border-gray-200 flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      placeholder="Escribe un mensaje..."
                      value={inputTexts[win.targetUserId] || ''}
                      onChange={e => setInputTexts(prev => ({ ...prev, [win.targetUserId]: e.target.value }))}
                      className="flex-1 text-xs p-1.5 rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!inputTexts[win.targetUserId]?.trim()}
                      className="p-1.5 bg-[#3869A0] text-white rounded hover:bg-[#2c537f] disabled:bg-gray-300 transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ================= MAIN DOCK BAR (Bottom Right) ================= */}
      <div className="pointer-events-auto">
        <div className="w-56 bg-white rounded-t-lg shadow-2xl border border-gray-300 overflow-hidden text-xs">
          {/* Dock Header */}
          <div
            onClick={() => setDockOpen(!dockOpen)}
            className="bg-[#3869A0] text-white px-3 py-2 flex items-center justify-between cursor-pointer select-none hover:bg-[#2e5785] transition"
          >
            <div className="flex items-center gap-2 font-bold">
              <span className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[myPresence].dot} ${myPresence === 'conectado' ? 'animate-pulse' : ''}`} />
              <span>Chat ({onlineCount})</span>
              <span className="text-[10px] font-normal text-blue-100 bg-black/20 px-1.5 py-0.2 rounded capitalize">
                {myPresence}
              </span>
            </div>
            {dockOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>

          {/* Expanded Friends Online List & Presence Controls */}
          {dockOpen && (
            <div className="p-2 bg-white border-t border-gray-200 space-y-2 max-h-80 flex flex-col">
              {/* Quick presence selector inside chat dock */}
              <div className="bg-gray-50 border border-gray-200 rounded p-1.5">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold mb-1">
                  <span>Tu presencia:</span>
                  <span className={`capitalize font-bold ${PRESENCE_DOTS[myPresence].text}`}>
                    {PRESENCE_DOTS[myPresence].label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(Object.keys(PRESENCE_DOTS) as UserPresence[]).map((key) => {
                    const cfg = PRESENCE_DOTS[key];
                    const isSelected = myPresence === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateUserPresence(key)}
                        title={cfg.label}
                        className={`flex items-center justify-center gap-1 py-1 px-0.5 rounded border text-[10px] font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#3869A0] text-[#3869A0] font-bold shadow-2xs'
                            : 'bg-gray-100/80 border-gray-200 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className="truncate">{cfg.label.slice(0, 4)}.</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search friend */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar amigos..."
                  value={chatSearch}
                  onChange={e => setChatSearch(e.target.value)}
                  className="w-full p-1.5 pl-6 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-gray-50"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-1.5 top-2 pointer-events-none" />
              </div>

              {/* Friends list */}
              <div className="overflow-y-auto space-y-1 flex-1">
                {chatFriends.map(friend => {
                  const dotColor = getUserPresenceDot(friend);
                  const isOnline = friend.online && friend.presencia !== 'invisible';
                  return (
                    <div
                      key={friend.id}
                      onClick={() => {
                        openChatWith(friend.id);
                      }}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-blue-50 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="relative flex-shrink-0">
                          <img src={friend.avatar} alt="" className="w-6 h-6 rounded object-cover border border-gray-300" />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        </div>
                        <span className="font-semibold text-gray-800 truncate text-[11px]">{friend.nombre} {friend.apellidos}</span>
                      </div>

                      <span className="text-[10px] text-gray-400 flex-shrink-0 capitalize">
                        {friend.presencia || (isOnline ? 'Online' : 'Off')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
