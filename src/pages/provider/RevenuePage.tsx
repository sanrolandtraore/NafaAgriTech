import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, Clock, CheckCircle2, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { partnerStorage, PartnerMission } from "@/lib/partnerStorage";

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export default function RevenuePage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<PartnerMission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await partnerStorage.getMissions(user?.id);
      setMissions(data);
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

  const billable = useMemo(() => missions.filter((m) => m.price), [missions]);
  const total = billable.reduce((s, m) => s + Number(m.price || 0), 0);
  const paid = billable.filter((m) => m.paid).reduce((s, m) => s + Number(m.price || 0), 0);
  const pending = total - paid;

  const togglePaid = async (m: PartnerMission) => {
    try {
      await partnerStorage.saveMission({
        ...m,
        paid: !m.paid,
      });
      toast.success(m.paid ? "Marqué comme non payé" : "Paiement encaissé avec succès !");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Erreur de mise à jour");
    }
  };

  const tiles = [
    { label: "Chiffre d'affaires total", value: fcfa(total), icon: TrendingUp, color: "text-primary" },
    { label: "Encaissé (réglé)", value: fcfa(paid), icon: CheckCircle2, color: "text-emerald-600" },
    { label: "En attente d'encaissement", value: fcfa(pending), icon: Clock, color: "text-amber-600" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold">Chiffre d'Affaires & Facturation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivi des recettes, règlements Mobile Money / virement et paiements en attente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiles.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="hover:border-primary/50 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`p-2 rounded-lg bg-muted/60 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-heading font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Historique des prestations & paiements</CardTitle>
          <CardDescription className="text-xs">
            Basculez le statut d'encaissement en un clic dès réception du règlement client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : billable.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune prestation facturable enregistrée pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {billable.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Client : <strong>{m.client_name}</strong> · Prévu le {new Date(m.scheduled_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-heading font-bold text-base text-foreground">
                      {fcfa(Number(m.price))}
                    </span>
                    <Button
                      size="sm"
                      variant={m.paid ? "secondary" : "outline"}
                      onClick={() => togglePaid(m)}
                      className={`text-xs h-8 flex items-center gap-1.5 ${m.paid ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30" : "text-amber-700 border-amber-500/30 hover:bg-amber-50"}`}
                    >
                      {m.paid ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Encaissé
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5 text-amber-600" /> Marquer payé
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
