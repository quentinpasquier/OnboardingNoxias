"use client";
import { useMission } from "@/hooks/use-mission";
import { ToolboxPanel } from "@/components/panels/ToolboxPanel";
import { ExportPanel } from "@/components/panels/ExportPanel";
import { AtelierShell, AtelierLoading, AtelierNotFound } from "@/components/AtelierShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export function AtelierToolbox({ missionId }: { missionId: string }) {
  const { mission, update } = useMission(missionId);

  if (mission === undefined) return <AtelierLoading />;
  if (mission === null) return <AtelierNotFound />;

  const ready = !!mission.toolbox;

  return (
    <AtelierShell
      missionId={mission.id}
      clientName={mission.clientName}
      atelierLabel="Atelier 2"
      atelierTitle="Boîte à outils du commercial"
      atelierDescription="Positionnement, personas, argumentaires, pitch ramifié, traitement des 30 objections, matrice de qualification."
      rightBadge={<Badge variant={ready ? "accent" : "secondary"}>{ready ? "Boîte à outils prête" : "Boîte à générer"}</Badge>}
    >
      <ToolboxPanel mission={mission} update={update} />

      {ready && (
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-accent" /> Export de la boîte à outils</CardTitle>
          </CardHeader>
          <CardContent>
            <ExportPanel mission={mission} scope="toolbox" />
          </CardContent>
        </Card>
      )}
    </AtelierShell>
  );
}
