import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { DashboardStats, AnalyticsData } from '../types/index';
import { Car, Clock, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'framer-motion';
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

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData[]>({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/analytics');
      return data;
    },
    refetchInterval: 60000,
  });

  const cards = [
    {
      title: 'Movimientos Totales',
      value: stats?.total ?? 0,
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Vehículos Activos',
      value: stats?.activos ?? 0,
      icon: Car,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'Ingresos del Día',
      value: formatCurrency(stats?.ingresos ?? 0),
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all group"
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
                  formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
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
