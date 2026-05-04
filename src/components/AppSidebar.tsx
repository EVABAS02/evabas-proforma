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
    <Sidebar className="border-none">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-white truncate">{companyName}</p>
            <p className="text-[11px] text-sidebar-foreground/60">Facturation Proforma</p>
          </div>
        </div>
      </div>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.end}
                      className={({ isActive }) => cn(
                        'relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-md text-[#94A3B8] hover:bg-white/5 hover:text-white transition-colors text-sm border-l-[3px] border-transparent',
                        isActive && '!text-white !bg-accent/10 !border-accent font-semibold'
                      )}>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 truncate mb-2">{user?.email}</p>
        <Button variant="ghost" size="sm" onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-500/10">
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
