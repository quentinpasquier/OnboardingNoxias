"use client";
/**
 * V1 storage layer — localStorage. Une seule console collaborateur,
 * plusieurs missions client. Migration vers Supabase documentée dans le README.
 */
import type { Mission } from "@/types/mission";

const KEY = "noxias.missions.v1";

function read(): Mission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Mission[]) : [];
  } catch {
    return [];
  }
}

function write(missions: Mission[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(missions));
}

export const storage = {
  list(): Mission[] {
    return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get(id: string): Mission | null {
    return read().find((m) => m.id === id) ?? null;
  },
  upsert(mission: Mission) {
    const all = read();
    const idx = all.findIndex((m) => m.id === mission.id);
    const next = { ...mission, updatedAt: new Date().toISOString() };
    if (idx >= 0) all[idx] = next;
    else all.push(next);
    write(all);
    return next;
  },
  remove(id: string) {
    write(read().filter((m) => m.id !== id));
  },
};
