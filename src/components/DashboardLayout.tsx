import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { RoleSidebar, SidebarNavContent } from "@/components/RoleSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Wifi, WifiOff, Sparkles, Smartphone } from "lucide-react";
import logo from "@/assets/logo.png";
import VoiceAssistant from "@/components/VoiceAssistant";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { useSubscription } from "@/hooks/useSubscription";
import BackNavigationButton from "@/components/BackNavigationButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";

const DashboardLayout = () => {
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const { isPremium } = useSubscription();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <RoleSidebar />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header Premium sans barres de navigation superflues */}
        <header className="flex items-center justify-between border-b border-border/80 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-card/90 backdrop-blur-md shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0 text-foreground h-11 w-11 rounded-xl">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Menu principal</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 sm:w-80 p-0 border-r border-sidebar-border">
                <SidebarNavContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Bouton de navigation retour universel */}
            <BackNavigationButton />

            <div className="flex items-center gap-2">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden bg-white shadow-2xs border border-emerald-500/20 p-0.5 flex items-center justify-center shrink-0">
                <img src={logo} alt="NAFA - AGRITECH" className="h-full w-full object-contain rounded-lg" />
              </div>
              <span className="font-heading font-extrabold text-sm sm:text-base text-foreground/90">
                NAFA <span className="text-emerald-600 dark:text-emerald-400">- AGRITECH</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicateur de synchronisation Offline-First WhatsApp-style */}
            <SyncStatusBadge />

            {isPremium && (
              <Badge className="hidden sm:inline-flex bg-primary/15 text-primary border-primary/20 gap-1 text-xs font-semibold py-1 px-2.5 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Premium
              </Badge>
            )}
          </div>
        </header>

        {/* Main content avec typographie confortable et aérée */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-6xl py-4 px-3.5 sm:py-6 sm:px-6 lg:py-8 lg:px-8">
            <ErrorBoundary inline>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {isPremium && <VoiceAssistant />}
    </div>
  );
};

export default DashboardLayout;
