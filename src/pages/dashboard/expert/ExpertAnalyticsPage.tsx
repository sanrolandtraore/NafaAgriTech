import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, Microscope, FileText, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function ExpertAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ clients: 0, visitsMonth: 0, diagnoses: 0, prescriptions: 0, nextVisits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);
    Promise.all([
      supabase.from("expert_clients").select("id", { count: "exact", head: true }).eq("expert_id", user.id),
      supabase.from("client_visits").select("id", { count: "exact", head: true }).eq("expert_id", user.id).gte("visit_date", startMonth.toISOString().slice(0, 10)),
      supabase.from("crop_diagnoses").select("id", { count: "exact", head: true }).eq("expert_id", user.id),
      supabase.from("expert_prescriptions").select("id", { count: "exact", head: true }).eq("expert_id", user.id),
      supabase.from("client_visits").select("id", { count: "exact", head: true }).eq("expert_id", user.id).gte("next_visit_date", new Date().toISOString().slice(0, 10)),
    ]).then(([a, b, c, d, e]) => {
      setStats({
        clients: a.count ?? 0,
        visitsMonth: b.count ?? 0,
        diagnoses: c.count ?? 0,
        prescriptions: d.count ?? 0,
        nextVisits: e.count ?? 0,
      });
      setLoading(false);
    });
  }, [user]);

  const cards = [
    { label: "Clients suivis", value: stats.clients, icon: Users, color: "text-primary" },
    { label: "Visites ce mois", value: stats.visitsMonth, icon: Calendar, color: "text-accent-foreground" },
    { label: "Visites planifiées", value: stats.nextVisits, icon: Calendar, color: "text-primary" },
    { label: "Diagnostics", value: stats.diagnoses, icon: Microscope, color: "text-accent-foreground" },
    { label: "Ordonnances", value: stats.prescriptions, icon: FileText, color: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" />Statistiques</h1>
        <p className="text-sm text-muted-foreground">Activité expert agronome.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cards.map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="p-4">
                <Icon className={`h-5 w-5 ${c.color} mb-2`} />
                <p className="text-3xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
