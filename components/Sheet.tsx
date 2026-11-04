import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Bottom sheet on phones, centered dialog from 900 px (styles/components.css).
// While busy (saving) it doesn't close, so the confirmation or the error of the save isn't lost.
export function Sheet({ open, onClose, title, subtitle, children, footer, busy = false }: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const requestClose = () => { if (!busyRef.current) closeRef.current(); };

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the dialog itself: focusing an input would pop the phone keyboard over the sheet
    ref.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      // Back to the button that opened it, when it's still on the screen
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  // Leaving the screen (Android's back button, a link) closes the sheet instead of leaving it over another page
  const { key } = useLocation();
  const openedAt = useRef(key);
  useEffect(() => {
    if (key !== openedAt.current) requestClose();
  }, [key]);

  // Tab and Shift+Tab go around inside the sheet
  const keepFocusInside = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;
  return createPortal(
    <>
      <div className="scrim" onClick={requestClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} aria-busy={busy} ref={ref} tabIndex={-1} onKeyDown={keepFocusInside}>
        <div className="grab" />
        <h2 className="sheet-title">{title}</h2>
        {subtitle && <div className="sheet-sub">{subtitle}</div>}
        {children}
        {footer && <div className="sheet-actions">{footer}</div>}
      </div>
    </>,
    document.body,
  );
}
