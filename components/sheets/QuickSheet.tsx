import { Sheet } from '../Sheet';
import { Icon } from '../ui';
import { useSheets, type SheetRequest } from './context';

const OPTIONS: { icon: string; title: string; sub: string; request: SheetRequest }[] = [
  { icon: 'handyman', title: 'Registrar un trabajo', sub: 'Mantenimiento o reparación', request: { kind: 'work' } },
  { icon: 'autorenew', title: 'Renovar un documento', sub: 'Seguro, VTV o patente', request: { kind: 'renew' } },
  { icon: 'event', title: 'Cargar un turno', sub: 'Para renovar un documento', request: { kind: 'appointment' } },
  { icon: 'add_circle', title: 'Agregar un vehículo', sub: 'Camioneta, camión, tractor o generador', request: { kind: 'vehicle' } },
];

export function QuickSheet({ onClose }: { onClose: () => void }) {
  const { open } = useSheets();
  return (
    <Sheet open onClose={onClose} title="¿Qué querés hacer?">
      <div className="quick">
        {OPTIONS.map(o => (
          <button key={o.title} type="button" className="qa" onClick={() => open(o.request)}>
            <span className="row-icon"><Icon name={o.icon} /></span>
            <span><b>{o.title}</b><small>{o.sub}</small></span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
