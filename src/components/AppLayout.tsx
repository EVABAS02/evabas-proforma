import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="hidden md:block"><AppSidebar /></div>
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 overflow-auto">{children}</main>
        </div>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
