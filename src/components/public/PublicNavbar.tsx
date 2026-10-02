import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import {
  Menu,
  X,
  Compass,
  LayoutDashboard,
  LogIn,
  UserPlus,
  ShoppingBag,
  Wrench,
  Building2,
  BookOpen,
  ChevronDown,
  Layers,
  Cpu,
  MapPin,
  Droplets,
  Sprout,
  Beef,
  Sparkles,
} from "lucide-react";

export const PUBLIC_NAV_LINKS = [
  { name: "Accueil", path: "/" },
  {
    name: "Solutions",
    path: "/solutions",
    sublinks: [
      { name: "Diagnostic Agricole", path: "/solutions/diagnostic-agricole", icon: Cpu },
      { name: "Cartographie & GPS", path: "/solutions/cartographie-agricole", icon: MapPin },
      { name: "Conseils Agronomiques", path: "/solutions/conseils-agronomiques", icon: Sprout },
      { name: "Irrigation & Pompage", path: "/solutions/irrigation", icon: Droplets },
      { name: "Suivi d'Exploitation", path: "/solutions/suivi-exploitation", icon: Layers },
      { name: "Élevage & Santé Animale", path: "/solutions/elevage", icon: Beef },
      { name: "Copilote NAFA Genius", path: "/solutions/ia-copilote", icon: Sparkles },
    ],
  },
  { name: "Services Partenaires", path: "/services" },
  { name: "Partenaires", path: "/partenaires" },
  { name: "Marketplace", path: "/marketplace" },
  { name: "Ressources", path: "/ressources" },
  { name: "À propos", path: "/a-propos" },
  { name: "Contact", path: "/contact" },
];

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden bg-white shadow-xs border border-border p-1 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <img src={logo} alt="NAFA-AGRITECH" className="h-full w-full object-contain rounded-lg" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-foreground text-base sm:text-lg tracking-tight leading-none">
              NAFA <span className="text-[#F97316]">- AGRITECH</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline-block leading-tight mt-0.5">
              Aide à la décision agricole &amp; pastorale
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {PUBLIC_NAV_LINKS.map((link) => {
            if (link.sublinks) {
              return (
                <div
                  key={link.path}
                  className="relative"
                  onMouseEnter={() => setSolutionsDropdownOpen(true)}
                  onMouseLeave={() => setSolutionsDropdownOpen(false)}
                >
                  <Link
                    to={link.path}
                    className={`px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-colors flex items-center gap-1 ${
                      isActive(link.path)
                        ? "text-[#F97316] bg-[#F97316]/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <span>{link.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Link>

                  {/* Dropdown Menu */}
                  {solutionsDropdownOpen && (
                    <div className="absolute top-full left-0 w-64 pt-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-card border border-border rounded-2xl shadow-xl p-2 space-y-0.5">
                        {link.sublinks.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setSolutionsDropdownOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                location.pathname === sub.path
                                  ? "text-primary bg-primary/10 font-bold"
                                  : "text-foreground/80 hover:text-foreground hover:bg-muted"
                              }`}
                            >
                              <SubIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>{sub.name}</span>
                            </Link>
                          );
                        })}
                        <div className="pt-1.5 border-t border-border mt-1 px-3 pb-1">
                          <Link
                            to="/solutions"
                            onClick={() => setSolutionsDropdownOpen(false)}
                            className="text-[11px] font-bold text-[#F97316] hover:underline flex items-center justify-between"
                          >
                            <span>Toutes les solutions</span>
                            <span>&rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-xl text-xs xl:text-sm font-semibold transition-colors ${
                  isActive(link.path)
                    ? "text-[#F97316] bg-[#F97316]/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <Button
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 sm:px-4 shadow-sm flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Mon Espace</span>
            </Button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth?mode=login")}
                className="rounded-full text-xs font-semibold px-3 text-muted-foreground hover:text-foreground"
              >
                <LogIn className="h-3.5 w-3.5 mr-1" />
                Connexion
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/auth?mode=register")}
                className="rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold px-3.5 shadow-sm shadow-orange-500/20"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Créer un compte
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-foreground"
            aria-label="Menu de navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top-3 duration-200">
          <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-border/60">
            {user ? (
              <Button
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/dashboard");
                }}
                className="w-full col-span-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                Tableau de Bord
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/auth?mode=login");
                  }}
                  className="rounded-xl text-xs font-semibold"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Connexion
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/auth?mode=register");
                  }}
                  className="rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white text-xs font-bold"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  S'inscrire
                </Button>
              </>
            )}
          </div>

          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                isActive("/") && location.pathname === "/" ? "text-[#F97316] bg-[#F97316]/10 font-bold" : "text-foreground"
              }`}
            >
              Accueil
            </Link>

            <div className="space-y-0.5 pt-1">
              <span className="px-3 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">
                Nos Solutions Technologiques
              </span>
              <div className="grid grid-cols-1 gap-0.5 pl-2">
                {PUBLIC_NAV_LINKS.find((l) => l.name === "Solutions")?.sublinks?.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-foreground/80 hover:bg-muted"
                    >
                      <SubIcon className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{sub.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                isActive("/services") ? "text-[#F97316] bg-[#F97316]/10 font-bold" : "text-foreground"
              }`}
            >
              Services Techniques Partenaires
            </Link>
            <Link
              to="/partenaires"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                isActive("/partenaires") ? "text-[#F97316] bg-[#F97316]/10 font-bold" : "text-foreground"
              }`}
            >
              Annuaire des Partenaires
            </Link>
            <Link
              to="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                isActive("/marketplace") ? "text-[#F97316] bg-[#F97316]/10 font-bold" : "text-foreground"
              }`}
            >
              Marketplace Agricole
            </Link>
            <Link
              to="/ressources"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                isActive("/ressources") ? "text-[#F97316] bg-[#F97316]/10 font-bold" : "text-foreground"
              }`}
            >
              Guides &amp; Bonnes Pratiques
            </Link>
            <Link
              to="/a-propos"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                isActive("/a-propos") ? "text-[#F97316] bg-[#F97316]/10 font-bold" : "text-foreground"
              }`}
            >
              À propos
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                isActive("/contact") ? "text-[#F97316] bg-[#F97316]/10 font-bold" : "text-foreground"
              }`}
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
