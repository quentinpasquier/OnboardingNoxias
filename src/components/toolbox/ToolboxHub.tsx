"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, StopCircle, FileQuestion, Trash2 } from "lucide-react";
import type { Mission } from "@/types/mission";
import type { MissionUpdater } from "@/hooks/use-mission";
import type { Toolbox } from "@/lib/toolbox-schema";
import {
  SECTION_DEFS,
  isSectionDone,
  emptyToolbox,
  expandSectionToJobs,
  missingJobs,
  allJobs,
  jobLabel,
  jobToKey,
  mergeJobResult,
  type Job,
  type SectionKey,
} from "@/lib/toolbox-sections";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button as _ } from "@/components/ui/button";
import { AiThinking } from "@/components/ai/AiThinking";
import { ConfirmButton } from "@/components/ui/confirm-button";

type ProgressState = { done: number; total: number; current: string };

export function ToolboxHub({ mission, update }: { mission: Mission; update: (u: MissionUpdater) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const cancelRef = useRef(false);

  const tb = mission.toolbox;
  const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim()).length;
  const ratio = answered / MATRIX_QUESTIONS.length;
  const lowMatrix = ratio < 0.5;

  const sectionsDone = SECTION_DEFS.filter((s) => isSectionDone(tb, s.key)).length;
  const totalSections = SECTION_DEFS.length;
  const allDone = sectionsDone === totalSections;
  const someDone = sectionsDone > 0;

  async function runJobs(jobs: Job[]) {
    setBusy(true);
    setError(null);
    cancelRef.current = false;
    setProgress({ done: 0, total: jobs.length, current: jobLabel(jobs[0]) });

    let workingTb: Toolbox = tb ? { ...tb } : emptyToolbox();

    try {
      for (let i = 0; i < jobs.length; i++) {
        if (cancelRef.current) {
          setError(`Génération interrompue (${i}/${jobs.length} blocs).`);
          break;
        }
        const job = jobs[i];
        setProgress({ done: i, total: jobs.length, current: jobLabel(job) });

        const res = await fetch("/api/ai/generate-toolbox-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mission: { ...mission, toolbox: workingTb },
            job,
            refineInstructions: instructions.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);

        workingTb = mergeJobResult(workingTb, job, data.data);
        update((prev) => ({ ...prev, toolbox: mergeJobResult(prev.toolbox ?? emptyToolbox(), job, data.data) }));
        setProgress({ done: i + 1, total: jobs.length, current: `${jobLabel(job)} ✓` });
      }
      if (!cancelRef.current) {
        setOpen(false);
        setInstructions("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function startGenerateAll() {
    const jobs = someDone ? missingJobs(tb) : allJobs();
    runJobs(jobs.length > 0 ? jobs : allJobs());
  }

  function startRegenerateAll() {
    runJobs(allJobs());
  }

  function clearAll() {
    update((prev) => ({ ...prev, toolbox: null }));
  }

  const missingCount = missingJobs(tb).length;

  return (
    <div className="space-y-6">
      {!someDone ? (
        <Card className="bg-accent/5 border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Générer la boîte à outils</CardTitle>
            <CardDescription>L'IA construit la boîte en <strong>{allJobs().length} blocs courts</strong> (environ 10–20 s chacun, jamais au-delà de 60 s) : positionnement, personas, arguments, 6 sous-blocs de pitch, 5 familles d'objections, et la matrice de qualification. Aucun chunk ne peut bloquer toute la génération.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowMatrix && (
              <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">Matrice peu remplie ({answered}/{MATRIX_QUESTIONS.length})</p>
                  <p className="text-amber-800">L'IA peut générer mais le résultat sera moins ancré. Idéal : ≥ 20 réponses validées.</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">~ 2–4 min au total selon la richesse du contexte. Coût estimé : 8–18 ¢ avec prompt caching.</p>
              <Button onClick={() => { setOpen(true); setError(null); }} variant="accent" size="lg">
                <Sparkles /> Générer toute la boîte
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Boîte à outils, vue d'ensemble</CardTitle>
                <CardDescription>Édite chaque section indépendamment. Régénère section par section ou bloc par bloc.</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {missingCount > 0 && (
                  <Button onClick={() => { setOpen(true); setError(null); }} variant="accent" size="sm">
                    <Sparkles /> Compléter ({missingCount} blocs)
                  </Button>
                )}
                {allDone && (
                  <Button onClick={startRegenerateAll} variant="outline" size="sm" disabled={busy}>
                    <RefreshCw /> Tout régénérer
                  </Button>
                )}
                {someDone && (
                  <ConfirmButton
                    onConfirm={clearAll}
                    question="Vider toute la boîte ?"
                    confirmLabel="Tout vider"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 /> Tout vider
                  </ConfirmButton>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Avancement</span>
              <span className="font-medium text-foreground">{sectionsDone}/{totalSections} sections</span>
            </div>
            <Progress value={Math.round((sectionsDone / totalSections) * 100)} />
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {SECTION_DEFS.map((sec) => {
          const done = isSectionDone(tb, sec.key);
          const sectionMissing = expandSectionToJobs(sec.key).filter((j) => !done && missingJobs(tb).some((m) => jobToKey(m) === jobToKey(j))).length;
          const Icon = sec.icon;
          return (
            <Link key={sec.key} href={`/missions/${mission.id}/boite-a-outils/${sec.slug}`} className="group">
              <Card className={`h-full transition-all hover:border-accent/50 hover:shadow-md ${done ? "" : "border-dashed"}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-lg bg-accent/10 p-2"><Icon className="h-5 w-5 text-accent" /></div>
                    {done ? (
                      <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Générée</Badge>
                    ) : sectionMissing > 0 && sectionMissing < expandSectionToJobs(sec.key).length ? (
                      <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-900">Partielle</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground"><FileQuestion className="h-3 w-3 mr-1" /> À générer</Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-2 group-hover:text-accent transition-colors">{sec.label}</CardTitle>
                  <CardDescription className="text-xs">{sec.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-xs text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                    Ouvrir l'éditeur <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Génération en blocs</DialogTitle>
            <DialogDescription>
              L'IA produit chaque bloc séparément (10–20 s par bloc). Si un bloc plante, les autres ne sont pas affectés.
            </DialogDescription>
          </DialogHeader>
          {!busy && !progress && (
            <div className="grid gap-2">
              <Label htmlFor="hub-instructions">Instructions optionnelles (s'appliquent à tous les blocs)</Label>
              <Textarea
                id="hub-instructions"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex. ton premium, focus persona dirigeant, accent sur l'objection budget…"
              />
            </div>
          )}
          {progress && busy && (
            <div className="space-y-3">
              <AiThinking label={progress.current} size="md" className="my-2" />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progression</span>
                  <span className="tabular-nums text-muted-foreground">{progress.done}/{progress.total} blocs</span>
                </div>
                <Progress value={Math.round((progress.done / progress.total) * 100)} />
              </div>
              <p className="text-xs text-muted-foreground text-center">Les sections apparaissent en direct au fur et à mesure dans la page.</p>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            {!busy && (
              <DialogClose asChild>
                <Button variant="ghost">Annuler</Button>
              </DialogClose>
            )}
            {busy ? (
              <Button onClick={() => { cancelRef.current = true; }} variant="outline"><StopCircle /> Stopper</Button>
            ) : (
              <Button onClick={startGenerateAll} variant="accent">
                {someDone ? <><Sparkles /> Compléter</> : <><Sparkles /> Lancer la génération</>}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
