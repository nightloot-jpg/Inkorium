import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Mail, Send, Inbox, SendHorizontal, Trash2, 
  ArrowLeft, Reply, Clock, User as UserIcon 
} from 'lucide-react';
import { PrivateMessage } from '../types';

export const MessagesView: React.FC = () => {
  const {
    currentUser,
    users,
    messages,
    sendPrivateMessage,
    markMessageAsRead,
    deleteMessage,
    viewUserProfile
  } = useInkorium();

  const [mode, setMode] = useState<'recibidos' | 'enviados' | 'enviar'>('recibidos');
  const [selectedMessage, setSelectedMessage] = useState<PrivateMessage | null>(null);

  // Form states for sending MP
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');

  const receivedMessages = messages.filter(m => m.receptorId === currentUser.id);
  const sentMessages = messages.filter(m => m.emisorId === currentUser.id);

  const handleOpenMessage = (msg: PrivateMessage) => {
    setSelectedMessage(msg);
    if (!msg.leido && msg.receptorId === currentUser.id) {
      markMessageAsRead(msg.id);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !body.trim()) return;
    sendPrivateMessage(targetUserId, subject || 'Sin asunto', body);
    setTargetUserId('');
    setSubject('');
    setBody('');
    setMode('enviados');
    setSelectedMessage(null);
  };

  const handleStartReply = (msg: PrivateMessage) => {
    setTargetUserId(msg.emisorId);
    setSubject(msg.asunto.startsWith('Re: ') ? msg.asunto : `Re: ${msg.asunto}`);
    setBody('');
    setMode('enviar');
    setSelectedMessage(null);
  };

  const otherUsers = users.filter(u => u.id !== currentUser.id);

  return (
    <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* ================= SIDEBAR (barra_izq) ================= */}
        <div className="md:col-span-4 lg:col-span-3 space-y-3">
          <div className="bg-white rounded border border-[#ccd5df] overflow-hidden text-xs shadow-xs">
            <div className="bg-[#f0f4f8] px-3 py-2 border-b border-[#ccd5df] font-bold text-gray-700 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#3869A0]" />
              <span>Mensajería Privada</span>
            </div>

            <div className="divide-y divide-gray-100 font-medium">
              <button
                onClick={() => { setMode('enviar'); setSelectedMessage(null); }}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition cursor-pointer ${
                  mode === 'enviar' ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SendHorizontal className="w-3.5 h-3.5" />
                  <span>Enviar mensaje</span>
                </div>
              </button>

              <button
                onClick={() => { setMode('recibidos'); setSelectedMessage(null); }}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition cursor-pointer ${
                  mode === 'recibidos' && !selectedMessage ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Mensajes Recibidos</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  mode === 'recibidos' && !selectedMessage ? 'bg-white text-[#3869A0]' : 'bg-gray-100 text-gray-600'
                }`}>
                  {receivedMessages.length}
                </span>
              </button>

              <button
                onClick={() => { setMode('enviados'); setSelectedMessage(null); }}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition cursor-pointer ${
                  mode === 'enviados' && !selectedMessage ? 'bg-[#3869A0] text-white font-bold' : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>Mensajes Enviados</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  mode === 'enviados' && !selectedMessage ? 'bg-white text-[#3869A0]' : 'bg-gray-100 text-gray-600'
                }`}>
                  {sentMessages.length}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded p-3 text-[11px] text-gray-600 space-y-1">
            <p className="font-bold text-[#3869A0]">💡 Mensajes privados seguros</p>
            <p>Los mensajes privados de Inkorium solo los podéis leer tú y tu destinatario.</p>
          </div>
        </div>

        {/* ================= MAIN MESSAGE CONTENT ================= */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          <div className="bg-white rounded border border-[#ccd5df] p-4 shadow-xs min-h-[400px]">
            {/* 1. VIEWING MESSAGE DETAIL */}
            {selectedMessage ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="flex items-center gap-1.5 text-[#3869A0] font-bold hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a la lista</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedMessage.receptorId === currentUser.id && (
                      <button
                        onClick={() => handleStartReply(selectedMessage)}
                        className="px-3 py-1 bg-[#3869A0] text-white rounded font-bold flex items-center gap-1 hover:bg-[#2c537f] transition cursor-pointer shadow-xs"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Responder</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm('¿Borrar este mensaje?')) {
                          deleteMessage(selectedMessage.id);
                          setSelectedMessage(null);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
                      title="Borrar mensaje"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Header */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                  <img
                    src={selectedMessage.emisorAvatar}
                    alt=""
                    className="w-10 h-10 rounded object-cover border border-gray-300 cursor-pointer hover:opacity-90"
                    onClick={() => viewUserProfile(selectedMessage.emisorId)}
                  />
                  <div className="flex-1 overflow-hidden">
                    <h2 className="text-sm font-bold text-gray-900">{selectedMessage.asunto}</h2>
                    <p className="text-gray-600 mt-0.5">
                      De:{' '}
                      <span 
                        onClick={() => viewUserProfile(selectedMessage.emisorId)}
                        className="text-[#3869A0] font-bold hover:underline cursor-pointer"
                      >
                        {selectedMessage.emisorNombre}
                      </span>{' '}
                      para{' '}
                      <span className="font-semibold">{selectedMessage.receptorNombre}</span>
                    </p>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{selectedMessage.fecha}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-4 bg-white rounded border border-gray-200 text-gray-800 whitespace-pre-line leading-relaxed text-xs min-h-[160px]">
                  {selectedMessage.mensaje}
                </div>
              </div>
            ) : mode === 'enviar' ? (
              /* 2. COMPOSE MESSAGE FORM */
              <div className="space-y-4 text-xs">
                <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200 flex items-center gap-1.5">
                  <SendHorizontal className="w-4 h-4 text-[#3869A0]" />
                  <span>Redactar nuevo mensaje privado</span>
                </h2>

                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Para (Destinatario):</label>
                    <select
                      value={targetUserId}
                      onChange={e => setTargetUserId(e.target.value)}
                      className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white"
                      required
                    >
                      <option value="">Selecciona a un usuario de Inkorium...</option>
                      {otherUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre} {u.apellidos} ({u.provincia})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Asunto:</label>
                    <input
                      type="text"
                      placeholder="Escribe el asunto del mensaje..."
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Mensaje:</label>
                    <textarea
                      rows={6}
                      placeholder="Escribe el contenido de tu mensaje..."
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setMode('recibidos')}
                      className="px-3.5 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!targetUserId || !body.trim()}
                      className="px-5 py-1.5 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      Enviar mensaje
                    </button>
                  </div>
                </form>
              </div>
            ) : mode === 'enviados' ? (
              /* 3. SENT MESSAGES LIST */
              <div className="space-y-3 text-xs">
                <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200">
                  Mensajes Enviados ({sentMessages.length})
                </h2>

                {sentMessages.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-xs">
                    No has enviado ningún mensaje todavía.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sentMessages.map(msg => (
                      <div
                        key={msg.id}
                        onClick={() => handleOpenMessage(msg)}
                        className="py-2.5 px-2 hover:bg-blue-50/70 rounded cursor-pointer transition flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded object-cover border border-gray-300" />
                          <div className="overflow-hidden">
                            <p className="font-bold text-gray-900 text-xs truncate">Para: {msg.receptorNombre}</p>
                            <p className="text-gray-700 text-xs font-medium truncate">{msg.asunto}</p>
                            <p className="text-[11px] text-gray-400 truncate">{msg.mensaje}</p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{msg.fecha}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(msg.id);
                            }}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                            title="Borrar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* 4. RECEIVED MESSAGES LIST (INBOX) */
              <div className="space-y-3 text-xs">
                <h2 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200">
                  Mensajes Recibidos ({receivedMessages.length})
                </h2>

                {receivedMessages.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-xs">
                    Tu bandeja de entrada está vacía.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {receivedMessages.map(msg => (
                      <div
                        key={msg.id}
                        onClick={() => handleOpenMessage(msg)}
                        className={`py-2.5 px-2 rounded cursor-pointer transition flex items-center justify-between gap-3 group ${
                          !msg.leido ? 'bg-blue-50/80 hover:bg-blue-100/80 font-semibold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <img src={msg.emisorAvatar} alt="" className="w-8 h-8 rounded object-cover border border-gray-300" />
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#3869A0] text-xs truncate">{msg.emisorNombre}</span>
                              {!msg.leido && (
                                <span className="bg-[#3869A0] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 text-xs font-semibold truncate">{msg.asunto}</p>
                            <p className="text-[11px] text-gray-500 truncate">{msg.mensaje}</p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{msg.fecha}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(msg.id);
                            }}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                            title="Borrar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
