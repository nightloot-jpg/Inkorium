import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export function NotificationsPortal({
  isOpen,
  onClose,
  triggerRef,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0, right: 'auto' as number | 'auto' });
  const portalRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = rect.bottom;

      // Right alignment based on the button position
      // Let's place it aligned to the right edge of the button, since the popover has a top right alignment normally
      const right = window.innerWidth - rect.right;

      // Calculate taking into account margins/safespaces
      setPosition({
        top: top + 4, // match small gap
        left: 0, // not used
        right: Math.max(right - 10, 10), // Add a little offset so it looks centered to the icon or right-aligned correctly, keep it on screen
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        portalRef.current &&
        !portalRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    let rafId: number;
    function handleScroll() {
       if (rafId) cancelAnimationFrame(rafId);
       rafId = requestAnimationFrame(updatePosition);
    }

    function handleResize() {
       if (rafId) cancelAnimationFrame(rafId);
       rafId = requestAnimationFrame(updatePosition);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={portalRef}
      style={{
        position: 'fixed',
        top: position.top,
        right: position.right,
        zIndex: 9999, // Ensure it's over everything.
      }}
    >
      {children}
    </div>,
    document.body
  );
}
