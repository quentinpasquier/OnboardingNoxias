"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, ListChecks, Sparkles, Layers, CheckCircle2, FileEdit, FileQuestion, RotateCcw, Flag, Pencil, Check, X } from "lucide-react";
import { useMission } from "@/hooks/use-mission";
import { Input } from "@/components/ui/input";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MissionLoadingSkeleton } from "@/components/skeletons/MissionLoadingSkeleton";
import { BonhommeError, BonhommeReady, BonhommePointing } from "@/components/illustrations/Bonhomme";

export function MissionHub({ missionId }: { missionId: string }) {
  const { mission, update } = useMission(missionId);

  useEffect(() => {
    if (mission?.clientName) document.title = `${mission.clientName} · Onboarding Noxias`;
  }, [mission?.clientName]);

  if (mission === undefined) return <MissionLoadingSkeleton />;
  if (mission === null) {
    return (
      <main className="container max-w-md py-20 text-center noxias-page-in">
        <BonhommeError size={140} className="mb-6" />
        <h1 className="font-display text-2xl font-bold mb-2">Onboarding introuvable</h1>
        <p className="text-muted-foreground mb-6">Ce dossier client a peut-être été supprimé, ou tu n'as plus accès.</p>
        <Link href="/"><Button variant="accent"><ArrowLeft /> Retour aux onboardings</Button></Link>
      </main>
    );
  }

  const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim()).length;
  const drafts = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim() && mission.matrixStatus?.[q.id] === "draft").length;
  const validated = answered - drafts;
  const matrixPct = Math.round((answered / MATRIX_QUESTIONS.length) * 100);
  const toolboxReady = !!mission.toolbox;
  const toolboxScopeReady = answered >= Math.ceil(MATRIX_QUESTIONS.length * 0.6);
  const completed = mission.status === "completed";

  function toggleStatus() {
    update((prev) => ({ ...prev, status: prev.status === "completed" ? "in_progress" : "completed" }));
  }

  function renameClient(next: string) {
    const trimmed = next.trim();
    if (!trimmed || trimmed === mission!.clientName) return;
    update((prev) => ({ ...prev, clientName: trimmed }));
  }

  return (
    <main className="container max-w-6xl py-10 noxias-page-in">
      <div className="mb-10">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Tous les onboardings
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <ClientNameEditor value={mission.clientName} onSave={renameClient} />
              <Badge variant={completed ? "success" : "accent"} className="text-xs">
                {completed ? "✓ Terminé" : "● En cours"}
              </Badge>
            </div>
            {mission.clientWebsite && (
              <a href={mission.clientWebsite} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-accent">{mission.clientWebsite}</a>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={toggleStatus}>
            {completed ? <><RotateCcw /> Rouvrir l'onboarding</> : <><Flag /> Marquer comme terminé</>}
          </Button>
        </div>
      </div>

      <section className="mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-accent" /> Contexte client</CardTitle>
                <CardDescription>Documents, site web, notes, ressources utilisées par l'IA dans les deux ateliers.</CardDescription>
              </div>
              <Link href={`/missions/${mission.id}/contexte`}>
                <Button variant="outline" size="sm">
                  {mission.files.length === 0 ? "Ajouter des sources" : "Modifier"} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> <strong className="text-foreground">{mission.files.length}</strong> document{mission.files.length > 1 ? "s" : ""}</span>
              <span><strong className="text-foreground">{mission.notes?.trim() ? "Notes renseignées" : "Aucune note"}</strong></span>
              {mission.clientWebsite && <span><strong className="text-foreground">Site</strong> {mission.clientWebsite}</span>}
            </div>
          </CardContent>
        </Card>
      </section>

      <h2 className="font-display text-xl font-medium mb-4">Ateliers</h2>
      <div className="grid md:grid-cols-2 gap-5">
        <Link href={`/missions/${mission.id}/matrice`} className="group">
          <Card className="h-full overflow-hidden hover:border-accent/50 hover:shadow-noxias-lift hover:-translate-y-0.5 transition-all duration-200">
            <div className="bg-gradient-to-br from-accent/8 via-accent/4 to-transparent border-b border-border/60 px-6 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-card border border-border/70 p-2.5 shadow-noxias-soft"><ListChecks className="h-6 w-6 text-accent" /></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-noxias-muted font-medium">Atelier 1</p>
                    <p className="font-display text-lg font-bold leading-tight group-hover:text-accent transition-colors">Matrice de prospection</p>
                  </div>
                </div>
                <BonhommePointing size={64} />
              </div>
            </div>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">31 questions structurées sur cible, douleurs, valeur, canaux, cas clients. Co-remplies avec le client.</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Progression</span>
                <span className="font-medium text-foreground tabular-nums">{answered}/{MATRIX_QUESTIONS.length}</span>
              </div>
              <Progress value={matrixPct} className="mb-4" />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  {validated > 0 && <><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> {validated} validée{validated > 1 ? "s" : ""}</>}
                  {drafts > 0 && <span className="ml-1 inline-flex items-center gap-1 text-amber-700"><FileEdit className="h-3 w-3" /> {drafts} brouillon{drafts > 1 ? "s" : ""}</span>}
                  {answered === 0 && <><FileQuestion className="h-3.5 w-3.5" /> Aucune réponse</>}
                </span>
                <span className="text-foreground group-hover:text-accent transition-colors flex items-center gap-1 font-medium">Ouvrir <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/missions/${mission.id}/boite-a-outils`} className="group">
          <Card className="h-full overflow-hidden hover:border-accent/50 hover:shadow-noxias-lift hover:-translate-y-0.5 transition-all duration-200">
            <div className="bg-gradient-to-br from-noxias-deep/10 via-accent/4 to-transparent border-b border-border/60 px-6 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-card border border-border/70 p-2.5 shadow-noxias-soft"><Sparkles className="h-6 w-6 text-accent" /></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-noxias-muted font-medium">Atelier 2</p>
                    <p className="font-display text-lg font-bold leading-tight group-hover:text-accent transition-colors">Boîte à outils du commercial</p>
                  </div>
                </div>
                {toolboxReady ? <BonhommeReady size={64} /> : <BonhommePointing size={64} />}
              </div>
            </div>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">Positionnement, personas, argumentaires, pitch ramifié, 30 objections, matrice de qualification.</p>
              {toolboxReady ? (
                <div className="text-sm">
                  <p className="text-noxias-deep font-medium flex items-center gap-1.5 mb-1"><CheckCircle2 className="h-4 w-4 text-accent" /> Boîte à outils générée</p>
                  <p className="text-xs text-muted-foreground">{mission.toolbox?.personas.length} persona{(mission.toolbox?.personas.length ?? 0) > 1 ? "s" : ""} · {mission.toolbox?.objections.length ?? 0} objections · pitch en {mission.toolbox?.pitch.length ?? 0} sections</p>
                </div>
              ) : !toolboxScopeReady ? (
                <p className="text-xs text-muted-foreground">Remplis d'abord la matrice à au moins 60 % pour une boîte cohérente ({Math.round((answered / MATRIX_QUESTIONS.length) * 100)} % pour l'instant).</p>
              ) : (
                <p className="text-xs text-muted-foreground">Prête à être générée à partir de ta matrice.</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                <Badge variant={toolboxReady ? "accent" : "secondary"} className="text-[10px]">{toolboxReady ? "✓ Prête" : "À générer"}</Badge>
                <span className="text-foreground group-hover:text-accent transition-colors flex items-center gap-1 font-medium">Ouvrir <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}

function ClientNameEditor({ value, onSave }: { value: string; onSave: (next: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function start() {
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className="font-display text-3xl font-bold tracking-tight h-auto py-1 max-w-md"
        />
        <Button onClick={commit} variant="accent" size="sm" aria-label="Valider"><Check /></Button>
        <Button onClick={cancel} variant="ghost" size="sm" aria-label="Annuler"><X /></Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="group inline-flex items-baseline gap-2 hover:text-accent transition-colors text-left"
      title="Renommer le client"
    >
      <h1 className="font-display text-4xl font-bold tracking-tight">{value}</h1>
      <Pencil className="h-4 w-4 text-muted-foreground group-hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity self-center" />
    </button>
  );
}
