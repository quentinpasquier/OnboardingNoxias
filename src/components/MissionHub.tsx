"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, ListChecks, Sparkles, Layers, CheckCircle2, FileEdit, FileQuestion } from "lucide-react";
import { useMission } from "@/hooks/use-mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function MissionHub({ missionId }: { missionId: string }) {
  const { mission } = useMission(missionId);

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

  const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim()).length;
  const drafts = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim() && mission.matrixStatus?.[q.id] === "draft").length;
  const validated = answered - drafts;
  const matrixPct = Math.round((answered / MATRIX_QUESTIONS.length) * 100);
  const toolboxReady = !!mission.toolbox;
  const toolboxScopeReady = answered >= Math.ceil(MATRIX_QUESTIONS.length * 0.6);

  return (
    <main className="container max-w-6xl py-10">
      <div className="mb-10">
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Toutes les missions
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{mission.clientName}</h1>
            {mission.clientWebsite && (
              <a href={mission.clientWebsite} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-accent">{mission.clientWebsite}</a>
            )}
          </div>
        </div>
      </div>

      <section className="mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-accent" /> Contexte client</CardTitle>
                <CardDescription>Documents, site web, notes — ressources utilisées par l'IA dans les deux ateliers.</CardDescription>
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
          <Card className="h-full hover:border-accent/50 hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-accent/10 p-2.5"><ListChecks className="h-6 w-6 text-accent" /></div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={answered === MATRIX_QUESTIONS.length ? "accent" : "secondary"}>{answered}/{MATRIX_QUESTIONS.length}</Badge>
                  {drafts > 0 && (
                    <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-900 text-[10px]">
                      <FileEdit className="h-3 w-3 mr-1" /> {drafts} brouillon{drafts > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
              <CardTitle className="text-lg mt-3 group-hover:text-accent transition-colors">Atelier 1 — Matrice de prospection</CardTitle>
              <CardDescription>30 questions structurées sur cible, douleurs, valeur, canaux. Co-rempli avec le client.</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={matrixPct} className="mb-4" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {validated > 0 && <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {validated} validée{validated > 1 ? "s" : ""}</>}
                  {answered === 0 && <><FileQuestion className="h-3.5 w-3.5" /> Aucune réponse</>}
                </span>
                <span className="text-foreground group-hover:text-accent transition-colors flex items-center gap-1">Ouvrir <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/missions/${mission.id}/boite-a-outils`} className={`group ${!toolboxScopeReady ? "" : ""}`}>
          <Card className="h-full hover:border-accent/50 hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-accent/10 p-2.5"><Sparkles className="h-6 w-6 text-accent" /></div>
                <Badge variant={toolboxReady ? "accent" : "secondary"}>{toolboxReady ? "Prête" : "À générer"}</Badge>
              </div>
              <CardTitle className="text-lg mt-3 group-hover:text-accent transition-colors">Atelier 2 — Boîte à outils du commercial</CardTitle>
              <CardDescription>Positionnement, personas, argumentaires, pitch ramifié, 30 objections, matrice de qualification.</CardDescription>
            </CardHeader>
            <CardContent>
              {toolboxReady ? (
                <div className="text-sm text-foreground">
                  <p className="text-emerald-700 font-medium flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Boîte à outils générée</p>
                  <p className="text-xs text-muted-foreground mt-1">{mission.toolbox?.personas.length} persona{(mission.toolbox?.personas.length ?? 0) > 1 ? "s" : ""} · {mission.toolbox?.objections.length ?? 0} objections · pitch en {mission.toolbox?.pitch.length ?? 0} sections</p>
                </div>
              ) : !toolboxScopeReady ? (
                <p className="text-xs text-muted-foreground">Remplis d'abord la matrice à au moins 60% pour une boîte cohérente.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Prête à être générée à partir de ta matrice.</p>
              )}
              <div className="flex items-center justify-end text-xs text-muted-foreground mt-4">
                <span className="text-foreground group-hover:text-accent transition-colors flex items-center gap-1">Ouvrir <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
