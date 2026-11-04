import { LayoutDashboard, FileText, Users, Package, LogOut, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Tableau de bord', url: '/dashboard', icon: LayoutDashboard, end: true },
  { title: 'Factures', url: '/factures', icon: FileText },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Produits', url: '/produits', icon: Package },
  { title: 'Paramètres', url: '/parametres', icon: Settings },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const companyName = profile?.company_name || 'Mon Entreprise';
  const initials = companyName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Sidebar className="border-none bg-[#090D16] text-white select-none">
      {/* Header avec Logo et Nom de l'entreprise */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-white truncate">{companyName}</p>
            <p className="text-[11px] text-slate-400">Facturation Proforma</p>
          </div>
        </div>
      </div>

      {/* Menu de navigation principal */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.end}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all text-sm font-medium',
                        isActive && 'bg-blue-600 text-white font-bold shadow-sm'
                      )}>
                      <item.icon className="h-[18px] w-[18px] text-slate-400" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer avec utilisateur et déconnexion */}
      <SidebarFooter className="p-4 border-t border-slate-800/80 bg-[#090D16]">
        <p className="text-xs text-slate-400 truncate mb-2 font-medium">{user?.email}</p>
        <Button variant="ghost" size="sm" onClick={signOut}
          className="w-full justify-start text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}