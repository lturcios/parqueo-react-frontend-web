import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { DashboardStats, AnalyticsData } from '../types/index';
import { Car, DollarSign, TrendingUp, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, cn, toLocalDateString } from '../lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

// The hourly chart is the heavier query and changes slowly, so it never refreshes faster than this.
const MIN_ANALYTICS_REFRESH_SECONDS = 60;
const DEFAULT_REFRESH_SECONDS = 30;

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const refreshSeconds = settings.refreshRate > 0 ? settings.refreshRate : DEFAULT_REFRESH_SECONDS;

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
    refetchInterval: refreshSeconds * 1000,
  });

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    isFetching: analyticsFetching,
    refetch: refetchAnalytics,
  } = useQuery<AnalyticsData[]>({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/analytics');
      return data;
    },
    refetchInterval: Math.max(refreshSeconds, MIN_ANALYTICS_REFRESH_SECONDS) * 1000,
  });

  const today = toLocalDateString();
  const hasError = statsError || analyticsError;
  const isRetrying = statsFetching || analyticsFetching;
  // Without data, a failed request must not look like a quiet day with zero movements.
  const placeholder = '—';

  const retry = () => {
    if (statsError) refetchStats();
    if (analyticsError) refetchAnalytics();
  };

  const cards = [
    {
      title: 'Movimientos Totales',
      value: stats?.total ?? placeholder,
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      onClick: () => navigate(`/movements?fecha_inicio=${today}&fecha_fin=${today}&estado=todos`),
    },
    {
      title: 'Vehículos Activos',
      value: stats?.activos ?? placeholder,
      icon: Car,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      onClick: () => navigate(`/movements?estado=activos`),
    },
    {
      title: 'Ingresos del Día',
      value: stats ? formatCurrency(stats.ingresos) : placeholder,
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ];

  const formatHour = (hour: number) => `${hour}:00`;

  if (statsLoading || analyticsLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-card rounded-2xl border border-border" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-card rounded-2xl border border-border" />
          <div className="h-80 bg-card rounded-2xl border border-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Estado del sistema en tiempo real.</p>
      </div>

      {hasError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 text-destructive flex flex-col sm:flex-row sm:items-center gap-3 text-sm"
        >
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>
              No se pudieron cargar los datos del dashboard.{' '}
              {stats || analytics
                ? 'Se muestran los últimos datos obtenidos.'
                : 'Los indicadores no están disponibles.'}{' '}
              Se reintentará automáticamente.
            </p>
          </div>
          <button
            type="button"
            onClick={retry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 font-bold hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={card.onClick}
            className={cn(
              "p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all group",
              card.onClick && "cursor-pointer hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{card.title}</p>
                <p className="text-3xl font-black mt-1 tracking-tighter">{card.value}</p>
              </div>
              <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", card.bg)}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Frecuencia de Ingresos</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={formatHour} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Ingresos por Hora</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics ?? []}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={formatHour} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: any) => [formatCurrency(value as number), 'Ingresos']}
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorIngresos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
