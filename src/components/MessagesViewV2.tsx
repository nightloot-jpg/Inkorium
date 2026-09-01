import React, { useState, useEffect } from 'react';
import { ArrowLeft, Inbox, Mail, Reply, Send, SendHorizontal, Trash2, ChevronDown, User as UserIcon } from 'lucide-react';
import { useInkorium } from '../context/InkoriumContext';
import { PrivateMessage } from '../types';
import { normalizeUserId } from '../lib/chatHistory';

export const MessagesViewV2: React.FC = () => {
  const {
    currentUser,
    currentUserId,
    users,
    messages,
    sendPrivateMessage,
    markMessageAsRead,
    deleteMessage,
    viewUserProfile,
    composeRecipientId
  } = useInkorium();

  const [mode, setMode] = useState<'recibidos' | 'enviados' | 'enviar'>('recibidos');
  const [selectedMessage, setSelectedMessage] = useState<PrivateMessage | null>(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    if (composeRecipientId) {
      setTargetUserId(composeRecipientId);
      setMode('enviar');
      setSelectedMessage(null);
    }
  }, [composeRecipientId]);

  const isCurrentRecipient = (m: PrivateMessage) => {
    const normRec = normalizeUserId(m.receptorId);
    const normCur = normalizeUserId(currentUser.id);
    const normCurId = normalizeUserId(currentUserId);
    return (
      normRec === normCur ||
      normRec === normCurId ||
      m.receptorId === currentUser.id ||
      m.receptorId === currentUser.username ||
      m.receptorId === currentUserId ||
      (currentUser.email && m.receptorId.toLowerCase() === currentUser.email.toLowerCase())
    );
  };

  const isCurrentSender = (m: PrivateMessage) => {
    const normEmi = normalizeUserId(m.emisorId);
    const normCur = normalizeUserId(currentUser.id);
    const normCurId = normalizeUserId(currentUserId);
    return (
      normEmi === normCur ||
      normEmi === normCurId ||
      m.emisorId === currentUser.id ||
      m.emisorId === currentUser.username ||
      m.emisorId === currentUserId ||
      (currentUser.email && m.emisorId.toLowerCase() === currentUser.email.toLowerCase())
    );
  };

  const received = messages.filter(isCurrentRecipient);
  const sent = messages.filter(isCurrentSender);
  const others = users
    .filter(u => 
      u.id !== currentUser.id && 
      u.username !== currentUser.username &&
      u.id !== currentUserId &&
      !(currentUser.id === 'user-nightloot' && u.id === 'nightloot') &&
      !(currentUser.id === 'nightloot' && u.id === 'user-nightloot')
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const selectedTargetUser = users.find(u => u.id === targetUserId || u.username === targetUserId);

  const open = (m: PrivateMessage) => {
    setSelectedMessage(m);
    if (!m.leido && isCurrentRecipient(m)) {
      markMessageAsRead(m.id);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBody = body.trim();
    if (!targetUserId || !cleanBody || sending) return;

    setSending(true);
    sendPrivateMessage(targetUserId, subject.trim() || 'Sin asunto', cleanBody);

    setTargetUserId('');
    setSubject('');
    setBody('');
    setMode('enviados');
    setSelectedMessage(null);
    setSending(false);
  };

  const handleDelete = (m: PrivateMessage) => {
    if (!confirm('¿Deseas eliminar este mensaje?')) return;
    deleteMessage(m.id);
    if (selectedMessage?.id === m.id) {
      setSelectedMessage(null);
    }
  };

  const currentList = mode === 'enviados' ? sent : received;
  const displayedList = currentList.slice(0, visibleCount);

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
                onClick={() => { setMode('recibidos'); setSelectedMessage(null); setVisibleCount(15); }}
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
                onClick={() => { setMode('enviados'); setSelectedMessage(null); setVisibleCount(15); }}
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
            {selectedMessage ? (
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
                      onClick={() => handleDelete(selectedMessage)}
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
                <form onSubmit={handleSend} className="space-y-3">
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
                          {u.nombre} {u.apellidos} (@{u.username || u.id}) - {u.provincia}
                        </option>
                      ))}
                    </select>

                    {selectedTargetUser && (
                      <div className="mt-2 p-2 bg-blue-50/70 border border-blue-200 rounded flex items-center gap-2.5">
                        <img 
                          src={selectedTargetUser.avatar} 
                          alt="" 
                          className="w-7 h-7 rounded object-cover border border-blue-300"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-800 text-xs truncate">
                            {selectedTargetUser.nombre} {selectedTargetUser.apellidos}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {selectedTargetUser.provincia} • {selectedTargetUser.ocupacion || 'Usuario de Inkorium'}
                          </p>
                        </div>
                      </div>
                    )}
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
                {currentList.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-xs">
                    {mode === 'enviados' ? 'No has enviado ningún mensaje todavía.' : 'Tu bandeja de entrada está vacía.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="divide-y divide-gray-100">
                      {displayedList.map(m => (
                        <div
                          key={m.id}
                          onClick={() => open(m)}
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

                    {currentList.length > displayedList.length && (
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => setVisibleCount(prev => prev + 15)}
                          className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#3869A0] font-bold rounded text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Cargar mensajes anteriores ({currentList.length - displayedList.length} restantes)</span>
                        </button>
                      </div>
                    )}
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
