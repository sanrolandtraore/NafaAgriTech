import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FileText,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Check,
  User,
  Calendar,
  Landmark,
} from "lucide-react";
import { partnerStorage, QuoteRequest } from "@/lib/partnerStorage";
import BackNavigationButton from "@/components/BackNavigationButton";

export default function PartnerDemandesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await partnerStorage.getQuotes();
      setQuotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("nafa-partner-data-updated", handleUpdate);
    return () => window.removeEventListener("nafa-partner-data-updated", handleUpdate);
  }, [user]);

  const handleUpdateStatus = async (quoteId: string, newStatus: "acceptee" | "refusee" | "cloturee") => {
    await partnerStorage.updateQuoteStatus(quoteId, newStatus);
    toast.success(`Dossier marqué comme ${newStatus === "acceptee" ? "Validé" : newStatus === "refusee" ? "Refusé" : "Clôturé"}`);
    loadData();
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (q.requester_name || "").toLowerCase().includes(query) ||
        (q.offer_title || "").toLowerCase().includes(query) ||
        (q.message || "").toLowerCase().includes(query) ||
        (q.contact_phone || "").includes(query);

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      return q.status === statusFilter;
    });
  }, [quotes, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 container max-w-6xl mx-auto px-4 py-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <FileText className="h-7 w-7 text-purple-600" />
              Demandes de Financement & Souscriptions Reçues
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Consultez et traitez les dossiers de demande de crédit agricole et de souscription d'assurance soumis par les exploitants.
            </p>
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone, produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="h-8 text-xs font-semibold"
          >
            Tous ({quotes.length})
          </Button>
          <Button
            variant={statusFilter === "en_attente" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("en_attente")}
            className="h-8 text-xs font-semibold"
          >
            En attente ({quotes.filter((q) => q.status === "en_attente").length})
          </Button>
          <Button
            variant={statusFilter === "acceptee" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("acceptee")}
            className="h-8 text-xs font-semibold"
          >
            Validés ({quotes.filter((q) => q.status === "acceptee").length})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Chargement des demandes...</div>
      ) : filteredQuotes.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2">
          <div className="h-12 w-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-sm">Aucune demande trouvée</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Les demandes de crédit et souscriptions transmises par les producteurs et coopératives s'afficheront directement ici.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((q) => (
            <Card key={q.id} className="border border-border/80 shadow-xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                    <User className="h-4 w-4 text-purple-600" />
                    {q.requester_name || "Exploitant Agricole"}
                  </span>
                  <Badge
                    variant={q.status === "acceptee" ? "default" : q.status === "refusee" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {q.status === "acceptee" ? "Dossier Validé" : q.status === "refusee" ? "Refusé" : "En attente"}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  <strong>Produit demandé :</strong> {q.offer_title || "Demande de financement direct"}
                </p>

                {q.message && (
                  <p className="text-xs bg-muted/60 p-2.5 rounded-lg text-foreground border border-border/50 max-w-2xl">
                    "{q.message}"
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(q.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  {q.contact_phone && (
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      {q.contact_phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                {q.contact_phone && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  >
                    <a href={`tel:${q.contact_phone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Appeler
                    </a>
                  </Button>
                )}

                {q.contact_phone && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold text-emerald-600 border-emerald-400 hover:bg-emerald-50"
                  >
                    <a
                      href={`https://wa.me/${q.contact_phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-3 w-3 mr-1 text-emerald-600" />
                      WhatsApp
                    </a>
                  </Button>
                )}

                {q.status === "en_attente" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(q.id, "acceptee")}
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Valider
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus(q.id, "refusee")}
                      className="h-8 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      Refuser
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
