import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

const NOTIFICATIONS_Z_INDEX = 2147483647;

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
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const right = window.innerWidth - rect.right;

    setPosition({
      top: rect.bottom + 4,
      left: 0,
      right: Math.max(right - 10, 10),
    });
  };

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
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

    let rafId = 0;
    const schedulePositionUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', schedulePositionUpdate, true);
    window.addEventListener('resize', schedulePositionUpdate);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', schedulePositionUpdate, true);
      window.removeEventListener('resize', schedulePositionUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={portalRef}
      className="notifications-portal-layer"
      style={{
        position: 'fixed',
        top: position.top,
        right: position.right,
        left: 'auto',
        zIndex: NOTIFICATIONS_Z_INDEX,
        isolation: 'isolate',
        pointerEvents: 'auto',
      }}
    >
      {children}
    </div>,
    document.body
  );
}
