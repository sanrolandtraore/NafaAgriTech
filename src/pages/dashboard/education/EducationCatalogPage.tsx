import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Search, Clock, BookOpen, ArrowRight } from "lucide-react";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

type Course = {
  id: string;
  slug: string;
  domain: string;
  category: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  level: string;
  duration_min: number;
  icon: string;
};

const levelLabel: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

const EducationCatalogPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [doneCounts, setDoneCounts] = useState<Record<string, number>>({});
  const [domain, setDomain] = useState("tous");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cRes, lRes, pRes] = await Promise.all([
        db.from("courses").select("*").eq("is_published", true).order("sort_order"),
        db.from("course_lessons").select("id, course_id"),
        user
          ? db.from("course_progress").select("course_id, lesson_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      setCourses((cRes.data as Course[]) || []);

      const lc: Record<string, number> = {};
      (lRes.data || []).forEach((l: any) => { lc[l.course_id] = (lc[l.course_id] || 0) + 1; });
      setLessonCounts(lc);

      const dc: Record<string, number> = {};
      ((pRes as any).data || []).forEach((p: any) => { dc[p.course_id] = (dc[p.course_id] || 0) + 1; });
      setDoneCounts(dc);

      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (domain !== "tous" && c.domain !== domain) return false;
      if (!q) return true;
      return [c.title, c.subtitle, c.summary, c.category].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [courses, domain, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Course[]>();
    filtered.forEach((c) => {
      const list = map.get(c.category) || [];
      list.push(c);
      map.set(c.category, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" /> Centre de formation
        </h1>
        <p className="text-muted-foreground mt-1">
          Cours pratiques sur l'élevage de tous types d'animaux et toutes les cultures agricoles
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={domain} onValueChange={setDomain}>
          <TabsList>
            <TabsTrigger value="tous">Tout</TabsTrigger>
            <TabsTrigger value="elevage">Élevage</TabsTrigger>
            <TabsTrigger value="agriculture">Agriculture</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un cours (maïs, volaille…)"
            className="pl-9"
          />
        </div>
      </div>

      {grouped.length === 0 && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Aucun cours ne correspond à votre recherche.</CardContent></Card>
      )}

      {grouped.map(([category, list]) => (
        <div key={category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{category}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => {
              const total = lessonCounts[c.id] || 0;
              const done = Math.min(doneCounts[c.id] || 0, total);
              const pct = total > 0 ? (done / total) * 100 : 0;
              return (
                <Link key={c.id} to={`/dashboard/education/${c.slug}`} className="group">
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-2xl" aria-hidden>{c.icon}</span>
                        <Badge variant="outline">{levelLabel[c.level] || c.level}</Badge>
                      </div>
                      <CardTitle className="text-base leading-snug">{c.title}</CardTitle>
                      {c.subtitle && <p className="text-xs text-muted-foreground">{c.subtitle}</p>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">{c.summary}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{total} leçons</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{c.duration_min} min</span>
                      </div>
                      {done > 0 && (
                        <div className="space-y-1">
                          <Progress value={pct} className="h-1.5" />
                          <p className="text-[11px] text-muted-foreground">{done}/{total} leçons terminées</p>
                        </div>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        Commencer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EducationCatalogPage;
