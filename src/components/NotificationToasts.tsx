import React, { useEffect, useState } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { InkoriumNotification } from '../types';
import { 
  Mail, MessageSquare, UserPlus, Image as ImageIcon, 
  Tag, Heart, X, Check, ArrowRight, BellRing, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastItemProps {
  toast: InkoriumNotification;
  onDismiss: (id: string) => void;
  onAction: (toast: InkoriumNotification) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, onAction }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 6500; // 6.5s auto dismiss
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast.id, onDismiss]);

  const getTheme = () => {
    switch (toast.tipo) {
      case 'mp':
        return {
          icon: <Mail className="w-3.5 h-3.5 text-[#3869A0]" />,
          badgeBg: 'bg-blue-100 border-blue-300 text-blue-800',
          title: 'Mensaje Privado',
          actionText: 'Leer mensaje',
          barColor: 'bg-[#3869A0]',
          borderAccent: 'border-l-[#3869A0]'
        };
      case 'tablon':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />,
          badgeBg: 'bg-emerald-100 border-emerald-300 text-emerald-800',
          title: 'Firma en Tablón',
          actionText: 'Ver tablón',
          barColor: 'bg-emerald-600',
          borderAccent: 'border-l-emerald-600'
        };
      case 'peticion':
        return {
          icon: <UserPlus className="w-3.5 h-3.5 text-amber-700" />,
          badgeBg: 'bg-amber-100 border-amber-300 text-amber-800',
          title: 'Petición de Amistad',
          actionText: 'Ver petición',
          barColor: 'bg-amber-600',
          borderAccent: 'border-l-amber-600'
        };
      case 'foto':
        return {
          icon: <ImageIcon className="w-3.5 h-3.5 text-purple-700" />,
          badgeBg: 'bg-purple-100 border-purple-300 text-purple-800',
          title: 'Comentario en Foto',
          actionText: 'Ver foto',
          barColor: 'bg-purple-600',
          borderAccent: 'border-l-purple-600'
        };
      case 'etiqueta':
        return {
          icon: <Tag className="w-3.5 h-3.5 text-sky-700" />,
          badgeBg: 'bg-sky-100 border-sky-300 text-sky-800',
          title: 'Nueva Etiqueta',
          actionText: 'Ver foto',
          barColor: 'bg-sky-600',
          borderAccent: 'border-l-sky-600'
        };
      case 'like':
        return {
          icon: <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />,
          badgeBg: 'bg-rose-100 border-rose-300 text-rose-800',
          title: 'Me Gusta',
          actionText: 'Ver',
          barColor: 'bg-rose-500',
          borderAccent: 'border-l-rose-500'
        };
      default:
        return {
          icon: <BellRing className="w-3.5 h-3.5 text-[#3869A0]" />,
          badgeBg: 'bg-gray-100 border-gray-300 text-gray-800',
          title: 'Notificación',
          actionText: 'Ver',
          barColor: 'bg-[#3869A0]',
          borderAccent: 'border-l-[#3869A0]'
        };
    }
  };

  const theme = getTheme();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.94, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className={`w-[320px] sm:w-[350px] bg-white rounded-lg shadow-2xl border border-gray-300 border-l-4 ${theme.borderAccent} overflow-hidden text-xs relative pointer-events-auto select-none`}
    >
      {/* Top Header */}
      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-slate-100 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-gray-700">
          <span className="p-0.5 rounded bg-white shadow-2xs border border-gray-200">
            {theme.icon}
          </span>
          <span className="text-[11px] font-bold tracking-tight">{theme.title}</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold uppercase animate-pulse">
            En vivo
          </span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast.id);
          }}
          className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition cursor-pointer hover:bg-gray-200"
          title="Cerrar notificación"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Body */}
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          {/* Sender Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={toast.fromUserAvatar}
              alt={toast.fromUserName}
              className="w-10 h-10 rounded-md object-cover border border-gray-300 shadow-2xs"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" title="Conectado"></div>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 leading-tight truncate">
              {toast.fromUserName}
            </p>
            <p className="text-gray-600 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
              {toast.mensaje}
            </p>

            {/* Optional message snippet / quote */}
            {toast.detalle && (
              <div className="mt-1.5 p-1.5 bg-gray-50 rounded border border-gray-200 text-[10px] text-gray-600 italic line-clamp-2">
                "{toast.detalle}"
              </div>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-medium">
            {toast.fecha || 'Ahora mismo'}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAction(toast)}
              className="px-2.5 py-1 bg-[#3869A0] hover:bg-[#2c5584] text-white rounded font-bold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <span>{theme.actionText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Expiration Progress Bar */}
      <div className="h-1 bg-gray-100 w-full overflow-hidden">
        <div 
          className={`h-full ${theme.barColor} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const NotificationToasts: React.FC = () => {
  const { 
    toasts, 
    dismissToast, 
    markNotificationAsRead, 
    setActiveTab, 
    viewUserProfile,
    currentUser,
    viewPhoto,
    acceptFriendRequest,
    friendRequests
  } = useInkorium();

  const handleAction = (toast: InkoriumNotification) => {
    markNotificationAsRead(toast.id);
    dismissToast(toast.id);

    if (toast.enlace === 'mensajes' || toast.tipo === 'mp') {
      setActiveTab('mensajes');
    } else if (toast.enlace === 'perfil' || toast.tipo === 'tablon') {
      viewUserProfile(currentUser.id);
    } else if (toast.enlace === 'ajustes' || toast.tipo === 'peticion') {
      setActiveTab('ajustes');
    } else if (toast.enlace === 'fotos' || toast.tipo === 'foto' || toast.tipo === 'etiqueta') {
      if (toast.targetId) {
        viewPhoto(toast.targetId);
      } else {
        setActiveTab('fotos');
      }
    } else {
      setActiveTab('inicio');
    }
  };

  return (
    <div className="fixed bottom-14 right-3 sm:right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-[95vw]">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            onAction={handleAction}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
