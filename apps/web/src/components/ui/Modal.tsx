import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { IconButton } from './IconButton';

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ children, description, onClose, open, title }: { children: ReactNode; description?: string; onClose: () => void; open: boolean; title: string }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add('overflow-hidden');
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(focusableSelector)?.focus();
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;
  return createPortal(
    <div aria-label={title} aria-modal="true" className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog">
      <button aria-label="Fermer la fenêtre" className="absolute inset-0 bg-slate-950/50" onClick={onClose} type="button" />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl" ref={panelRef}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div><h2 className="text-lg font-extrabold text-slate-950">{title}</h2>{description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}</div>
          <IconButton icon="close" label="Fermer" onClick={onClose} />
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
