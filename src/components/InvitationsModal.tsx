import React, { useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { Mail, Ticket, Copy, Check, Sparkles, X, Send, UserCheck, ShieldCheck } from 'lucide-react';
import { UserInvitation } from '../types';

interface InvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InvitationsModal: React.FC<InvitationsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserData, pushNotification } = useInkorium();

  const [emailInput, setEmailInput] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSuccessToast, setIsSuccessToast] = useState(false);

  const availableCount = currentUser.invitacionesDisponibles ?? 10;
  const userInvitations: UserInvitation[] = currentUser.invitacionesEnviadas || [
    {
      id: 'inv-demo-1',
      code: 'TUENTI-9842',
      email: 'marcos.sanz@gmail.com',
      creada: 'Hace 3 días',
      estado: 'usada',
      usadaPorNombre: 'Marcos Sanz'
    },
    {
      id: 'inv-demo-2',
      code: 'TUENTI-1108',
      email: 'patri.morales@hotmail.com',
      creada: 'Ayer',
      estado: 'pendiente'
    }
  ];

  if (!isOpen) return null;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || availableCount <= 0) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `TUENTI-${randomSuffix}`;

    const newInvite: UserInvitation = {
      id: `inv-${Date.now()}`,
      code,
      email: emailInput.trim(),
      creada: 'Ahora mismo',
      estado: 'pendiente'
    };

    const updatedSent = [newInvite, ...userInvitations];
    const updatedCount = availableCount - 1;

    updateUserData({
      invitacionesDisponibles: updatedCount,
      invitacionesEnviadas: updatedSent
    });

    setEmailInput('');
    setIsSuccessToast(true);
    setTimeout(() => setIsSuccessToast(false), 4000);

    pushNotification({
      id: `notif-inv-${Date.now()}`,
      tipo: 'sistema',
      userId: currentUser.id,
      fromUserId: currentUser.id,
      fromUserName: 'Sistema de Invitaciones',
      mensaje: `Has enviado una invitación exclusiva de Inkorium a ${emailInput.trim()}. Código: ${code}`,
      fecha: 'Ahora mismo',
      leido: false
    });
  };

  const copyToClipboard = (code: string) => {
    const inviteLink = `${window.location.origin}/?invitacion=${code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white dark:bg-[#142032] border border-[#ccd5df] dark:border-[#1d2b40] rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Tuenti Blue */}
        <div className="bg-[#3869A0] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-yellow-300" />
            <h3 className="text-sm sm:text-base font-bold">Sistema de Invitaciones Exclusivas</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Nostalgic Explanation Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 rounded p-3 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                ¡El aura mítica de Tuenti: Solo con invitación!
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/80 leading-relaxed mt-0.5">
                En 2008 nadie podía registrarse libremente: necesitabas que un amigo de tu cole o facultad te mandara una de sus 10 codiciadas invitaciones. ¡Elige bien a quién invitas a Inkorium!
              </p>
            </div>
          </div>

          {/* Invitation Counter */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0e1726] border border-gray-200 dark:border-[#1d2b40] rounded">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Invitaciones disponibles en tu cuenta:</span>
              <div className="text-xl font-black text-[#3869A0] dark:text-blue-400">
                {availableCount} <span className="text-xs font-normal text-gray-500">restantes</span>
              </div>
            </div>
            <div className="bg-yellow-400 text-gray-900 font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Miembro Verificado</span>
            </div>
          </div>

          {/* Send Invite Form */}
          <form onSubmit={handleSendInvite} className="space-y-2">
            <label className="font-bold text-gray-700 dark:text-gray-300 block">
              Invitar a un amigo por Correo Electrónico:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="amigo@correo.es"
                  disabled={availableCount <= 0}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-[#1d2b40] rounded bg-gray-50 dark:bg-[#0e1726] text-gray-900 dark:text-gray-100 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={availableCount <= 0 || !emailInput.trim()}
                className="px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c5282] text-white font-bold rounded cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </div>
            {isSuccessToast && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-[11px] rounded flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>¡Invitación generada y enviada correctamente!</span>
              </div>
            )}
          </form>

          {/* Sent Invitations List */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Historial de invitaciones enviadas ({userInvitations.length})
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {userInvitations.map(inv => (
                <div
                  key={inv.id}
                  className="p-2.5 bg-gray-50 dark:bg-[#0e1726] border border-gray-200 dark:border-[#1d2b40] rounded flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 dark:text-gray-200">{inv.email}</span>
                      <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900/40 text-[#3869A0] dark:text-blue-300 px-1.5 py-0.5 rounded">
                        {inv.code}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Enviada: {inv.creada} • {inv.estado === 'usada' ? `Aceptada por ${inv.usadaPorNombre || 'amigo'}` : 'Pendiente de registro'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.estado === 'usada' ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <UserCheck className="w-3 h-3" />
                        <span>Ya es miembro</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => copyToClipboard(inv.code)}
                        className="px-2 py-1 bg-white dark:bg-[#142032] border border-gray-300 dark:border-[#1d2b40] hover:border-[#3869A0] text-[11px] rounded font-medium flex items-center gap-1 cursor-pointer"
                        title="Copiar enlace directo de invitación"
                      >
                        {copiedCode === inv.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar link</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-100 dark:bg-[#101b2b] border-t border-gray-200 dark:border-[#1d2b40] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3869A0] text-white font-bold rounded text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
