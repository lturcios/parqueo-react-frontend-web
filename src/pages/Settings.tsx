import { useSettings } from '../hooks/useSettings';
import { RefreshCcw, Info } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Administre los parámetros globales del sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Sección: Interfaz */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Rendimiento y Actualización</h3>
              <p className="text-sm text-muted-foreground">Configura la frecuencia de sincronización de datos.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
              <label className="text-sm font-bold block">Refresco de Dashboard (segundos)</label>
              <select 
                className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                value={settings.refreshRate}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSettings({ refreshRate: Number(e.target.value) })}
              >
                <option value={15}>Cada 15 segundos</option>
                <option value={30}>Cada 30 segundos (Recomendado)</option>
                <option value={60}>Cada minuto</option>
                <option value={300}>Cada 5 minutos</option>
              </select>
            </div>
          </div>
        </section>

        {/* Info Box */}
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Estos ajustes se guardan localmente en su navegador actual. Para cambios permanentes en la base de datos, consulte con el administrador de infraestructura.
          </p>
        </div>
      </div>
    </div>
  );
}
