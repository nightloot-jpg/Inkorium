import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Inbox, Mail, Reply, Send, SendHorizontal, Trash2 } from 'lucide-react';
import { useInkorium } from '../context/InkoriumContext';
import { supabase } from '../lib/supabase';
import { PrivateMessage } from '../types';
import { INITIAL_MESSAGES } from '../data/mockData';

const STORAGE_KEY = 'inkorium:private_messages';

function getStoredMessages(): PrivateMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_MESSAGES;
}

function saveStoredMessages(list: PrivateMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

type DbMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export const MessagesViewV2: React.FC = () => {
  const { currentUser, users, viewUserProfile } = useInkorium();
  const [messages, setMessages] = useState<PrivateMessage[]>(() => getStoredMessages());
  const [mode, setMode] = useState<'recibidos' | 'enviados' | 'enviar'>('recibidos');
  const [selectedMessage, setSelectedMessage] = useState<PrivateMessage | null>(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const mapMessage = useCallback((r: DbMessage): PrivateMessage => {
    const s = userMap.get(r.sender_id);
    const t = userMap.get(r.recipient_id);
    return {
      id: r.id,
      emisorId: r.sender_id,
      emisorNombre: s ? `${s.nombre} ${s.apellidos}`.trim() : 'Usuario',
      emisorAvatar: s?.avatar || '',
      receptorId: r.recipient_id,
      receptorNombre: t ? `${t.nombre} ${t.apellidos}`.trim() : 'Usuario',
      asunto: r.subject || 'Sin asunto',
      mensaje: r.body,
      fecha: new Date(r.created_at).toLocaleString('es-ES'),
      leido: Boolean(r.is_read)
    };
  }, [userMap]);

  const loadMessages = useCallback(async () => {
    if (!supabase || !currentUser?.id) return;
    try {
      const { data, error: e } = await (supabase.from('private_messages') as any)
        .select('id,sender_id,recipient_id,subject,body,is_read,created_at')
        .order('created_at', { ascending: false });

      if (!e && Array.isArray(data) && data.length > 0) {
        const mapped = (data as unknown as DbMessage[]).map(mapMessage);
        setMessages(prev => {
          const mergedMap = new Map<string, PrivateMessage>();
          mapped.forEach((m: PrivateMessage) => mergedMap.set(m.id, m));
          prev.forEach((m: PrivateMessage) => {
            if (!mergedMap.has(m.id)) mergedMap.set(m.id, m);
          });
          const result = Array.from(mergedMap.values());
          saveStoredMessages(result);
          return result;
        });
      }
    } catch (err) {
      // Gracefully fall back to local storage without throwing UI error
      console.warn('Private messages remote sync skipped:', err);
    }
  }, [currentUser?.id, mapMessage]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!supabase || !currentUser?.id) return;
    try {
      const ch = supabase
        .channel(`private-messages-${currentUser.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages', filter: `recipient_id=eq.${currentUser.id}` }, () => void loadMessages())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages', filter: `sender_id=eq.${currentUser.id}` }, () => void loadMessages())
        .subscribe();
      return () => { void supabase.removeChannel(ch); };
    } catch {
      // ignore
    }
  }, [currentUser?.id, loadMessages]);

  const isCurrentRecipient = (m: PrivateMessage) => {
    return (
      m.receptorId === currentUser.id ||
      m.receptorId === currentUser.username ||
      (currentUser.email && m.receptorId === currentUser.email) ||
      (currentUser.id === 'user-nightloot' && m.receptorId === 'nightloot') ||
      (currentUser.id === 'nightloot' && m.receptorId === 'user-nightloot')
    );
  };

  const isCurrentSender = (m: PrivateMessage) => {
    return (
      m.emisorId === currentUser.id ||
      m.emisorId === currentUser.username ||
      (currentUser.email && m.emisorId === currentUser.email) ||
      (currentUser.id === 'user-nightloot' && m.emisorId === 'nightloot') ||
      (currentUser.id === 'nightloot' && m.emisorId === 'user-nightloot')
    );
  };

  const received = messages.filter(isCurrentRecipient);
  const sent = messages.filter(isCurrentSender);
  const others = users.filter(u => u.id !== currentUser.id && u.username !== currentUser.username);

  const open = async (m: PrivateMessage) => {
    setSelectedMessage(m);
    if (m.leido || !isCurrentRecipient(m)) return;

    setMessages(prev => {
      const updated = prev.map(x => x.id === m.id ? { ...x, leido: true } : x);
      saveStoredMessages(updated);
      return updated;
    });
    setSelectedMessage(prev => (prev ? { ...prev, leido: true } : prev));

    if (supabase) {
      try {
        await (supabase.from('private_messages') as any)
          .update({ is_read: true })
          .eq('id', m.id)
          .eq('recipient_id', currentUser.id);
      } catch {
        // local update already succeeded
      }
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const b = body.trim();
    if (!targetUserId || !b || sending) return;
    setSending(true);
    setError('');

    const targetUser = userMap.get(targetUserId);
    const newMsg: PrivateMessage = {
      id: `msg-${Date.now()}`,
      emisorId: currentUser.id,
      emisorNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim(),
      emisorAvatar: currentUser.avatar,
      receptorId: targetUserId,
      receptorNombre: targetUser ? `${targetUser.nombre} ${targetUser.apellidos}`.trim() : 'Usuario',
      asunto: subject.trim().slice(0, 200) || 'Sin asunto',
      mensaje: b,
      fecha: 'Ahora mismo',
      leido: false
    };

    setMessages(prev => {
      const updated = [newMsg, ...prev];
      saveStoredMessages(updated);
      return updated;
    });

    setTargetUserId('');
    setSubject('');
    setBody('');
    setMode('enviados');
    setSending(false);

    if (supabase && currentUser.id) {
      try {
        await (supabase.from('private_messages') as any).insert({
          sender_id: currentUser.id,
          recipient_id: targetUserId,
          subject: newMsg.asunto,
          body: b
        });
      } catch (err) {
        console.warn('Supabase remote message insert skipped:', err);
      }
    }
  };

  const del = async (m: PrivateMessage) => {
    if (!confirm('¿Borrar este mensaje?')) return;
    setMessages(prev => {
      const updated = prev.filter(x => x.id !== m.id);
      saveStoredMessages(updated);
      return updated;
    });
    setSelectedMessage(null);

    if (supabase) {
      try {
        await (supabase.from('private_messages') as any).delete().eq('id', m.id);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Navigation Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 space-y-3">
          <div className="bg-white rounded border border-[#ccd5df] overflow-hidden text-xs shadow-xs">
            <div className="bg-[#f0f4f8] px-3 py-2 border-b border-[#ccd5df] font-bold text-gray-700 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#3869A0]" />
              Mensajería Privada
            </div>
            <div className="divide-y divide-gray-100 font-medium">
              <button
                type="button"
                onClick={() => { setMode('enviar'); setSelectedMessage(null); }}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2 cursor-pointer transition ${
                  mode === 'enviar' ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Enviar mensaje</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('recibidos'); setSelectedMessage(null); }}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between cursor-pointer transition ${
                  mode === 'recibidos' && !selectedMessage ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Mensajes Recibidos</span>
                </span>
                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 rounded-full font-bold">
                  {received.filter(m => !m.leido).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('enviados'); setSelectedMessage(null); }}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between cursor-pointer transition ${
                  mode === 'enviados' && !selectedMessage ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>Mensajes Enviados</span>
                </span>
                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 rounded-full font-bold">
                  {sent.length}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded p-3 text-[11px] text-gray-600">
            <p className="font-bold text-[#3869A0]">💡 Mensajes privados seguros</p>
            <p className="mt-0.5">Los mensajes privados de Inkorium solo los podéis leer tú y tu destinatario.</p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="bg-white rounded border border-[#ccd5df] p-4 shadow-xs min-h-[400px]">
            {error && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-16 text-gray-400 text-xs">Cargando mensajes...</div>
            ) : selectedMessage ? (
              /* Message Detail View */
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="flex items-center gap-1.5 text-[#3869A0] font-bold hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a la lista</span>
                  </button>
                  <div className="flex gap-2">
                    {isCurrentRecipient(selectedMessage) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetUserId(selectedMessage.emisorId);
                          setSubject(selectedMessage.asunto.startsWith('Re: ') ? selectedMessage.asunto : `Re: ${selectedMessage.asunto}`);
                          setBody('');
                          setSelectedMessage(null);
                          setMode('enviar');
                        }}
                        className="px-3 py-1 bg-[#3869A0] text-white rounded font-bold flex items-center gap-1 cursor-pointer hover:bg-[#2e5684]"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Responder</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void del(selectedMessage)}
                      className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                      title="Eliminar mensaje"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <img
                    src={selectedMessage.emisorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt=""
                    className="w-10 h-10 rounded object-cover border border-gray-300 cursor-pointer"
                    onClick={() => viewUserProfile(selectedMessage.emisorId)}
                  />
                  <div className="flex-1">
                    <h2 className="text-sm font-bold text-gray-900">{selectedMessage.asunto}</h2>
                    <p className="text-gray-600 mt-0.5">
                      De:{' '}
                      <span
                        onClick={() => viewUserProfile(selectedMessage.emisorId)}
                        className="text-[#3869A0] font-bold hover:underline cursor-pointer"
                      >
                        {selectedMessage.emisorNombre}
                      </span>{' '}
                      para <span className="font-semibold">{selectedMessage.receptorNombre}</span>
                    </p>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{selectedMessage.fecha}</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded border border-gray-200 text-gray-800 whitespace-pre-line leading-relaxed text-xs min-h-[160px]">
                  {selectedMessage.mensaje}
                </div>
              </div>
            ) : mode === 'enviar' ? (
              /* Compose Message Form */
              <div className="space-y-4 text-xs">
                <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                  <SendHorizontal className="w-4 h-4 text-[#3869A0]" />
                  <span>Redactar nuevo mensaje privado</span>
                </h2>
                <form onSubmit={send} className="space-y-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Para (Destinatario):</label>
                    <select
                      value={targetUserId}
                      onChange={e => setTargetUserId(e.target.value)}
                      className="w-full p-2 text-xs rounded border border-gray-300 bg-white focus:outline-none focus:border-[#3869A0]"
                      required
                    >
                      <option value="">Selecciona a un usuario de Inkorium...</option>
                      {others.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} {u.apellidos} ({u.provincia})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Asunto:</label>
                    <input
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Escribe el asunto del mensaje..."
                      className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Mensaje:</label>
                    <textarea
                      rows={6}
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      placeholder="Escribe el contenido de tu mensaje..."
                      className="w-full p-2 text-xs rounded border border-gray-300 resize-none focus:outline-none focus:border-[#3869A0]"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setMode('recibidos')}
                      className="px-3.5 py-1.5 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!targetUserId || !body.trim() || sending}
                      className="px-5 py-1.5 rounded bg-[#3869A0] text-white font-bold disabled:opacity-50 hover:bg-[#2e5684] cursor-pointer shadow-xs"
                    >
                      {sending ? 'Enviando...' : 'Enviar mensaje'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Message Inbox / Sent list */
              <div className="space-y-3 text-xs">
                <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200">
                  {mode === 'enviados' ? `Mensajes Enviados (${sent.length})` : `Mensajes Recibidos (${received.length})`}
                </h2>
                {(mode === 'enviados' ? sent : received).length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-xs">
                    {mode === 'enviados' ? 'No has enviado ningún mensaje todavía.' : 'Tu bandeja de entrada está vacía.'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {(mode === 'enviados' ? sent : received).map(m => (
                      <div
                        key={m.id}
                        onClick={() => void open(m)}
                        className={`py-2.5 px-2 rounded cursor-pointer flex items-center justify-between gap-3 transition ${
                          !m.leido && mode === 'recibidos' ? 'bg-blue-50/80 font-semibold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <img
                            src={mode === 'enviados' ? currentUser.avatar : m.emisorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt=""
                            className="w-8 h-8 rounded object-cover border border-gray-300 shrink-0"
                          />
                          <div className="overflow-hidden min-w-0">
                            {mode === 'recibidos' ? (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#3869A0] text-xs truncate">{m.emisorNombre}</span>
                                {!m.leido && (
                                  <span className="bg-[#3869A0] text-white text-[9px] font-bold px-1.5 rounded-full shrink-0">
                                    Nuevo
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="font-bold text-gray-900 text-xs truncate">Para: {m.receptorNombre}</p>
                            )}
                            <p className="text-gray-900 text-xs font-medium truncate">{m.asunto}</p>
                            <p className="text-[11px] text-gray-500 truncate">{m.mensaje}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">{m.fecha}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
