import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Rate } from '../types/index';
import { Search, CheckCircle2, AlertCircle, Loader2, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '../lib/utils';

export default function Parking() {
  const queryClient = useQueryClient();
  const [placa, setPlaca] = useState('');
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [pagoID, setPagoID] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { data: rates } = useQuery<Rate[]>({
    queryKey: ['rates'],
    queryFn: async () => {
      const { data } = await api.get('/rates');
      return data;
    }
  });

  const entryMutation = useMutation({
    mutationFn: async (data: { placa: string, codigo_presup: number }) => {
      return api.post('/movements/entrada', data);
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Entrada registrada correctamente' });
      setPlaca('');
      setSelectedRate(null);
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al registrar entrada' });
    }
  });

  const exitMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/movements/salida/${id}`);
    },
    onSuccess: (res) => {
      const m = res.data;
      setMessage({ 
        type: 'success', 
        text: `Salida registrada. Total a cobrar: ${formatCurrency(m.monto_total)}` 
      });
      setPagoID('');
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setMessage(null), 10000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al registrar salida' });
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Control de Acceso</h2>
        <p className="text-muted-foreground">Registra entradas y salidas de vehículos en tiempo real.</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "p-4 rounded-xl flex items-center gap-3 border shadow-sm mb-6",
              message.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" : "bg-destructive/10 border-destructive/20 text-destructive"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-medium">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Registro de Entrada */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <LogIn className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Registro de Entrada</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Placa del Vehículo</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all uppercase font-mono text-lg tracking-widest"
                placeholder="P 000-000"
                value={placa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlaca(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Tarifa</label>
              <div className="grid grid-cols-2 gap-2">
                {rates?.map(rate => (
                  <button
                    key={rate.id}
                    onClick={() => setSelectedRate(rate.codigo_presup)}
                    className={cn(
                      "px-4 py-2 text-sm rounded-lg border transition-all text-left",
                      selectedRate === rate.codigo_presup
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-accent"
                    )}
                  >
                    <p className="font-bold">{rate.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(rate.precio_unitario)} / hr</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => placa && selectedRate && entryMutation.mutate({ placa, codigo_presup: selectedRate })}
              disabled={!placa || !selectedRate || entryMutation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {entryMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar Entrada"}
            </button>
          </div>
        </section>

        {/* Registro de Salida */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Registro de Salida</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID de Ticket / Pago</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
                  placeholder="Ingrese el ID del ticket"
                  value={pagoID}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPagoID(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground px-1">Escanee o ingrese manualmente el código del ticket.</p>
            </div>

            <button
              onClick={() => exitMutation.mutate(pagoID)}
              disabled={!pagoID || exitMutation.isPending}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all"
            >
              {exitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Calcular y Cobrar"}
            </button>

            <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-dashed border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ayuda</h4>
              <p className="text-sm text-muted-foreground">
                El sistema calculará automáticamente el tiempo transcurrido y aplicará la tarifa correspondiente según el tipo de vehículo.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
