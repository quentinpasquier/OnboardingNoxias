"use client";
import { useEffect } from "react";
import { useMission } from "@/hooks/use-mission";
import { ToolboxHub } from "@/components/toolbox/ToolboxHub";
import { ExportPanel } from "@/components/panels/ExportPanel";
import { AtelierShell, AtelierLoading, AtelierNotFound } from "@/components/AtelierShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { SECTION_DEFS, isSectionDone } from "@/lib/toolbox-sections";

export function AtelierToolbox({ missionId }: { missionId: string }) {
  const { mission, update } = useMission(missionId);

  useEffect(() => {
    if (mission?.clientName) document.title = `Boîte à outils · ${mission.clientName} · Noxias`;
  }, [mission?.clientName]);

  if (mission === undefined) return <AtelierLoading />;
  if (mission === null) return <AtelierNotFound />;

  const sectionsDone = SECTION_DEFS.filter((s) => isSectionDone(mission.toolbox, s.key)).length;
  const allDone = sectionsDone === SECTION_DEFS.length;
  const someDone = sectionsDone > 0;

  return (
    <AtelierShell
      missionId={mission.id}
      clientName={mission.clientName}
      atelierLabel="Atelier 2"
      atelierTitle="Boîte à outils du commercial"
      atelierDescription="Six sections éditables une par une : positionnement, personas, arguments, pitch V1, 30 objections, matrice de qualification."
      rightBadge={
        <Badge variant={allDone ? "accent" : someDone ? "secondary" : "outline"}>
          {allDone ? "Boîte complète" : someDone ? `${sectionsDone}/${SECTION_DEFS.length} sections` : "À générer"}
        </Badge>
      }
    >
      <ToolboxHub mission={mission} update={update} />

      {someDone && (
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
