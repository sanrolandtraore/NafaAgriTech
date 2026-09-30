import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col justify-between bg-background">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <h1 className="text-6xl font-heading font-black text-primary">404</h1>
          <p className="text-xl font-bold text-foreground">Page introuvable</p>
          <p className="text-sm text-muted-foreground">La page <code className="bg-muted px-2 py-1 rounded text-foreground font-mono">{location.pathname}</code> n'existe pas ou a été déplacée.</p>
          <div className="pt-2">
            <Link to="/" className={buttonVariants({ variant: "default" })}>
              <Home className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
