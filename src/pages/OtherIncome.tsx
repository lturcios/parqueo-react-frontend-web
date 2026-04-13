import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { MovementsResponse, Rate } from '../types/index';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Receipt, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'framer-motion';

export default function OtherIncome() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [filters, setFilters] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    tarifa_id: '0'
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data: rates } = useQuery<Rate[]>({
    queryKey: ['rates-other'],
    queryFn: async () => {
      const { data } = await api.get('/rates/other');
      return data;
    }
  });

  const { data, isLoading, isFetching } = useQuery<MovementsResponse>({
    queryKey: ['movements-other', filters, page],
    queryFn: async () => {
      const { data } = await api.get('/movements', { 
        params: { ...filters, page, pageSize, tipo: 'otros' } 
      });
      return data;
    }
  });

  const totalPages = Math.ceil((data?.total_count ?? 0) / pageSize);

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Otros Ingresos</h2>
          <p className="text-sm text-muted-foreground">Gestión de servicios y cobros no cronometrados.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 p-3 md:p-4 rounded-2xl flex items-center justify-between md:justify-start gap-4">
           <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">Total Percibido</p>
              <p className="text-xl md:text-2xl font-black text-primary">{formatCurrency(data?.total_ingresos ?? 0)}</p>
           </div>
           <button className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Download className="w-5 h-5 md:w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Filtros */}
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
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Servicio / Tarifa</label>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-primary" />
              <select
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none appearance-none"
                value={filters.tarifa_id}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, tarifa_id: e.target.value }))}
              >
                <option value="0">Todos los servicios</option>
                {rates?.map(rate => (
                  <option key={rate.id} value={rate.codigo_presup}>{rate.descripcion}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['movements-other'] })}
              className="w-full py-2 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground">Ticket</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground">Descripción del Servicio</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground">Hora Registrada</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground">Monto</th>
                <th className="px-6 py-4 font-bold uppercase tracking-tighter text-muted-foreground text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 bg-muted/10"></td>
                  </tr>
                ))
              ) : data?.movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    No se encontraron registros de otros ingresos.
                  </td>
                </tr>
              ) : (
                data?.movements.map((m, index) => (
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
                          <Receipt className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-widest">{m.pago_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-base text-foreground">{m.tarifa_descripcion || 'Servicio General'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{new Date(m.fecha_hora_entra).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground font-medium">{new Date(m.fecha_hora_entra).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-lg text-primary">
                      {formatCurrency(m.monto_total)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-500/20 shadow-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Cobrado
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
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