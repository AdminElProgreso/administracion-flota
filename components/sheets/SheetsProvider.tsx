import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Sheet } from '../Sheet';
import { EmptyState } from '../ui';
import { SheetsContext, type SheetRequest } from './context';
import { DocSheet } from './DocSheet';
import { QuickSheet } from './QuickSheet';

export { useSheets, type SheetRequest } from './context';

function SheetFor({ request, onClose }: { request: SheetRequest; onClose: () => void }) {
  switch (request.kind) {
    case 'quick':
      return <QuickSheet onClose={onClose} />;
    case 'renew':
    case 'appointment':
      return <DocSheet kind={request.kind} vehicleId={request.vehicleId} docType={request.docType} onClose={onClose} />;
    default:
      return (
        <Sheet open onClose={onClose} title="En preparación">
          <EmptyState icon="construction" title="Este formulario llega en el próximo paso" />
        </Sheet>
      );
  }
}

export function SheetsProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<SheetRequest | null>(null);
  // A new key on every open gives each form a fresh state
  const [openCount, setOpenCount] = useState(0);
  const open = useCallback((next: SheetRequest) => {
    setRequest(next);
    setOpenCount(c => c + 1);
  }, []);
  const close = useCallback(() => setRequest(null), []);
  const api = useMemo(() => ({ open, close }), [open, close]);

  return (
    <SheetsContext.Provider value={api}>
      {children}
      {request && <SheetFor key={openCount} request={request} onClose={close} />}
    </SheetsContext.Provider>
  );
}
