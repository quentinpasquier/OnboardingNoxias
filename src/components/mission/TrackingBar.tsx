"use client";
import { useState } from "react";
import { Calendar, Package, Pencil, Check, X } from "lucide-react";
import type { Mission, PackType } from "@/types/mission";
import type { MissionUpdater } from "@/hooks/use-mission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  computeProgress, computeTiming, computeHealth,
  HEALTH_LABELS, PACK_LABELS, PACK_SHORT,
  formatDaysRemaining, formatShortDate,
} from "@/lib/mission-progress";

const PACK_OPTIONS: { value: PackType; label: string; days: number }[] = [
  { value: "5_rdv", label: "Pack 5 RDV", days: 14 },
  { value: "10_rdv", label: "Pack 10 RDV", days: 14 },
  { value: "custom", label: "Sur-mesure", days: 14 },
];

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function TrackingBar({ mission, update }: { mission: Mission; update: (u: MissionUpdater) => void }) {
  const [editing, setEditing] = useState(false);
  const [pack, setPack] = useState<PackType>(mission.packType ?? "5_rdv");
  const [start, setStart] = useState(mission.startDate ?? new Date().toISOString().slice(0, 10));
  const [delivery, setDelivery] = useState(mission.deliveryDate ?? addDays(new Date().toISOString().slice(0, 10), 14));

  const progress = computeProgress(mission);
  const timing = computeTiming(mission);
  const health = computeHealth(mission, progress, timing);

  const healthClass =
    health === "on_track" ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
    health === "behind" ? "bg-amber-50 text-amber-900 border-amber-300" :
    health === "at_risk" ? "bg-orange-50 text-orange-900 border-orange-300" :
    health === "overdue" ? "bg-red-50 text-red-900 border-red-300" :
    health === "completed" ? "bg-emerald-100 text-emerald-900 border-emerald-400" :
    "bg-slate-50 text-slate-700 border-slate-300";

  function commit() {
    update((prev) => ({
      ...prev,
      packType: pack,
      startDate: start,
      deliveryDate: delivery,
    }));
    setEditing(false);
  }

  function cancel() {
    setPack(mission.packType ?? "5_rdv");
    setStart(mission.startDate ?? new Date().toISOString().slice(0, 10));
    setDelivery(mission.deliveryDate ?? addDays(new Date().toISOString().slice(0, 10), 14));
    setEditing(false);
  }

  const currentPackLabel = PACK_LABELS[mission.packType ?? "5_rdv"];

  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-accent" /> Suivi de la mission
            </CardTitle>
            <CardDescription>
              {currentPackLabel} · démarrée le {formatShortDate(mission.startDate)} · à livrer le {formatShortDate(mission.deliveryDate)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${healthClass}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {HEALTH_LABELS[health]}
            </span>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil /> Modifier
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="pack-type">Type de pack</Label>
              <select
                id="pack-type"
                className="h-10 rounded-xl border border-input bg-card px-3 text-sm shadow-noxias-soft focus-visible:outline-none focus-visible:border-accent/60 focus-visible:ring-4 focus-visible:ring-accent/15"
                value={pack}
                onChange={(e) => setPack(e.target.value as PackType)}
              >
                {PACK_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-date">Date de démarrage</Label>
              <Input
                id="start-date"
                type="date"
                value={start}
                onChange={(e) => {
                  const v = e.target.value;
                  setStart(v);
                  if (v && delivery && new Date(v) > new Date(delivery)) {
                    setDelivery(addDays(v, 14));
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="delivery-date">Date de livraison</Label>
              <Input
                id="delivery-date"
                type="date"
                value={delivery}
                min={start}
                onChange={(e) => setDelivery(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Par défaut, la livraison est à J+14 (2 semaines). Modifie selon la réalité négociée avec le client.
              </p>
              <div className="flex gap-2">
                <Button onClick={cancel} variant="ghost" size="sm"><X /> Annuler</Button>
                <Button onClick={commit} variant="accent" size="sm"><Check /> Enregistrer</Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <Metric
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Temps écoulé"
                value={timing.totalDays !== null && timing.daysElapsed !== null ? `${timing.daysElapsed} / ${timing.totalDays} j` : "—"}
              />
              <Metric
                icon={null}
                label="Reste"
                value={formatDaysRemaining(timing.daysRemaining)}
                accent={timing.overdue ? "text-red-700" : timing.daysRemaining !== null && timing.daysRemaining <= 3 ? "text-amber-700" : ""}
              />
              <Metric
                icon={null}
                label="Avancement"
                value={`${progress.weightedPct}%`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Avancement du livrable</span>
                <span className="tabular-nums font-medium text-foreground">{progress.weightedPct}%</span>
              </div>
              <Progress value={progress.weightedPct} className="h-2" />
              {timing.timeProgressPct !== null && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Temps consommé</span>
                    <span className="tabular-nums font-medium text-foreground">{timing.timeProgressPct}%</span>
                  </div>
                  <Progress value={timing.timeProgressPct} className="h-2 [&>[data-slot=progress-indicator]]:bg-noxias-deep/70" />
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <Badge variant="secondary" className="text-[10px]">{PACK_SHORT[mission.packType ?? "5_rdv"]}</Badge>
              <span className="text-muted-foreground">Matrice : <strong className="text-foreground">{progress.matrixValidated}/{progress.matrixTotal}</strong> validées</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">Boîte : <strong className="text-foreground">{progress.toolboxValidated}/{progress.toolboxTotal}</strong> validées</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value, accent = "" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium inline-flex items-center gap-1">{icon}{label}</p>
      <p className={`font-display text-lg font-bold ${accent}`}>{value}</p>
    </div>
  );
}
