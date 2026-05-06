"use client";
import { useMission } from "@/hooks/use-mission";
import { ContextPanel } from "@/components/panels/ContextPanel";
import { AtelierShell, AtelierLoading, AtelierNotFound } from "@/components/AtelierShell";

export function AtelierContexte({ missionId }: { missionId: string }) {
  const { mission, update } = useMission(missionId);

  if (mission === undefined) return <AtelierLoading />;
  if (mission === null) return <AtelierNotFound />;

  return (
    <AtelierShell
      missionId={mission.id}
      clientName={mission.clientName}
      atelierLabel="Préparation"
      atelierTitle="Contexte client"
      atelierDescription="Documents, site web, notes, sources sur lesquelles l'IA s'appuie pour proposer des réponses cohérentes dans les deux ateliers."
    >
      <ContextPanel mission={mission} update={update} />
    </AtelierShell>
  );
}
