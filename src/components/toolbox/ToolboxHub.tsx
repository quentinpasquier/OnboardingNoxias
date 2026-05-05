"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { Sparkles, Loader2, RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, StopCircle, FileQuestion } from "lucide-react";
import type { Mission } from "@/types/mission";
import type { MissionUpdater } from "@/hooks/use-mission";
import type { Toolbox } from "@/lib/toolbox-schema";
import { SECTION_DEFS, isSectionDone, emptyToolbox, type SectionKey } from "@/lib/toolbox-sections";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Progress = { done: number; total: number; current: string };

export function ToolboxHub({ mission, update }: { mission: Mission; update: (u: MissionUpdater) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [progress, setProgress] = useState<Progress | null>(null);
  const cancelRef = useRef(false);

  const tb = mission.toolbox;
  const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim()).length;
  const ratio = answered / MATRIX_QUESTIONS.length;
  const lowMatrix = ratio < 0.5;

  const sectionsDone = SECTION_DEFS.filter((s) => isSectionDone(tb, s.key)).length;
  const totalSections = SECTION_DEFS.length;
  const allDone = sectionsDone === totalSections;
  const someDone = sectionsDone > 0;

  const sectionsToGenerate = SECTION_DEFS.filter((s) => !isSectionDone(tb, s.key));

  async function generateAll() {
    setBusy(true);
    setError(null);
    cancelRef.current = false;

    const targets = sectionsToGenerate.length > 0 ? sectionsToGenerate : SECTION_DEFS;
    setProgress({ done: 0, total: targets.length, current: targets[0].label });

    let workingTb: Toolbox = tb ? { ...tb } : emptyToolbox();

    try {
      for (let i = 0; i < targets.length; i++) {
        if (cancelRef.current) {
          setError("Génération interrompue.");
          break;
        }
        const sec = targets[i];
        setProgress({ done: i, total: targets.length, current: sec.label });

        const res = await fetch("/api/ai/generate-toolbox-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mission: { ...mission, toolbox: workingTb },
            section: sec.key,
            refineInstructions: instructions.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);

        workingTb = mergeSection(workingTb, sec.key, data.data);
        update((prev) => ({ ...prev, toolbox: mergeSection(prev.toolbox ?? emptyToolbox(), sec.key, data.data) }));
        setProgress({ done: i + 1, total: targets.length, current: `${sec.label} ✓` });
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

  return (
    <div className="space-y-6">
      {!someDone ? (
        <Card className="bg-accent/5 border-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Générer la boîte à outils</CardTitle>
            <CardDescription>L'IA construit les 6 sections (positionnement, personas, arguments, pitch V1, 30 objections, matrice de qualif) en s'appuyant sur ta matrice et le contexte client. Découpé en blocs courts pour ne jamais timeout.</CardDescription>
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
              <p className="text-xs text-muted-foreground">~ 60–120 s au total. Coût estimé : 5–15 ¢ par génération complète (avec prompt caching).</p>
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
                <CardTitle className="text-base">Boîte à outils — vue d'ensemble</CardTitle>
                <CardDescription>Édite chaque section indépendamment. Tu peux régénérer une section seule ou toutes en une fois.</CardDescription>
              </div>
              <Button onClick={() => { setOpen(true); setError(null); }} variant="outline" size="sm">
                <RefreshCw /> {allDone ? "Tout régénérer" : `Générer les ${sectionsToGenerate.length} sections manquantes`}
              </Button>
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
          const Icon = sec.icon;
          return (
            <Link key={sec.key} href={`/missions/${mission.id}/boite-a-outils/${sec.slug}`} className="group">
              <Card className={`h-full transition-all hover:border-accent/50 hover:shadow-md ${done ? "" : "border-dashed"}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-lg bg-accent/10 p-2"><Icon className="h-5 w-5 text-accent" /></div>
                    {done ? (
                      <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Générée</Badge>
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
              L'IA produit {sectionsToGenerate.length > 0 ? sectionsToGenerate.length : SECTION_DEFS.length} section{(sectionsToGenerate.length || SECTION_DEFS.length) > 1 ? "s" : ""} en autant d'appels courts (10–20 s chacun). Tu peux annuler à tout moment, le travail déjà généré reste.
            </DialogDescription>
          </DialogHeader>
          {!busy && (
            <div className="grid gap-2">
              <Label htmlFor="hub-instructions">Instructions optionnelles</Label>
              <Textarea
                id="hub-instructions"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex. ton premium, focus persona dirigeant, accent sur l'objection budget…"
              />
            </div>
          )}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progress.current}</span>
                <span className="tabular-nums text-muted-foreground">{progress.done}/{progress.total}</span>
              </div>
              <Progress value={Math.round((progress.done / progress.total) * 100)} />
              <p className="text-xs text-muted-foreground">Les sections apparaissent en direct au fur et à mesure.</p>
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
              <Button onClick={generateAll} variant="accent">
                {someDone ? <><RefreshCw /> Régénérer</> : <><Sparkles /> Lancer la génération</>}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function mergeSection(tb: Toolbox, key: SectionKey, data: Record<string, unknown>): Toolbox {
  switch (key) {
    case "positioning":
      return { ...tb, positioning: data as Toolbox["positioning"] };
    case "personas":
      return { ...tb, personas: (data.personas ?? []) as Toolbox["personas"] };
    case "arguments":
      return {
        ...tb,
        disqualified: (data.disqualified ?? "") as string,
        killerArguments: (data.killerArguments ?? []) as Toolbox["killerArguments"],
      };
    case "pitch":
      return { ...tb, pitch: (data.pitch ?? []) as Toolbox["pitch"] };
    case "objections":
      return { ...tb, objections: (data.objections ?? []) as Toolbox["objections"] };
    case "qualification":
      return { ...tb, qualification: (data.qualification ?? { criteria: [], tiers: [] }) as Toolbox["qualification"] };
    default:
      return tb;
  }
}
