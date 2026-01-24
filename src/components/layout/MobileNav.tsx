import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, Sparkles, Trophy, Home, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/sorteios', label: 'Sorteios', icon: Ticket },
  { href: '/raspadinhas', label: 'Raspadinhas', icon: Sparkles },
  { href: '/ganhadores', label: 'Ganhadores', icon: Trophy },
  { href: '/estatisticas', label: 'Stats', icon: BarChart3, requiresAuth: true },
];

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = navItems.filter(
    (item) => !item.requiresAuth || user
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px]',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 transition-transform',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-[10px] font-medium leading-none',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
