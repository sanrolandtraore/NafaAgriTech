import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import BackNavigationButton from "@/components/BackNavigationButton";
import { CheckCircle2, Circle, Clock, GraduationCap, Lightbulb } from "lucide-react";

import { isValidUuid, isMissingTableError, isInvalidUuidError } from "@/hooks/useOfflineData";

// Les tables metier ne figurent pas dans les types Supabase generes (src/integrations/supabase/types.ts) :
// on passe par une vue non typee du client pour ces requetes.
const db = supabase as unknown as SupabaseClient;

type Course = {
  id: string; slug: string; title: string; subtitle: string | null; summary: string | null;
  level: string; duration_min: number; icon: string; domain: string; category: string;
};
type Lesson = {
  id: string; position: number; title: string; content: string;
  key_points: string[]; duration_min: number;
};

const CourseDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data: c } = await db.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (!c) { setLoading(false); return; }
      setCourse(c as Course);

      const [lRes] = await Promise.all([
        db.from("course_lessons").select("*").eq("course_id", c.id).order("position"),
      ]);

      const ls = (lRes.data as Lesson[]) || [];
      setLessons(ls);

      let remoteDone: string[] = [];
      if (user && isValidUuid(user.id)) {
        try {
          const { data, error } = await db
            .from("course_progress")
            .select("lesson_id")
            .eq("user_id", user.id)
            .eq("course_id", c.id);
          if (error && !isMissingTableError(error) && !isInvalidUuidError(error)) {
            console.warn("course_progress load:", error);
          }
          if (data) {
            remoteDone = data.map((p: any) => p.lesson_id);
          }
        } catch (e) {
          console.warn("course_progress error:", e);
        }
      }

      const localKey = `nafa_course_done_${c.id}_${user?.id || "guest"}`;
      const savedLocal = JSON.parse(localStorage.getItem(localKey) || "[]");
      const combinedDone = Array.from(new Set([...remoteDone, ...savedLocal]));
      setDoneIds(combinedDone);

      setActiveId(ls[0]?.id ?? null);
      setLoading(false);
    };
    load();
  }, [slug, user]);

  const active = lessons.find((l) => l.id === activeId) || null;
  const done = doneIds.filter((id) => lessons.some((l) => l.id === id));
  const pct = lessons.length ? (done.length / lessons.length) * 100 : 0;

  const toggleDone = async (lesson: Lesson) => {
    if (!user || !course) { toast.error("Connectez-vous pour suivre votre progression"); return; }
    setSaving(true);
    const isDone = doneIds.includes(lesson.id);
    const newDoneIds = isDone ? doneIds.filter((id) => id !== lesson.id) : [...doneIds, lesson.id];
    setDoneIds(newDoneIds);

    const localKey = `nafa_course_done_${course.id}_${user.id}`;
    localStorage.setItem(localKey, JSON.stringify(newDoneIds));

    if (isValidUuid(user.id)) {
      try {
        if (isDone) {
          const { error } = await db
            .from("course_progress")
            .delete()
            .eq("user_id", user.id)
            .eq("lesson_id", lesson.id);
          if (error && !isMissingTableError(error) && !isInvalidUuidError(error)) {
            console.warn("delete progress error:", error);
          }
        } else {
          const { error } = await db.from("course_progress").insert({
            user_id: user.id, course_id: course.id, lesson_id: lesson.id,
          });
          if (error && !isMissingTableError(error) && !isInvalidUuidError(error)) {
            console.warn("insert progress error:", error);
          }
        }
      } catch (err: any) {
        console.warn("progress sync error:", err);
      }
    }

    if (!isDone) {
      const next = lessons.find((l) => l.position > lesson.position);
      if (next) setActiveId(next.id);
      toast.success("Leçon terminée !");
    }
    setSaving(false);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  if (!course) {
    return (
      <Card><CardContent className="py-10 text-center space-y-3">
        <p className="text-muted-foreground">Cours introuvable.</p>
        <Button asChild variant="outline"><Link to="/dashboard/education">Retour au catalogue</Link></Button>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BackNavigationButton fallbackTo="/dashboard/education" label="Catalogue des formations" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <span aria-hidden>{course.icon}</span>{course.title}
          </h1>
          {course.subtitle && <p className="text-muted-foreground mt-1">{course.subtitle}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">{course.category}</Badge>
            <Badge variant="secondary" className="capitalize">{course.domain}</Badge>
            <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{course.duration_min} min</span>
          </div>
        </div>
        <Card className="w-full sm:w-56">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4 text-primary" />Progression</span>
              <span className="font-semibold">{Math.round(pct)}%</span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-[11px] text-muted-foreground">{done.length}/{lessons.length} leçons</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-2"><CardTitle className="text-base">Leçons</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {lessons.map((l) => {
              const isDone = doneIds.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => setActiveId(l.id)}
                  className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    l.id === activeId ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  }`}
                >
                  {isDone
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="flex-1">
                    <span className="block leading-snug">{l.position}. {l.title}</span>
                    <span className="text-[11px] text-muted-foreground">{l.duration_min} min</span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {active ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{active.position}. {active.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 text-sm leading-relaxed">
                {active.content.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
              </div>

              {active.key_points?.length > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Lightbulb className="h-4 w-4 text-primary" />À retenir
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {active.key_points.map((k, i) => <li key={i}>• {k}</li>)}
                  </ul>
                </div>
              )}

              <Button onClick={() => toggleDone(active)} disabled={saving} variant={doneIds.includes(active.id) ? "outline" : "default"}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {doneIds.includes(active.id) ? "Marquer comme non terminée" : "Marquer comme terminée"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Contenu bientôt disponible.</CardContent></Card>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
