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
      atelierTitle="Bibliothèque & contexte client"
      atelierDescription="Documents, site web, notes. Toutes les sources transmises par le client sont consultables ici, et servent à l'IA dans les deux ateliers."
    >
      <ContextPanel mission={mission} update={update} />
    </AtelierShell>
  );
}
