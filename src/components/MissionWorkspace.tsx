"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ListChecks, Sparkles, Download } from "lucide-react";
import { missionsStore } from "@/lib/supabase/missions-store";
import type { Mission } from "@/types/mission";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { ContextPanel } from "@/components/panels/ContextPanel";
import { MatrixPanel } from "@/components/panels/MatrixPanel";
import { ToolboxPanel } from "@/components/panels/ToolboxPanel";
import { ExportPanel } from "@/components/panels/ExportPanel";

export function MissionWorkspace({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<Mission | null | undefined>(undefined);
  const [tab, setTab] = useState("context");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    missionsStore.get(missionId).then(setMission).catch(() => setMission(null));
  }, [missionId]);

  // Optimistic local update + debounced server save
  const update = useCallback((next: Mission) => {
    setMission({ ...next, updatedAt: new Date().toISOString() });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const saved = await missionsStore.update(next);
        setMission(saved);
      } catch (err) {
        console.error("Sauvegarde mission échouée :", err);
      }
    }, 600);
  }, []);

  if (mission === undefined) {
    return <main className="container py-12"><p className="text-muted-foreground">Chargement…</p></main>;
  }
  if (mission === null) {
    return (
      <main className="container py-12">
        <p className="text-muted-foreground mb-4">Mission introuvable.</p>
        <Link href="/"><Button variant="outline"><ArrowLeft /> Retour aux missions</Button></Link>
      </main>
    );
  }

  const answered = Object.values(mission.matrix).filter((v) => v && v.trim().length > 0).length;
  const drafts = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim() && mission.matrixStatus?.[q.id] === "draft").length;
  const matrixPct = Math.round((answered / MATRIX_QUESTIONS.length) * 100);
  const toolboxReady = !!mission.toolbox;

  return (
    <main className="container max-w-7xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> Toutes les missions
          </Link>
          <h1 className="font-display text-3xl font-medium tracking-tight">{mission.clientName}</h1>
          {mission.clientWebsite && (
            <a href={mission.clientWebsite} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-accent">{mission.clientWebsite}</a>
          )}
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="min-w-44">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Matrice</span>
              <span className="font-medium text-foreground">{answered}/{MATRIX_QUESTIONS.length}</span>
            </div>
            <Progress value={matrixPct} />
          </div>
          <Badge variant={toolboxReady ? "accent" : "secondary"}>{toolboxReady ? "Boîte à outils prête" : "Boîte à générer"}</Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/60">
          <TabsTrigger value="context"><FileText className="h-4 w-4 mr-1.5" /> Contexte</TabsTrigger>
          <TabsTrigger value="matrix">
            <ListChecks className="h-4 w-4 mr-1.5" /> Matrice ({answered}/{MATRIX_QUESTIONS.length})
            {drafts > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-amber-200 text-amber-900 text-xs font-medium px-1.5">{drafts}</span>}
          </TabsTrigger>
          <TabsTrigger value="toolbox"><Sparkles className="h-4 w-4 mr-1.5" /> Boîte à outils</TabsTrigger>
          <TabsTrigger value="export"><Download className="h-4 w-4 mr-1.5" /> Export</TabsTrigger>
        </TabsList>

        <TabsContent value="context"><ContextPanel mission={mission} update={update} /></TabsContent>
        <TabsContent value="matrix"><MatrixPanel mission={mission} update={update} /></TabsContent>
        <TabsContent value="toolbox"><ToolboxPanel mission={mission} update={update} /></TabsContent>
        <TabsContent value="export"><ExportPanel mission={mission} /></TabsContent>
      </Tabs>
    </main>
  );
}
