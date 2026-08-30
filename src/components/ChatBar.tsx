import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { MessageSquare, ChevronUp, ChevronDown, X, Minus, Send, Search } from 'lucide-react';
import { UserPresence } from '../types';

const PRESENCE_DOTS: Record<UserPresence, { label: string; dot: string; text: string }> = {
  conectado: { label: 'Conectado', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  ausente: { label: 'Ausente', dot: 'bg-amber-500', text: 'text-amber-700' },
  ocupado: { label: 'Ocupado', dot: 'bg-red-500', text: 'text-red-700' },
  invisible: { label: 'Invisible', dot: 'bg-gray-400', text: 'text-gray-600' }
};

export const ChatBar: React.FC = () => {
  const { currentUser, users, activeChatWindows, chatMessages, closeChat, toggleMinimizeChat, sendChatMessage, openChatWith, viewUserProfile, updateUserPresence } = useInkorium();
  const [dockOpen, setDockOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [inputTexts, setInputTexts] = useState<Record<string, string>>({});
  const [presence, setPresence] = useState<UserPresence>(currentUser.presencia || (currentUser.online ? 'conectado' : 'invisible'));
  const [savingPresence, setSavingPresence] = useState(false);

  React.useEffect(() => {
    setPresence(currentUser.presencia || (currentUser.online ? 'conectado' : 'invisible'));
  }, [currentUser.presencia, currentUser.online]);

  const handlePresenceChange = (nextPresence: UserPresence) => {
    if (!currentUser.id || savingPresence) return;
    setSavingPresence(true);
    setPresence(nextPresence);
    updateUserPresence(nextPresence);
    setSavingPresence(false);
  };

  const chatFriends = users.filter(u => {
    if (u.id === currentUser.id) return false;
    if (chatSearch.trim()) return `${u.nombre} ${u.apellidos}`.toLowerCase().includes(chatSearch.toLowerCase());
    return true;
  });

  const getUserPresenceDot = (u: { online: boolean; presencia?: UserPresence }) => {
    if (!u.online || u.presencia === 'invisible') return 'bg-gray-400';
    if (u.presencia === 'ausente') return 'bg-amber-500';
    if (u.presencia === 'ocupado') return 'bg-red-500';
    return 'bg-emerald-500';
  };

  const handleSend = (targetUserId: string) => {
    const text = inputTexts[targetUserId];
    if (!text?.trim()) return;
    sendChatMessage(targetUserId, text.trim());
    setInputTexts(prev => ({ ...prev, [targetUserId]: '' }));
  };

  const onlineCount = users.filter(u => u.id !== currentUser.id && u.online).length;

  return (
    <div className="fixed bottom-0 right-3 z-40 flex items-end gap-2 pointer-events-none">
      <div className="flex items-end gap-2 pointer-events-auto">
        {activeChatWindows.map(win => {
          const targetUser = users.find(u => u.id === win.targetUserId);
          if (!targetUser) return null;
          const convMessages = chatMessages.filter(m => (m.emisorId === currentUser.id && m.receptorId === targetUser.id) || (m.emisorId === targetUser.id && m.receptorId === currentUser.id));
          return (
            <div key={win.targetUserId} className="w-64 sm:w-72 bg-white rounded-t-lg shadow-2xl border border-gray-300 flex flex-col overflow-hidden text-xs">
              <div onClick={() => toggleMinimizeChat(win.targetUserId)} className="bg-[#3869A0] text-white px-3 py-2 flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2 truncate">
                  <div className="relative flex-shrink-0"><img src={targetUser.avatar} alt="" className="w-5 h-5 rounded object-cover border border-white/80" /><span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getUserPresenceDot(targetUser)}`} /></div>
                  <span className="font-bold text-xs truncate">{targetUser.nombre} {targetUser.apellidos}</span>
                </div>
                <div className="flex items-center gap-1 text-white/80">
                  <button onClick={e => { e.stopPropagation(); toggleMinimizeChat(win.targetUserId); }} className="p-0.5 hover:text-white"><Minus className="w-3.5 h-3.5" /></button>
                  <button onClick={e => { e.stopPropagation(); closeChat(win.targetUserId); }} className="p-0.5 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {!win.minimized && <>
                <div className="h-60 p-2.5 overflow-y-auto bg-[#f8fafc] space-y-2 flex flex-col">
                  <div className="text-center py-2 border-b border-gray-200 mb-1"><img src={targetUser.avatar} alt="" className="w-10 h-10 rounded-full mx-auto object-cover border shadow-xs" /><p className="font-bold text-gray-800 text-[11px] mt-1">{targetUser.nombre} {targetUser.apellidos}</p><p className="text-[10px] text-gray-500">{targetUser.provincia} • {targetUser.online ? '🟢 Conectado' : 'Desconectado'}</p></div>
                  {convMessages.length === 0 ? <div className="text-center py-6 text-gray-400 text-[11px]">Inicia una conversación con {targetUser.nombre}...</div> : convMessages.map(msg => {
                    const isMe = msg.emisorId === currentUser.id;
                    return <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}><div className={`p-2 rounded-lg text-xs leading-snug shadow-xs ${isMe ? 'bg-[#3869A0] text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>{msg.mensaje}</div><span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.fecha}</span></div>;
                  })}
                </div>
                <form onSubmit={e => { e.preventDefault(); handleSend(win.targetUserId); }} className="p-2 bg-white border-t border-gray-200 flex items-center gap-1.5">
                  <input type="text" placeholder="Escribe un mensaje..." value={inputTexts[win.targetUserId] || ''} onChange={e => setInputTexts(prev => ({ ...prev, [win.targetUserId]: e.target.value }))} className="flex-1 text-xs p-1.5 rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]" />
                  <button type="submit" disabled={!inputTexts[win.targetUserId]?.trim()} className="p-1.5 bg-[#3869A0] text-white rounded hover:bg-[#2c537f] disabled:bg-gray-300 transition"><Send className="w-3.5 h-3.5" /></button>
                </form>
              </>}
            </div>
          );
        })}
      </div>

      <div className="pointer-events-auto">
        <div className="w-56 bg-white rounded-t-lg shadow-2xl border border-gray-300 overflow-hidden text-xs">
          <div onClick={() => setDockOpen(!dockOpen)} className="bg-[#3869A0] text-white px-3 py-2 flex items-center justify-between cursor-pointer select-none hover:bg-[#2e5785] transition">
            <div className="flex items-center gap-2 font-bold"><span className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[presence].dot} ${presence === 'conectado' ? 'animate-pulse' : ''}`} /><span>Chat ({onlineCount})</span><span className="text-[10px] font-normal text-blue-100 bg-black/20 px-1.5 py-0.2 rounded capitalize">{presence}</span></div>
            {dockOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
          {dockOpen && <div className="p-2 bg-white border-t border-gray-200 space-y-2 max-h-80 flex flex-col">
            <div className="bg-gray-50 border border-gray-200 rounded p-1.5">
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold mb-1"><span>Tu presencia:</span><span className={`capitalize font-bold ${PRESENCE_DOTS[presence].text}`}>{PRESENCE_DOTS[presence].label}</span></div>
              <div className="grid grid-cols-4 gap-1">{(Object.keys(PRESENCE_DOTS) as UserPresence[]).map(key => { const cfg = PRESENCE_DOTS[key]; const isSelected = presence === key; return <button key={key} type="button" onClick={() => handlePresenceChange(key)} disabled={savingPresence} title={cfg.label} className={`flex items-center justify-center gap-1 py-1 px-0.5 rounded border text-[10px] font-medium transition cursor-pointer disabled:opacity-60 ${isSelected ? 'bg-white border-[#3869A0] text-[#3869A0] font-bold shadow-2xs' : 'bg-gray-100/80 border-gray-200 text-gray-600 hover:bg-gray-200'}`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /><span className="truncate">{cfg.label.slice(0, 4)}.</span></button>; })}</div>
            </div>
            <div className="relative"><input type="text" placeholder="Buscar amigos..." value={chatSearch} onChange={e => setChatSearch(e.target.value)} className="w-full p-1.5 pl-6 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-gray-50" /><Search className="w-3.5 h-3.5 text-gray-400 absolute left-1.5 top-2 pointer-events-none" /></div>
            <div className="overflow-y-auto space-y-1 flex-1">{chatFriends.map(friend => { const dotColor = getUserPresenceDot(friend); return <div key={friend.id} onClick={() => openChatWith(friend.id)} className="flex items-center justify-between p-1.5 rounded hover:bg-blue-50 cursor-pointer transition"><div className="flex items-center gap-2 truncate"><div className="relative flex-shrink-0"><img src={friend.avatar} alt="" className="w-6 h-6 rounded object-cover border border-gray-300" /><span className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${dotColor}`} /></div><span onClick={e => { e.stopPropagation(); viewUserProfile(friend.id); }} className="font-semibold text-gray-800 truncate text-[11px] cursor-pointer">{friend.nombre} {friend.apellidos}</span></div><span className="text-[10px] text-gray-400 flex-shrink-0 capitalize">{friend.presencia || (friend.online ? 'Online' : 'Off')}</span></div>; })}</div>
          </div>}
        </div>
      </div>
    </div>
  );
};
