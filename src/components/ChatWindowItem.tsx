import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CheckCheck, Minus, Send, Smile, X } from 'lucide-react';
import { User, ChatMessage, ChatWindow, UserPresence } from '../types';
import { getFullConversation, saveFullConversation, formatChatDateDivider } from '../lib/chatHistory';
import { playMessageSound } from '../utils/sound';
import { supabase } from '../lib/supabase';

interface ChatWindowItemProps {
  win: ChatWindow;
  targetUser: User;
  currentUser: User;
  onClose: (targetUserId: string) => void;
  onToggleMinimize: (targetUserId: string) => void;
  onOpenProfile: (targetUserId: string) => void;
  getUserPresenceDot: (u: { online: boolean; presencia?: UserPresence }) => string;
}

const PAGE_SIZE = 15;

type DbMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  body: string;
  is_read?: boolean;
  created_at: string;
};

const toChatMessage = (row: DbMessage): ChatMessage => {
  const timestamp = new Date(row.created_at).getTime();
  return {
    id: String(row.id),
    emisorId: String(row.sender_id),
    receptorId: String(row.recipient_id),
    mensaje: String(row.body || ''),
    fecha: new Date(row.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    leido: Boolean(row.is_read),
  };
};

const mergeMessages = (local: ChatMessage[], remote: ChatMessage[]) => {
  const byId = new Map<string, ChatMessage>();
  [...local, ...remote].forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};

export const ChatWindowItem: React.FC<ChatWindowItemProps> = ({
  win,
  targetUser,
  currentUser,
  onClose,
  onToggleMinimize,
  onOpenProfile,
  getUserPresenceDot,
}) => {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>(() =>
    getFullConversation(currentUser.id, targetUser.id, `${targetUser.nombre} ${targetUser.apellidos}`)
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const previousLength = useRef(0);

  useEffect(() => {
    setAllMessages(getFullConversation(currentUser.id, targetUser.id, `${targetUser.nombre} ${targetUser.apellidos}`));
    setVisibleCount(PAGE_SIZE);
    initialScrollDone.current = false;
  }, [currentUser.id, targetUser.id, targetUser.nombre, targetUser.apellidos]);

  useEffect(() => {
    let cancelled = false;
    const loadConversation = async () => {
      setLoading(true);
      setErrorText('');
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUserId = sessionData.session?.user?.id;
        if (!sessionUserId) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('private_messages')
          .select('id,sender_id,recipient_id,subject,body,is_read,created_at')
          .or(`and(sender_id.eq.${sessionUserId},recipient_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},recipient_id.eq.${sessionUserId})`)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (cancelled) return;

        const remote = ((data || []) as DbMessage[]).map(toChatMessage);
        const local = getFullConversation(currentUser.id, targetUser.id, `${targetUser.nombre} ${targetUser.apellidos}`);
        const merged = mergeMessages(local, remote);
        setAllMessages(merged);
        setVisibleCount(Math.min(PAGE_SIZE, merged.length));
        saveFullConversation(currentUser.id, targetUser.id, merged);
      } catch (error) {
        console.error('Chat conversation load failed:', error);
        if (!cancelled) setErrorText('No se ha podido cargar el chat remoto.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadConversation();
    return () => { cancelled = true; };
  }, [currentUser.id, targetUser.id, targetUser.nombre, targetUser.apellidos]);

  useEffect(() => {
    if (!supabase || !currentUser.id || !targetUser.id) return;
    const channel = supabase
      .channel(`private-chat-${currentUser.id}-${targetUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const row = payload.new as DbMessage;
        const isConversation =
          (String(row.sender_id) === currentUser.id && String(row.recipient_id) === targetUser.id) ||
          (String(row.sender_id) === targetUser.id && String(row.recipient_id) === currentUser.id);
        if (!isConversation) return;
        const incoming = toChatMessage(row);
        setAllMessages((previous) => {
          const merged = mergeMessages(previous, [incoming]);
          saveFullConversation(currentUser.id, targetUser.id, merged);
          return merged;
        });
        setVisibleCount((previous) => Math.max(previous + 1, PAGE_SIZE));
        if (String(row.recipient_id) === currentUser.id) {
          void supabase.from('private_messages').update({ is_read: true }).eq('id', row.id).eq('recipient_id', currentUser.id);
          try { playMessageSound(); } catch {}
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [currentUser.id, targetUser.id]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (!initialScrollDone.current && allMessages.length > 0) {
      element.scrollTop = element.scrollHeight;
      initialScrollDone.current = true;
    } else if (allMessages.length > previousLength.current) {
      element.scrollTop = element.scrollHeight;
    }
    previousLength.current = allMessages.length;
  }, [allMessages.length, visibleCount]);

  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = inputText.trim();
    if (!text || sending || !supabase || !targetUser.id || targetUser.id === currentUser.id) return;

    setSending(true);
    setErrorText('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const senderId = sessionData.session?.user?.id;
      if (!senderId) throw new Error('No hay una sesión de Supabase activa.');
      if (senderId === targetUser.id) throw new Error('El destinatario no puede ser el mismo usuario.');

      const { data, error } = await supabase
        .from('private_messages')
        .insert({ sender_id: senderId, recipient_id: targetUser.id, subject: 'Chat instantáneo', body: text })
        .select('id,sender_id,recipient_id,subject,body,is_read,created_at')
        .single();
      if (error) throw error;

      const sentMessage = toChatMessage(data as DbMessage);
      setAllMessages((previous) => {
        const merged = mergeMessages(previous, [sentMessage]);
        saveFullConversation(currentUser.id, targetUser.id, merged);
        return merged;
      });
      setVisibleCount((previous) => Math.max(previous + 1, PAGE_SIZE));
      setInputText('');
      try { playMessageSound(); } catch {}
    } catch (error: any) {
      console.error('Chat message send failed:', error);
      setErrorText(error?.message || 'No se ha podido enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const visibleMessages = allMessages.slice(-visibleCount);
  const olderCount = Math.max(0, allMessages.length - visibleCount);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    if (element.scrollTop <= 30 && olderCount > 0) {
      setVisibleCount((count) => Math.min(allMessages.length, count + PAGE_SIZE));
    }
    setShowScrollBottom(element.scrollHeight - element.scrollTop - element.clientHeight > 90);
  };

  const grouped = visibleMessages.reduce<React.ReactNode[]>((elements, message, index) => {
    const divider = formatChatDateDivider(message.timestamp || message.fecha);
    const previous = visibleMessages[index - 1];
    const previousDivider = previous ? formatChatDateDivider(previous.timestamp || previous.fecha) : '';
    if (divider !== previousDivider) {
      elements.push(<div key={`date-${message.id}`} className="text-center my-2"><span className="bg-gray-200/90 text-gray-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-300">{divider}</span></div>);
    }
    const mine = message.emisorId === currentUser.id;
    elements.push(
      <div key={message.id} className={`flex flex-col max-w-[85%] ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
        <div className={`p-2 rounded-lg text-xs leading-snug shadow-sm select-text ${mine ? 'bg-[#3869A0] text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>{message.mensaje}</div>
        <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5 px-1"><span>{message.fecha}</span>{mine && <CheckCheck className="w-3 h-3" />}</div>
      </div>
    );
    return elements;
  }, [] as React.ReactNode[]);

  return (
    <div className="w-64 sm:w-76 bg-white rounded-t-lg shadow-2xl border border-gray-300 flex flex-col overflow-hidden text-xs">
      <div onClick={() => onToggleMinimize(win.targetUserId)} className="bg-[#3869A0] text-white px-3 py-2 flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-2 truncate">
          <div className="relative"><img src={targetUser.avatar} alt="" className="w-5 h-5 rounded object-cover border border-white/80"/><span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${getUserPresenceDot(targetUser)}`} /></div>
          <span className="font-bold text-xs truncate">{targetUser.nombre} {targetUser.apellidos}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={(e) => { e.stopPropagation(); onToggleMinimize(win.targetUserId); }} className="p-0.5 hover:bg-white/10 rounded" title="Minimizar"><Minus className="w-3.5 h-3.5"/></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClose(win.targetUserId); }} className="p-0.5 hover:bg-white/10 rounded" title="Cerrar"><X className="w-3.5 h-3.5"/></button>
        </div>
      </div>
      {!win.minimized && <>
        <div ref={scrollRef} onScroll={handleScroll} className="h-68 p-2.5 overflow-y-auto bg-[#f8fafc] space-y-1.5 flex flex-col">
          {loading && <div className="text-center py-3 text-gray-400 text-[10px]">Cargando conversación…</div>}
          {olderCount > 0 && <div className="text-center text-[10px] text-[#3869A0] py-1">Hay {olderCount} mensajes anteriores</div>}
          {grouped}
          {showScrollBottom && <button type="button" onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })} className="sticky bottom-2 self-center bg-[#3869A0] text-white px-2.5 py-1 rounded-full text-[10px] font-bold"><ArrowDown className="w-3 h-3 inline mr-1"/>Recientes</button>}
          {!loading && !allMessages.length && <div className="text-center py-8 text-gray-400 text-[10px]"><img src={targetUser.avatar} alt="" className="w-10 h-10 rounded-full mx-auto object-cover border border-gray-300"/><p className="font-bold mt-2">{targetUser.nombre} {targetUser.apellidos}</p><p className="mt-1">Inicio del historial de chat</p></div>}
        </div>
        {errorText && <div className="px-2 py-1.5 text-[10px] text-red-600 bg-red-50 border-t border-red-200 break-words">{errorText}</div>}
        <div className="px-2 py-1 bg-gray-50 border-t border-gray-200 flex gap-1 overflow-x-auto">
          {['¡Hola! ^^','¿Qué tal?','Jajaja XD','Hablamos luego!'].map((quick) => <button key={quick} type="button" onClick={() => setInputText(quick)} className="whitespace-nowrap bg-white border border-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">{quick}</button>)}
        </div>
        <form onSubmit={send} className="p-1.5 bg-white border-t border-gray-200 flex items-center gap-1.5">
          <button type="button" onClick={() => setInputText((text) => `${text}${text ? ' ' : ''}😊`)} className="p-1 rounded text-gray-500 hover:text-[#3869A0]"><Smile className="w-4 h-4"/></button>
          <input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Escribe un mensaje…" className="flex-1 min-w-0 p-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]" disabled={sending}/>
          <button type="submit" disabled={!inputText.trim() || sending} className="p-1.5 rounded bg-[#3869A0] text-white disabled:opacity-40" title="Enviar"><Send className="w-4 h-4"/></button>
        </form>
      </>}
    </div>
  );
};
