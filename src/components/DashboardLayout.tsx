import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../hooks/useSettings';
import { 
  LayoutDashboard, 
  Car, 
  History, 
  Settings as SettingsIcon, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: true },
    { name: 'Entrada/Salida', href: '/parking', icon: Car, show: settings.allowWebEntry },
    { name: 'Movimientos', href: '/movements', icon: History, show: true },
    { name: 'Configuración', href: '/settings', icon: SettingsIcon, show: true },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col w-64 border-r border-border bg-card transition-all duration-300",
      )}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Car className="w-8 h-8" />
            <span>Parqueo</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {theme === 'light' ? 'Tema Oscuro' : 'Tema Claro'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-muted-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 md:hidden flex justify-center">
             <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <Car className="w-6 h-6" />
              <span>Parqueo</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">Operador Central</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              OC
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </div>

        {/* Navigation Mobile (Bottom Bar) */}
        <nav className="md:hidden border-t border-border bg-card h-16 flex items-center justify-around px-2">
          {navigation.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-colors",
                location.pathname === item.href 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="text-[10px] font-medium">Tema</span>
          </button>
        </nav>
      </main>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="w-64 h-full bg-card p-6 flex flex-col animate-in slide-in-from-left duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
               <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Car className="w-8 h-8" />
                <span>Parqueo</span>
              </h1>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.href 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-auto flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
