"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Mission } from "@/types/mission";
import { missionsStore } from "@/lib/supabase/missions-store";

export type MissionUpdater = Mission | ((prev: Mission) => Mission);

export function useMission(missionId: string) {
  const [mission, setMission] = useState<Mission | null | undefined>(undefined);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<Mission | null>(null);

  useEffect(() => {
    missionsStore.get(missionId).then(setMission).catch(() => setMission(null));
  }, [missionId]);

  const update = useCallback((updater: MissionUpdater) => {
    setMission((prev) => {
      if (!prev) return prev;
      const next = typeof updater === "function" ? updater(prev) : updater;
      const stamped: Mission = { ...next, updatedAt: new Date().toISOString() };
      pendingSave.current = stamped;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const toSave = pendingSave.current;
        if (!toSave) return;
        try {
          const saved = await missionsStore.update(toSave);
          // Ne pas écraser des modifs faites pendant le vol — on garde
          // l'état le plus récent côté client (updatedAt local).
          setMission((current) => {
            if (!current) return saved;
            if (current.updatedAt > saved.updatedAt) return current;
            return saved;
          });
        } catch (err) {
          console.error("Sauvegarde mission échouée :", err);
        }
      }, 600);

      return stamped;
    });
  }, []);

  return { mission, update };
}
