import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { MovementsResponse } from '../types/index';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Car, 
  ChevronLeft, 
  ChevronRight, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Clock
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

export default function Movements() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [filters, setFilters] = useState({
    fecha_inicio: searchParams.get('fecha_inicio') || new Date().toISOString().split('T')[0],
    fecha_fin: searchParams.get('fecha_fin') || new Date().toISOString().split('T')[0],
    estado: searchParams.get('estado') || 'todos'
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data, isLoading, isFetching } = useQuery<MovementsResponse>({
    queryKey: ['movements', filters, page],
    queryFn: async () => {
      const { data } = await api.get('/movements', { 
        params: { ...filters, page, pageSize, tipo: 'normal' } 
      });
      return data;
    }
  });

  const annulMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/movements/anular/${id}`);
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Ticket anulado correctamente' });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al anular ticket' });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const totalPages = Math.ceil((data?.total_count ?? 0) / pageSize);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Historial</h2>
          <p className="text-sm text-muted-foreground">Gestión de registros del sistema.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 p-3 md:p-4 rounded-2xl flex items-center justify-between md:justify-start gap-4">
           <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">Total Ingresos</p>
              <p className="text-xl md:text-2xl font-black text-primary">{formatCurrency(data?.total_ingresos ?? 0)}</p>
           </div>
           <button className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Download className="w-5 h-5 md:w-6 h-6" />
           </button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-2xl flex items-center gap-3 border shadow-sm",
              message.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" : "bg-destructive/10 border-destructive/20 text-destructive"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm font-medium">{message.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros Mobile-First */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-primary" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                value={filters.fecha_inicio}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, fecha_inicio: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Fin</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-primary" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                value={filters.fecha_fin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, fecha_fin: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Estado</label>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-primary" />
              <select
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none appearance-none"
                value={filters.estado}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
              >
                <option value="todos">Todos</option>
                <option value="activos">Solo Activos</option>
                <option value="cerrados">Solo Cerrados</option>
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['movements'] })}
              className="w-full py-2 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Vista para Desktop (Tabla) */}
      <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground">Ticket / Placa</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground">Entrada</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground">Salida</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground">Monto</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground text-center">Estado</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 bg-muted/10"></td>
                  </tr>
                ))
              ) : (data?.movements?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                    No se encontraron movimientos.
                  </td>
                </tr>
              ) : (
                data?.movements?.map((m, index) => {
                  const isClosed = m.fecha_hora_sale && !m.fecha_hora_sale.startsWith('0001');
                  
                  return (
                    <motion.tr 
                      key={m.pago_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-accent/20 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-mono font-black text-base">{m.placa}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">{m.pago_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold">{new Date(m.fecha_hora_entra).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground font-medium">{new Date(m.fecha_hora_entra).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isClosed ? (
                          <>
                            <p className="font-bold">{new Date(m.fecha_hora_sale!).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground font-medium">{new Date(m.fecha_hora_sale!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-orange-500 font-bold italic text-xs animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>En parqueo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-lg text-primary">
                        {isClosed ? formatCurrency(m.monto_total) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                            isClosed 
                              ? "bg-green-500/10 text-green-600 border-green-500/20" 
                              : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                          )}>
                            {isClosed ? 'Cerrado' : 'Activo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isClosed && (
                          <button
                            onClick={() => {
                              if(confirm('¿Está seguro de anular este ticket? El monto será $0.00')) {
                                annulMutation.mutate(m.pago_id);
                              }
                            }}
                            disabled={annulMutation.isPending}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all inline-flex items-center gap-1 text-xs font-bold border border-transparent hover:border-destructive/20"
                          >
                            {annulMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Anular
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista para Mobile (Cards) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 bg-card rounded-2xl animate-pulse border border-border" />)
        ) : (
          data?.movements.map((m, index) => {
            const isClosed = m.fecha_hora_sale && !m.fecha_hora_sale.startsWith('0001');
            return (
              <motion.div
                key={m.pago_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4 relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div className={cn(
                  "absolute top-0 left-0 w-1.5 h-full",
                  isClosed ? "bg-green-500" : "bg-orange-500"
                )} />

                <div className="flex justify-between items-start pl-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-xl font-mono tracking-tighter leading-none">{m.placa}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">ID: {m.pago_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-lg border inline-block",
                      isClosed ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                    )}>
                      {isClosed ? 'Cerrado' : 'Activo'}
                    </p>
                    {isClosed && (
                      <p className="text-xl font-black text-primary mt-1">{formatCurrency(m.monto_total)}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pl-2 text-sm border-t border-border pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Entrada</p>
                    <p className="font-bold">{new Date(m.fecha_hora_entra).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.fecha_hora_entra).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Salida</p>
                    {isClosed ? (
                      <>
                        <p className="font-bold">{new Date(m.fecha_hora_sale!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-muted-foreground">{new Date(m.fecha_hora_sale!).toLocaleDateString()}</p>
                      </>
                    ) : (
                      <p className="text-orange-500 font-bold italic py-1">En parqueo</p>
                    )}
                  </div>
                </div>

                {!isClosed && (
                  <button
                    onClick={() => {
                      if(confirm('¿Está seguro de anular este ticket?')) {
                        annulMutation.mutate(m.pago_id);
                      }
                    }}
                    className="w-full py-3 bg-destructive/5 text-destructive rounded-xl text-sm font-black uppercase tracking-widest border border-destructive/10 flex items-center justify-center gap-2 active:bg-destructive/10 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Anular Ticket
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Paginación PRO */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          Mostrando <span className="text-foreground font-bold">{(page-1) * pageSize + 1} - {Math.min(page * pageSize, data?.total_count ?? 0)}</span> de <span className="text-foreground font-bold">{data?.total_count ?? 0}</span> registros
        </p>
        
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1 || isLoading}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-xl border border-border bg-background hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm font-bold px-3 py-1 bg-primary text-white rounded-lg shadow-lg shadow-primary/20">{page}</span>
            <span className="text-sm text-muted-foreground">de</span>
            <span className="text-sm font-bold">{totalPages || 1}</span>
          </div>

          <button 
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-xl border border-border bg-background hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
