import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Sparkles, Smile, ThumbsUp, Heart, X } from 'lucide-react';

export interface EmoticonPickerProps {
  onSelect: (value: string) => void;
  onClose: () => void;
}

interface EmoticonCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const CATEGORIES: EmoticonCategory[] = [
  {
    id: 'retro',
    name: 'Retro MSN/Tuenti',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    emojis: [
      'XD', 'xD', '<3', ':)', ':D', ';)', ';D', ':P', ':-P', ':/', ':-/',
      '^^', '^_^', '-_-', 'T_T', 'O_o', 'o.O', '*.*', '*¬*', '¬_¬', '>.<',
      'ò_ó', '@_@', 'u_u', '(H)', '(A)', '(L)', '(6)', '(K)', '(S)', '(I)',
      '(8)', '(Y)', '(N)', '(U)', '(G)', '(C)', '(B)', '(D)', '(X)', '(Z)',
      '(P)', '\\m/', '(})', '({)', '(F)', '(W)', '(O)', '(T)', ':-O', ':S'
    ]
  },
  {
    id: 'caritas',
    name: 'Caritas',
    icon: <Smile className="w-3.5 h-3.5" />,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
      '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
      '😦', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴'
    ]
  },
  {
    id: 'gestos',
    name: 'Gestos',
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
      '🤝', '🙏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '👇', '☝️', '✍️', '💅', '🤳', '💪', '👀', '👁️', '👅',
      '👄', '💋', '👣', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌'
    ]
  },
  {
    id: 'iconos',
    name: 'Nostalgia & Amor',
    icon: <Heart className="w-3.5 h-3.5" />,
    emojis: [
      '❤️', '💖', '💕', '💞', '💓', '💗', '💘', '💝', '💔', '❤️‍🔥',
      '✨', '⭐', '🌟', '💫', '💥', '🔥', '🎉', '🎊', '🎈', '🎵',
      '🎶', '🎧', '🎸', '🎹', '💿', '📼', '📷', '📸', '📹', '🕹️',
      '🎮', '👾', '🛹', '🍕', '🍔', '🍻', '🍹', '🍩', '🍬', '⚡'
    ]
  }
];

export default function EmoticonPicker({ onSelect, onClose }: EmoticonPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>('retro');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredEmoticon, setHoveredEmoticon] = useState<string | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const displayedEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      const cat = CATEGORIES.find(c => c.id === activeCategory);
      return cat ? cat.emojis : CATEGORIES[0].emojis;
    }
    const q = searchQuery.toLowerCase().trim();
    const all = CATEGORIES.flatMap(c => c.emojis);
    return Array.from(new Set(all.filter(e => e.toLowerCase().includes(q))));
  }, [activeCategory, searchQuery]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Selector de emoticonos"
      className="absolute z-50 bottom-full left-0 mb-1 w-80 max-w-[90vw] bg-white dark:bg-[#0e1726] border border-gray-300 dark:border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden text-xs select-none animate-fade-in"
    >
      {/* Header bar with title and close */}
      <div className="bg-[#3869A0] text-white px-2.5 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <Smile className="w-3.5 h-3.5" />
          <span>Emoticonos de Inkorium</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white p-0.5 rounded hover:bg-black/10 transition cursor-pointer"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60 p-1 gap-1 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id && !searchQuery.trim();
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-[#3869A0] dark:text-blue-400 border border-gray-200 dark:border-slate-700 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="p-1.5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0e1726]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
          <input
            type="text"
            placeholder="Buscar emoticono (ej: XD, <3, corazón, risa)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#3869A0] dark:focus:border-blue-400"
          />
        </div>
      </div>

      {/* Grid of Emoticons */}
      <div className="p-2 max-h-52 overflow-y-auto grid grid-cols-6 gap-1 bg-[#f8fafc] dark:bg-[#090d16]">
        {displayedEmojis.length > 0 ? (
          displayedEmojis.map(value => {
            const isTextRetro = value.length > 1 && !/\p{Emoji}/u.test(value);
            return (
              <button
                key={value}
                type="button"
                title={`Insertar ${value}`}
                onMouseEnter={() => setHoveredEmoticon(value)}
                onMouseLeave={() => setHoveredEmoticon(null)}
                onMouseDown={e => e.preventDefault()}
                onClick={() => onSelect(value)}
                className={`min-h-[34px] flex items-center justify-center rounded border transition cursor-pointer ${
                  isTextRetro
                    ? 'font-bold text-xs tracking-tight bg-blue-50 dark:bg-blue-950/30 text-[#3869A0] dark:text-blue-300 border-blue-200 dark:border-blue-900/50 hover:bg-[#3869A0] hover:text-white hover:border-[#3869A0]'
                    : 'text-lg leading-none bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-300'
                }`}
              >
                {value}
              </button>
            );
          })
        ) : (
          <div className="col-span-6 py-6 text-center text-gray-400 dark:text-gray-500 text-[11px]">
            No se encontraron emoticonos para &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* Footer with preview or hint */}
      <div className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
        <span className="truncate">
          {hoveredEmoticon ? (
            <span className="font-semibold text-[#3869A0] dark:text-blue-400">
              Insertar: {hoveredEmoticon}
            </span>
          ) : (
            'Haz clic para insertar en el mensaje'
          )}
        </span>
        <span className="font-mono text-[9px] text-gray-400">ESC cerrar</span>
      </div>
    </div>
  );
}
