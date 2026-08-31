import React, { useEffect, useRef } from 'react';

const EMOTICONS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '🙂', '🙃', '😉',
  '😎', '😍', '🥰', '😘', '😋', '😜', '🤪', '🤗', '🤩', '😇', '🤔', '😴',
  '😢', '😭', '😡', '😱', '🤭', '🤫', '🙄', '😏', '👍', '👎', '👏', '🙌',
  '🙏', '💪', '❤️', '💙', '🔥', '✨', '⭐', '🎉', '🎵', '🎮', '☀️', '🌙',
  'XD', 'xD', ':)', ':D', ';)', ';D', ':P', ':/', '<3', ':-)', ';-)',
  '^^', '^_^', '-_-', 'T_T', 'O:)', 'B)',
];

interface EmoticonPickerProps {
  onSelect: (value: string) => void;
  onClose: () => void;
}

/**
 * Small popover grid of emoticons/emojis. Positioned by the parent
 * (wrap in a `relative` container and render this absolutely).
 */
export default function EmoticonPicker({ onSelect, onClose }: EmoticonPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Seleccionar emoticono"
      className="absolute z-50 top-full left-0 mt-1 w-72 max-h-64 overflow-y-auto p-2 bg-white border border-gray-300 rounded shadow-lg grid grid-cols-6 gap-1.5"
    >
      {EMOTICONS.map((value) => (
        <button
          key={value}
          type="button"
          title={`Insertar ${value}`}
          aria-label={`Insertar ${value}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(value)}
          className="min-h-[34px] flex items-center justify-center text-lg leading-none rounded border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-[#3869A0] transition cursor-pointer"
        >
          {value}
        </button>
      ))}
    </div>
  );
}
