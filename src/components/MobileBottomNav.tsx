import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Package, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { url: '/dashboard', icon: LayoutDashboard, label: 'Accueil', end: true },
  { url: '/factures', icon: FileText, label: 'Factures' },
  { url: '/clients', icon: Users, label: 'Clients' },
  { url: '/produits', icon: Package, label: 'Produits' },
  { url: '/parametres', icon: Settings, label: 'Réglages' },
];

export default function MobileBottomNav() {
  const { signOut } = useAuth();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-[60px] bg-white border-t border-[#E5E7EB] flex items-center justify-around no-print">
      {items.map((it) => (
        <NavLink
          key={it.url}
          to={it.url}
          end={it.end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 text-[10px] transition-colors',
              isActive ? 'text-primary' : 'text-[#9CA3AF]'
            )
          }
          aria-label={it.label}
        >
          <it.icon className="h-5 w-5" />
          <span>{it.label}</span>
        </NavLink>
      ))}
      <button
        onClick={signOut}
        aria-label="Se déconnecter"
        className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 text-[10px] text-[#9CA3AF] hover:text-red-500 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Quitter</span>
      </button>
    </nav>
  );
}