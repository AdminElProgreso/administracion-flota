import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Bottom sheet on phones, centered dialog from 900 px (styles/components.css)
export function Sheet({ open, onClose, title, subtitle, children, footer }: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the dialog itself: focusing an input would pop the phone keyboard over the sheet
    ref.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
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
