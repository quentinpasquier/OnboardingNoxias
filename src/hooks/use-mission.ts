"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Mission } from "@/types/mission";
import { missionsStore } from "@/lib/supabase/missions-store";

export function useMission(missionId: string) {
  const [mission, setMission] = useState<Mission | null | undefined>(undefined);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    missionsStore.get(missionId).then(setMission).catch(() => setMission(null));
  }, [missionId]);

  const update = useCallback((next: Mission) => {
    setMission({ ...next, updatedAt: new Date().toISOString() });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const saved = await missionsStore.update(next);
        setMission(saved);
      } catch (err) {
        console.error("Sauvegarde mission échouée :", err);
      }
    }, 600);
  }, []);

  return { mission, update };
}
