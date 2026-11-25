import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Tag, X } from 'lucide-react';
import api from '../lib/api';
import type { Movement, Rate } from '../types/index';
import { formatCurrency } from '../lib/utils';

interface ChangeRateDialogProps {
  movement: Movement;
  onClose: () => void;
  onChanged: () => void;
}

// Vehicle rates have no icon or an icon up to 10; "otros ingresos" use higher icons.
const isVehicleRate = (rate: Rate) => rate.icon_file == null || rate.icon_file <= 10;

// A rate code has one row per tier; keep its first tier, the price stored on the ticket.
function vehicleRateOptions(rates: Rate[], currentCode: number): Rate[] {
  const byCode = new Map<number, Rate>();
  for (const rate of rates.filter(isVehicleRate)) {
    const known = byCode.get(rate.codigo_presup);
    if (!known || rate.tiempo_minimo < known.tiempo_minimo) {
      byCode.set(rate.codigo_presup, rate);
    }
  }
  return [...byCode.values()]
    .filter(rate => rate.codigo_presup !== currentCode)
    .sort((a, b) => a.descripcion.localeCompare(b.descripcion));
}

function errorMessage(err: any): string {
  switch (err.response?.status) {
    case 403:
      return 'El cambio de tarifa no está disponible para esta ubicación.';
    case 404:
      return 'No se encontró el ticket en el dispositivo.';
    case 409:
      return 'El vehículo ya salió o el ticket no admite cambio de tarifa.';
    case 400:
      return 'La tarifa seleccionada no es válida para este ticket.';
    default:
      return 'No se pudo cambiar la tarifa. Intente de nuevo.';
  }
}

export default function ChangeRateDialog({ movement, onClose, onChanged }: ChangeRateDialogProps) {
  const [selected, setSelected] = useState<number | ''>('');

  const { data: rates, isLoading, isError } = useQuery<Rate[]>({
    queryKey: ['rates'],
    queryFn: async () => {
      const { data } = await api.get('/rates');
      return data;
    },
  });

  const options = useMemo(() => vehicleRateOptions(rates ?? [], movement.codigo_presup), [rates, movement.codigo_presup]);

  const mutation = useMutation({
    mutationFn: (codigo: number) => api.patch(`/movements/${encodeURIComponent(movement.pago_id)}/tarifa`, { codigo_presup: codigo }),
    onSuccess: onChanged,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mutation.isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, mutation.isPending]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !mutation.isPending && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-rate-title"
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="change-rate-title" className="text-lg font-bold">Cambiar tarifa</h3>
            <p className="text-sm text-muted-foreground">
              Placa <span className="font-mono font-bold text-foreground">{movement.placa}</span> · {movement.pago_id}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={mutation.isPending} aria-label="Cerrar" className="p-1 rounded-lg hover:bg-accent disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tarifa actual</p>
          <p className="font-bold">{movement.tarifa_descripcion || movement.codigo_presup}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-rate" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nueva tarifa</label>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando tarifas…</div>
          ) : isError ? (
            <p className="text-sm text-destructive">No se pudieron cargar las tarifas.</p>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay otras tarifas de vehículo disponibles.</p>
          ) : (
            <select
              id="new-rate"
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
              value={selected}
              onChange={e => setSelected(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Seleccione una tarifa</option>
              {options.map(rate => (
                <option key={rate.codigo_presup} value={rate.codigo_presup}>
                  {rate.descripcion} — {formatCurrency(rate.precio_unitario)}
                </option>
              ))}
            </select>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Solo cambia la tarifa del ticket y queda registrado en sus observaciones. El dispositivo lo recibe al instante; este listado lo mostrará cuando se complete la sincronización.
        </p>

        {mutation.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(mutation.error)}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={mutation.isPending} className="px-4 py-2 rounded-xl border border-border text-sm font-bold hover:bg-accent disabled:opacity-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => selected !== '' && mutation.mutate(selected)}
            disabled={selected === '' || mutation.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            Cambiar tarifa
          </button>
        </div>
      </div>
    </div>
  );
}
