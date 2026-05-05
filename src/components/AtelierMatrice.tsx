"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useMission } from "@/hooks/use-mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { MatrixPanel } from "@/components/panels/MatrixPanel";
import { ExportPanel } from "@/components/panels/ExportPanel";
import { AtelierShell, AtelierLoading, AtelierNotFound } from "@/components/AtelierShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

const TOOLBOX_THRESHOLD = 0.6;

export function AtelierMatrice({ missionId }: { missionId: string }) {
  const { mission, update } = useMission(missionId);

  useEffect(() => {
    if (mission?.clientName) document.title = `Matrice — ${mission.clientName} — Noxias`;
  }, [mission?.clientName]);

  if (mission === undefined) return <AtelierLoading />;
  if (mission === null) return <AtelierNotFound />;

  const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim()).length;
  const drafts = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim() && mission.matrixStatus?.[q.id] === "draft").length;
  const validated = answered - drafts;
  const matrixPct = Math.round((answered / MATRIX_QUESTIONS.length) * 100);
  const ratio = answered / MATRIX_QUESTIONS.length;
  const ready = ratio >= TOOLBOX_THRESHOLD && drafts === 0;
  const partial = ratio >= TOOLBOX_THRESHOLD && drafts > 0;
  const hasToolbox = !!mission.toolbox;

  const rightBadge = (
    <div className="flex items-center gap-3">
      <div className="min-w-44">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Progression</span>
          <span className="font-medium text-foreground tabular-nums">{answered}/{MATRIX_QUESTIONS.length}</span>
        </div>
        <Progress value={matrixPct} />
      </div>
      {drafts > 0 && (
        <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-900">
          {drafts} brouillon{drafts > 1 ? "s" : ""} à valider
        </Badge>
      )}
    </div>
  );

  return (
    <AtelierShell
      missionId={mission.id}
      clientName={mission.clientName}
      atelierLabel="Atelier 1"
      atelierTitle="Matrice de prospection"
      atelierDescription="31 questions pour cadrer la cible, les douleurs, la valeur, les canaux, la mesure et les cas clients. Co-construites avec le client."
      rightBadge={rightBadge}
    >
      <MatrixPanel mission={mission} update={update} />

      <NextStepCard
        missionId={mission.id}
        validated={validated}
        drafts={drafts}
        answered={answered}
        ratio={ratio}
        ready={ready}
        partial={partial}
        hasToolbox={hasToolbox}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-accent" /> Export de la matrice</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportPanel mission={mission} scope="matrix" />
        </CardContent>
      </Card>
    </AtelierShell>
  );
}

function NextStepCard({
  missionId,
  validated,
  drafts,
  answered,
  ratio,
  ready,
  partial,
  hasToolbox,
}: {
  missionId: string;
  validated: number;
  drafts: number;
  answered: number;
  ratio: number;
  ready: boolean;
  partial: boolean;
  hasToolbox: boolean;
}) {
  const tooEarly = ratio < TOOLBOX_THRESHOLD;
  const target = `/missions/${missionId}/boite-a-outils`;
  const ctaLabel = hasToolbox ? "Continuer vers l'Atelier 2" : "Lancer l'Atelier 2 — Boîte à outils";

  if (tooEarly) {
    return (
      <Card className="mt-12 border-dashed">
        <CardContent className="py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-base font-medium">Atelier 2 — Boîte à outils</p>
            <p className="text-sm text-muted-foreground mt-1">
              Remplis au moins {Math.ceil(MATRIX_QUESTIONS.length * TOOLBOX_THRESHOLD)} questions sur {MATRIX_QUESTIONS.length} pour générer une boîte à outils cohérente. ({answered}/{MATRIX_QUESTIONS.length} pour l'instant.)
            </p>
          </div>
          <Link href={target}>
            <Button variant="outline" size="sm">Voir l'Atelier 2</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-12 bg-accent/5 border-accent/30">
      <CardContent className="py-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-accent/15 p-2 mt-0.5">
            {ready
              ? <CheckCircle2 className="h-5 w-5 text-accent" />
              : <Sparkles className="h-5 w-5 text-accent" />}
          </div>
          <div>
            <p className="font-display text-base font-medium">
              {ready ? "Matrice prête. Passe à l'Atelier 2." : "Tu peux passer à l'Atelier 2"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {ready ? (
                <>Toutes tes réponses sont validées. L'IA peut maintenant générer la boîte à outils du commercial.</>
              ) : partial ? (
                <>{validated} validée{validated > 1 ? "s" : ""}, {drafts} en brouillon. Tu peux générer la boîte dès maintenant — l'IA s'appuiera sur les brouillons aussi.</>
              ) : null}
            </p>
          </div>
        </div>
        <Link href={target}>
          <Button variant="accent" size="lg">
            {ctaLabel} <ArrowRight />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
