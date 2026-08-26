"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Home, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { missionsStore } from "@/lib/supabase/missions-store";
import type { Mission } from "@/types/mission";
import {
  computeProgress, computeTiming, computeHealth,
  HEALTH_LABELS, PACK_SHORT,
  formatDaysRemaining, formatShortDate,
  type HealthStatus,
} from "@/lib/mission-progress";
import { NoxiasIconMark } from "@/components/branding/Logo";

const REFRESH_MS = 60_000;

const HEALTH_ORDER: Record<HealthStatus, number> = {
  overdue: 0, at_risk: 1, behind: 2, on_track: 3, not_scheduled: 4, completed: 5,
};

export function WallView() {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [tick, setTick] = useState(0);

  async function refresh() {
    try {
      const list = await missionsStore.list();
      setMissions(list);
      setLastUpdate(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const enriched = useMemo(() => {
    if (!missions) return null;
    return missions.map((m) => {
      const progress = computeProgress(m);
      const timing = computeTiming(m);
      const health = computeHealth(m, progress, timing);
      return { mission: m, progress, timing, health };
    });
  }, [missions]);

  const active = useMemo(() => {
    if (!enriched) return [];
    return enriched
      .filter((e) => e.mission.status !== "completed")
      .sort((a, b) => {
        const h = HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health];
        if (h !== 0) return h;
        const ar = a.timing.daysRemaining ?? 9999;
        const br = b.timing.daysRemaining ?? 9999;
        return ar - br;
      });
  }, [enriched]);

  const completed = useMemo(() => {
    if (!enriched) return [];
    return enriched.filter((e) => e.mission.status === "completed");
  }, [enriched]);

  const summary = useMemo(() => {
    const overdue = active.filter((e) => e.health === "overdue").length;
    const atRisk = active.filter((e) => e.health === "at_risk").length;
    const behind = active.filter((e) => e.health === "behind").length;
    const onTrack = active.filter((e) => e.health === "on_track").length;
    return { overdue, atRisk, behind, onTrack };
  }, [active]);

  const relativeUpdate = useMemo(() => {
    void tick;
    const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (diff < 30) return "à l'instant";
    if (diff < 90) return "il y a 1 min";
    return `il y a ${Math.floor(diff / 60)} min`;
  }, [lastUpdate, tick]);

  if (missions === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-noxias-ink text-white">
        <div className="flex items-center gap-3 text-lg text-slate-300">
          <Loader2 className="animate-spin h-6 w-6" /> Chargement du mur…
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-noxias-ink text-white flex flex-col">
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <NoxiasIconMark size={44} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent font-bold">▶ NOXIAS · MUR D'AVANCEMENT</p>
            <h1 className="font-display text-2xl font-bold tracking-tight">Onboardings en cours</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <SummaryChip label="En dépassement" value={summary.overdue} tone="red" />
          <SummaryChip label="En risque" value={summary.atRisk} tone="orange" />
          <SummaryChip label="Léger retard" value={summary.behind} tone="amber" />
          <SummaryChip label="Dans les temps" value={summary.onTrack} tone="emerald" />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
          <RefreshCw className="h-3.5 w-3.5" /> Actualisé {relativeUpdate}
          <Link href="/" className="ml-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 hover:border-accent hover:text-accent transition-colors">
            <Home className="h-3.5 w-3.5" /> Retour
          </Link>
        </div>
      </header>

      {error && (
        <div className="px-8 py-3 bg-red-950/70 border-b border-red-500/40 text-red-200 text-sm">
          Erreur : {error}
        </div>
      )}

      <main className="flex-1 px-8 py-6 overflow-y-auto">
        {active.length === 0 && completed.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-lg italic">
            Aucun onboarding pour l'instant.
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-8">
                <SectionHeader
                  label="En cours"
                  count={active.length}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {active.map((e) => (
                    <WallCard key={e.mission.id} {...e} />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <SectionHeader
                  label="Livrés"
                  count={completed.length}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {completed.map((e) => (
                    <WallCardCompact key={e.mission.id} {...e} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-white/10 px-8 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
        <span>▶ Onboarding Noxias</span>
        <span>{active.length} en cours · {completed.length} livré{completed.length > 1 ? "s" : ""}</span>
        <span>Rafraîchissement automatique toutes les {REFRESH_MS / 1000} s</span>
      </footer>
    </div>
  );
}

function SummaryChip({ label, value, tone }: { label: string; value: number; tone: "red" | "orange" | "amber" | "emerald" }) {
  const cls = {
    red: "bg-red-600/15 text-red-300 border-red-500/40",
    orange: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  }[tone];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cls}`}>
      <span className="font-display font-bold text-lg tabular-nums leading-none">{value}</span>
      <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
    </div>
  );
}

function SectionHeader({ label, count, icon }: { label: string; count: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-accent">{icon}</span>
      <h2 className="font-display text-lg font-bold tracking-tight">{label}</h2>
      <span className="text-xs text-slate-400 tabular-nums">· {count}</span>
      <div className="flex-1 h-px bg-white/10 ml-2" />
    </div>
  );
}

type CardData = {
  mission: Mission;
  progress: ReturnType<typeof computeProgress>;
  timing: ReturnType<typeof computeTiming>;
  health: HealthStatus;
};

function WallCard({ mission, progress, timing, health }: CardData) {
  const bg =
    health === "overdue" ? "bg-red-950/40 border-red-500/50" :
    health === "at_risk" ? "bg-orange-950/40 border-orange-500/50" :
    health === "behind" ? "bg-amber-950/30 border-amber-500/40" :
    health === "on_track" ? "bg-emerald-950/30 border-emerald-500/40" :
    "bg-slate-900/60 border-white/10";

  const dot =
    health === "overdue" ? "bg-red-500" :
    health === "at_risk" ? "bg-orange-500" :
    health === "behind" ? "bg-amber-400" :
    health === "on_track" ? "bg-emerald-400" :
    "bg-slate-400";

  const barCls =
    health === "overdue" ? "bg-red-500" :
    health === "at_risk" ? "bg-orange-500" :
    health === "behind" ? "bg-amber-400" :
    health === "on_track" ? "bg-emerald-400" :
    "bg-slate-400";

  return (
    <Link href={`/missions/${mission.id}`} className={`block rounded-xl border p-5 transition-transform hover:scale-[1.02] hover:shadow-2xl ${bg}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2 w-2 rounded-full ${dot} animate-pulse`} />
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{PACK_SHORT[mission.packType ?? "5_rdv"]}</span>
          </div>
          <h3 className="font-display text-xl font-bold leading-tight truncate">{mission.clientName}</h3>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Livraison</p>
          <p className="text-sm font-medium tabular-nums">{formatShortDate(mission.deliveryDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            {timing.overdue ? "Retard" : "Reste"}
          </p>
          <p className={`text-sm font-bold tabular-nums ${
            timing.overdue ? "text-red-300" :
            timing.daysRemaining !== null && timing.daysRemaining <= 3 ? "text-amber-300" :
            "text-white"
          }`}>
            {formatDaysRemaining(timing.daysRemaining)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Avancement</span>
          <span className="font-display text-2xl font-bold tabular-nums leading-none">{progress.weightedPct}<span className="text-sm text-slate-400">%</span></span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full ${barCls} transition-all`} style={{ width: `${progress.weightedPct}%` }} />
        </div>
        {timing.timeProgressPct !== null && (
          <>
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Temps consommé</span>
              <span className="text-xs tabular-nums text-slate-400">{timing.timeProgressPct}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-slate-400/60" style={{ width: `${timing.timeProgressPct}%` }} />
            </div>
          </>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <span>M {progress.matrixValidated}/{progress.matrixTotal}</span>
        <span className="text-slate-600">·</span>
        <span>B {progress.toolboxValidated}/{progress.toolboxTotal}</span>
        <span className="text-slate-600">·</span>
        <span className={`font-bold uppercase tracking-wider ${
          health === "overdue" ? "text-red-300" :
          health === "at_risk" ? "text-orange-300" :
          health === "behind" ? "text-amber-300" :
          health === "on_track" ? "text-emerald-300" :
          "text-slate-400"
        }`}>
          {health === "overdue" && <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />}
          {HEALTH_LABELS[health]}
        </span>
      </div>
    </Link>
  );
}

function WallCardCompact({ mission, progress, timing }: CardData) {
  return (
    <Link href={`/missions/${mission.id}`} className="block rounded-lg border border-emerald-400/20 bg-emerald-950/20 p-3 hover:bg-emerald-950/40 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{PACK_SHORT[mission.packType ?? "5_rdv"]}</p>
      </div>
      <p className="font-medium text-sm truncate mb-1">{mission.clientName}</p>
      <p className="text-[10px] text-slate-500 tabular-nums inline-flex items-center gap-1">
        <Clock className="h-2.5 w-2.5" /> livré · {formatShortDate(mission.deliveryDate)}
      </p>
      <div className="h-1 mt-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-emerald-400" style={{ width: `${progress.weightedPct}%` }} />
      </div>
    </Link>
  );
}
