"use client";
import { useMission } from "@/hooks/use-mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { MatrixPanel } from "@/components/panels/MatrixPanel";
import { ExportPanel } from "@/components/panels/ExportPanel";
import { AtelierShell, AtelierLoading, AtelierNotFound } from "@/components/AtelierShell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export function AtelierMatrice({ missionId }: { missionId: string }) {
  const { mission, update } = useMission(missionId);

  if (mission === undefined) return <AtelierLoading />;
  if (mission === null) return <AtelierNotFound />;

  const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim()).length;
  const drafts = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim() && mission.matrixStatus?.[q.id] === "draft").length;
  const matrixPct = Math.round((answered / MATRIX_QUESTIONS.length) * 100);

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
      atelierDescription="30 questions pour cadrer la cible, les douleurs, la valeur, les canaux et la mesure. Co-construites avec le client."
      rightBadge={rightBadge}
    >
      <MatrixPanel mission={mission} update={update} />

      <Card className="mt-12">
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
