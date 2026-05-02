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
import { Logo } from '@/components/Logo';

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
        <Logo dark />
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{companyName}</p>
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
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors text-sm',
                        isActive && 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:bg-sidebar-primary'
                      )}>
                      <item.icon className="h-4 w-4" />
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
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
