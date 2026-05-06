"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Sparkles, StopCircle, Plus, Trash2 } from "lucide-react";
import { BonhommeEmpty } from "@/components/illustrations/Bonhomme";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMission } from "@/hooks/use-mission";
import type { Toolbox } from "@/lib/toolbox-schema";
import {
  SECTION_DEFS,
  isSectionDone,
  isJobDone,
  emptyToolbox,
  expandSectionToJobs,
  jobLabel,
  mergeJobResult,
  clearJobInToolbox,
  clearSectionInToolbox,
  PITCH_SECTION_LABELS,
  OBJECTION_CATEGORY_LABELS,
  type SectionKey,
  type Job,
  type PitchId,
  type ObjectionCode,
} from "@/lib/toolbox-sections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AtelierLoading, AtelierNotFound } from "@/components/AtelierShell";
import { AiThinking } from "@/components/ai/AiThinking";
import {
  PositioningEditor,
  PersonasEditor,
  ArgumentsEditor,
  ObjectionsListEditor,
  QualificationEditor,
} from "@/components/toolbox/editors";
import { ValidationToggle } from "@/components/toolbox/ValidationToggle";
import { ValidationKey } from "@/lib/validation-keys";

export function SectionEditorView({ missionId, sectionKey }: { missionId: string; sectionKey: SectionKey }) {
  const { mission, update } = useMission(missionId);
  const def = SECTION_DEFS.find((s) => s.key === sectionKey);

  useEffect(() => {
    if (mission?.clientName && def) document.title = `${def.label} · ${mission.clientName} · Noxias`;
  }, [mission?.clientName, def]);

  if (mission === undefined) return <AtelierLoading />;
  if (mission === null || !def) return <AtelierNotFound />;

  const tb = mission.toolbox ?? emptyToolbox();
  const sectionFullyDone = isSectionDone(tb, sectionKey);
  const jobs = expandSectionToJobs(sectionKey);
  const anyJobDone = jobs.some((j) => isJobDone(tb, j));

  function patchToolbox(next: Partial<Toolbox>) {
    update((prev) => ({ ...prev, toolbox: { ...(prev.toolbox ?? emptyToolbox()), ...next } }));
  }

  return (
    <main className="container max-w-6xl py-10">
      <div className="mb-8">
        <Link href={`/missions/${mission.id}/boite-a-outils`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Boîte à outils, {mission.clientName}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl font-bold tracking-tight">{def.label}</h1>
            {sectionFullyDone ? (
              <Badge variant="success">Section générée</Badge>
            ) : anyJobDone ? (
              <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-900">Partielle</Badge>
            ) : (
              <Badge variant="outline">À générer</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {anyJobDone && sectionKey !== "personas" && sectionKey !== "pitch" && sectionKey !== "objections" && (
              <ValidationToggle
                mission={mission}
                update={update}
                validationKey={
                  sectionKey === "positioning" ? ValidationKey.positioning() :
                  sectionKey === "arguments" ? ValidationKey.arguments_() :
                  ValidationKey.qualification()
                }
                label="Valider cette section"
              />
            )}
            {anyJobDone && (
              <ConfirmButton
                onConfirm={() => update((prev) => ({ ...prev, toolbox: clearSectionInToolbox(prev.toolbox, sectionKey) }))}
                question="Vider cette section ?"
                confirmLabel="Vider"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 /> Vider cette section
              </ConfirmButton>
            )}
            <RegenerateAllInSection mission={mission} sectionKey={sectionKey} update={update} />
          </div>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">{def.description}</p>
      </div>

      {/* Pour pitch et objections : on affiche TOUJOURS les sous-blocs (même non générés)
          pour permettre la régénération individuelle ou la saisie manuelle.
          Pour les autres sections : un placeholder s'affiche si rien n'est généré. */}
      {(sectionKey === "pitch" || sectionKey === "objections") || anyJobDone ? (
        <SectionContent
          sectionKey={sectionKey}
          mission={mission}
          patch={patchToolbox}
          update={update}
        />
      ) : (
        <EmptySectionPlaceholder mission={mission} sectionKey={sectionKey} update={update} />
      )}
    </main>
  );
}

function EmptySectionPlaceholder({
  mission,
  sectionKey,
  update,
}: {
  mission: NonNullable<ReturnType<typeof useMission>["mission"]>;
  sectionKey: SectionKey;
  update: ReturnType<typeof useMission>["update"];
}) {
  return (
    <Card className="border-dashed border-2 bg-secondary/30">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <BonhommeEmpty size={120} className="mb-5" />
        <h3 className="font-display text-xl font-bold mb-2">Section non générée</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Lance la génération via l'IA, ou ajoute le contenu manuellement quand l'éditeur sera ouvert.
        </p>
        <RegenerateAllInSection mission={mission} sectionKey={sectionKey} update={update} variant="accent" />
      </CardContent>
    </Card>
  );
}

function SectionContent({
  sectionKey,
  mission,
  patch,
  update,
}: {
  sectionKey: SectionKey;
  mission: NonNullable<ReturnType<typeof useMission>["mission"]>;
  patch: (next: Partial<Toolbox>) => void;
  update: ReturnType<typeof useMission>["update"];
}) {
  const tb = mission.toolbox ?? emptyToolbox();

  switch (sectionKey) {
    case "positioning":
      return <PositioningEditor value={tb.positioning} onChange={(v) => patch({ positioning: v })} />;

    case "personas":
      return (
        <PersonasEditor
          value={tb.personas}
          onChange={(v) => patch({ personas: v })}
          validationSlot={(i) => (
            <ValidationToggle
              mission={mission}
              update={update}
              validationKey={ValidationKey.persona(i)}
              label="Valider"
            />
          )}
        />
      );

    case "arguments":
      return (
        <ArgumentsEditor
          disqualified={tb.disqualified}
          killerArguments={tb.killerArguments}
          setDisqualified={(s) => patch({ disqualified: s })}
          setKillerArguments={(v) => patch({ killerArguments: v })}
        />
      );

    case "qualification":
      return <QualificationEditor value={tb.qualification} onChange={(v) => patch({ qualification: v })} />;

    case "pitch":
      return <PitchPerSubsection mission={mission} update={update} />;

    case "objections":
      return <ObjectionsPerCategory mission={mission} update={update} />;
  }
}

// -----------------------------------------------------------------------------
// Pitch, chaque sous-section avec ses scripts éditables + boutons IA et manuel
// -----------------------------------------------------------------------------
function PitchPerSubsection({
  mission,
  update,
}: {
  mission: NonNullable<ReturnType<typeof useMission>["mission"]>;
  update: ReturnType<typeof useMission>["update"];
}) {
  const tb = mission.toolbox ?? emptyToolbox();
  const ids: PitchId[] = ["1.0", "1.1", "2.0", "3.0", "4.0", "5.0"];

  function addScript(id: PitchId) {
    update((prev) => {
      const tb = prev.toolbox ?? emptyToolbox();
      const existing = tb.pitch.find((p) => p.id === id);
      const updatedSection = existing
        ? { ...existing, scripts: [...existing.scripts, { variant: "Variante (à compléter)", text: "" }] }
        : { id, label: PITCH_SECTION_LABELS[id], scripts: [{ variant: "Variante (à compléter)", text: "" }] };
      const others = tb.pitch.filter((p) => p.id !== id);
      return { ...prev, toolbox: { ...tb, pitch: [...others, updatedSection].sort((a, b) => a.id.localeCompare(b.id)) } };
    });
  }

  function removeScript(id: PitchId, idx: number) {
    update((prev) => {
      const tb = prev.toolbox ?? emptyToolbox();
      const existing = tb.pitch.find((p) => p.id === id);
      if (!existing) return prev;
      const updated = { ...existing, scripts: existing.scripts.filter((_, i) => i !== idx) };
      return { ...prev, toolbox: { ...tb, pitch: tb.pitch.map((p) => p.id === id ? updated : p) } };
    });
  }

  return (
    <div className="space-y-5">
      {ids.map((id) => {
        const section = tb.pitch.find((p) => p.id === id);
        const job: Job = { type: "pitch_section", id };
        const hasContent = !!section && section.scripts.length > 0;
        return (
          <Card key={id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="accent">{id}</Badge>
                  <CardTitle className="text-base">{PITCH_SECTION_LABELS[id]}</CardTitle>
                  {hasContent && <span className="text-xs text-muted-foreground">· {section!.scripts.length} script{section!.scripts.length > 1 ? "s" : ""}</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {hasContent && (
                    <ValidationToggle
                      mission={mission}
                      update={update}
                      validationKey={ValidationKey.pitch(id)}
                    />
                  )}
                  {hasContent && (
                    <ConfirmButton
                      onConfirm={() => update((prev) => ({ ...prev, toolbox: clearJobInToolbox(prev.toolbox, job) }))}
                      question="Vider ce bloc ?"
                      confirmLabel="Vider"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 /> Vider
                    </ConfirmButton>
                  )}
                  <RegenerateJobButton mission={mission} job={job} update={update} compact />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasContent ? (
                <div className="space-y-3">
                  {section!.scripts.map((s, i) => (
                    <div key={i} className="border-l-2 border-accent/30 pl-4 space-y-2 group/script relative">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          className="text-xs uppercase tracking-wider text-accent w-full bg-transparent focus:outline-none font-medium"
                          value={s.variant}
                          onChange={(e) => {
                            const updated = { ...section!, scripts: section!.scripts.map((sc, idx) => idx === i ? { ...sc, variant: e.target.value } : sc) };
                            update((prev) => ({
                              ...prev,
                              toolbox: {
                                ...(prev.toolbox ?? emptyToolbox()),
                                pitch: (prev.toolbox?.pitch ?? []).map((p) => p.id === id ? updated : p),
                              },
                            }));
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScript(id, i)}
                          className="opacity-0 group-hover/script:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 h-7 w-7 p-0"
                          aria-label="Supprimer ce script"
                        >
                          ×
                        </Button>
                      </div>
                      <textarea
                        rows={5}
                        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={s.text}
                        onChange={(e) => {
                          const updated = { ...section!, scripts: section!.scripts.map((sc, idx) => idx === i ? { ...sc, text: e.target.value } : sc) };
                          update((prev) => ({
                            ...prev,
                            toolbox: {
                              ...(prev.toolbox ?? emptyToolbox()),
                              pitch: (prev.toolbox?.pitch ?? []).map((p) => p.id === id ? updated : p),
                            },
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic mb-3">Aucun script pour ce bloc. Régénère via l'IA ou ajoute un script manuellement.</p>
              )}
              <Button onClick={() => addScript(id)} variant="outline" size="sm" className="border-dashed mt-3">
                <Plus /> Ajouter un script manuellement
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Objections, chaque famille avec ses 6 objections éditables + boutons IA et manuel
// -----------------------------------------------------------------------------
function ObjectionsPerCategory({
  mission,
  update,
}: {
  mission: NonNullable<ReturnType<typeof useMission>["mission"]>;
  update: ReturnType<typeof useMission>["update"];
}) {
  const tb = mission.toolbox ?? emptyToolbox();
  const codes: ObjectionCode[] = ["A", "B", "C", "D", "E"];

  function addObjectionToCategory(code: ObjectionCode) {
    update((prev) => {
      const tb = prev.toolbox ?? emptyToolbox();
      const itemsInCat = tb.objections.filter((o) => o.category === code);
      const maxId = tb.objections.reduce((m, o) => Math.max(m, o.id), 0);
      const startId = ({ A: 1, B: 7, C: 13, D: 19, E: 25 } as Record<ObjectionCode, number>)[code];
      // Si la famille est vide, on commence à son startId. Sinon on prend le max + 1 (peut sortir de la plage idéale, c'est OK).
      const newId = itemsInCat.length === 0 ? startId : Math.max(maxId + 1, itemsInCat.reduce((m, o) => Math.max(m, o.id), 0) + 1);
      return {
        ...prev,
        toolbox: {
          ...tb,
          objections: [
            ...tb.objections,
            { id: newId, category: code, text: "(nouvelle objection)", response: "" },
          ].sort((a, b) => a.id - b.id),
        },
      };
    });
  }

  function setItemsForCategory(code: ObjectionCode, next: typeof tb.objections) {
    update((prev) => {
      const tb = prev.toolbox ?? emptyToolbox();
      const others = tb.objections.filter((o) => o.category !== code);
      return { ...prev, toolbox: { ...tb, objections: [...others, ...next].sort((a, b) => a.id - b.id) } };
    });
  }

  return (
    <div className="space-y-5">
      {codes.map((code) => {
        const items = tb.objections.filter((o) => o.category === code).sort((a, b) => a.id - b.id);
        const job: Job = { type: "objection_category", code };
        return (
          <Card key={code}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="accent">{code}</Badge>
                  <CardTitle className="text-base">{OBJECTION_CATEGORY_LABELS[code]}</CardTitle>
                  <span className="text-xs text-muted-foreground">· {items.length} / 6 objections</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {items.length > 0 && (
                    <ValidationToggle
                      mission={mission}
                      update={update}
                      validationKey={ValidationKey.objection(code)}
                    />
                  )}
                  {items.length > 0 && (
                    <ConfirmButton
                      onConfirm={() => update((prev) => ({ ...prev, toolbox: clearJobInToolbox(prev.toolbox, job) }))}
                      question="Vider cette famille ?"
                      confirmLabel="Vider"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 /> Vider
                    </ConfirmButton>
                  )}
                  <RegenerateJobButton mission={mission} job={job} update={update} compact />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground italic mb-3">Aucune objection dans cette famille. Régénère via l'IA ou ajoute manuellement.</p>
              )}
              <ObjectionsListEditor
                value={items}
                onChange={(next) => setItemsForCategory(code, next)}
                onAdd={() => addObjectionToCategory(code)}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Boutons régénération (job seul, ou tous les jobs d'une section)
// -----------------------------------------------------------------------------
function RegenerateJobButton({
  mission,
  job,
  update,
  compact,
}: {
  mission: NonNullable<ReturnType<typeof useMission>["mission"]>;
  job: Job;
  update: ReturnType<typeof useMission>["update"];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");

  async function regen() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-toolbox-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, job, refineInstructions: instructions.trim() || undefined }),
      });
      let data: { error?: string; data?: Record<string, unknown>; raw?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(`Réponse serveur invalide (${res.status} ${res.statusText})`);
      }
      if (!res.ok) {
        const msg = data?.error ?? `Erreur HTTP ${res.status}`;
        const extra = data?.raw ? `, extrait : "${String(data.raw).slice(0, 120)}…"` : "";
        throw new Error(msg + extra);
      }
      if (!data?.data) throw new Error("Réponse IA vide ou mal formée.");

      update((prev) => ({ ...prev, toolbox: mergeJobResult(prev.toolbox ?? emptyToolbox(), job, data.data!) }));
      setOpen(false);
      setInstructions("");
    } catch (err) {
      console.error("[regen-job]", job, err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size={compact ? "sm" : "default"}>
        <RefreshCw /> {compact ? "Régénérer ce bloc" : "Régénérer cette section"}
      </Button>
      <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> {jobLabel(job)}</DialogTitle>
            <DialogDescription>L'IA va remplacer ce bloc seul. Le reste de la boîte n'est pas touché.</DialogDescription>
          </DialogHeader>
          {!busy && (
            <div className="grid gap-2">
              <Label htmlFor="regen-instructions">Instructions (optionnel)</Label>
              <Input
                id="regen-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Plus court, plus direct, ton plus terrain…"
                disabled={busy}
              />
            </div>
          )}
          {busy && <div className="py-4"><AiThinking label={`Génération ${jobLabel(job).toLowerCase()}`} size="md" /></div>}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <p className="font-medium mb-1">La génération a échoué</p>
              <p className="text-xs leading-relaxed">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Si l'erreur mentionne un timeout : la section est trop grosse. Tente avec une instruction « plus court, format plus serré » ou contacte l'équipe Noxias.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>Fermer</Button>
            </DialogClose>
            {!busy && (
              <Button onClick={regen} variant="accent">
                <RefreshCw /> Régénérer
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RegenerateAllInSection({
  mission,
  sectionKey,
  update,
  variant = "outline",
}: {
  mission: NonNullable<ReturnType<typeof useMission>["mission"]>;
  sectionKey: SectionKey;
  update: ReturnType<typeof useMission>["update"];
  variant?: "outline" | "accent";
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const cancelRef = useRef(false);
  const def = SECTION_DEFS.find((s) => s.key === sectionKey)!;

  async function regen() {
    setBusy(true);
    setError(null);
    cancelRef.current = false;

    const jobs = expandSectionToJobs(sectionKey);
    setProgress({ done: 0, total: jobs.length, current: jobLabel(jobs[0]) });

    let workingTb: Toolbox = mission.toolbox ?? emptyToolbox();

    try {
      for (let i = 0; i < jobs.length; i++) {
        if (cancelRef.current) break;
        const job = jobs[i];
        setProgress({ done: i, total: jobs.length, current: jobLabel(job) });
        const res = await fetch("/api/ai/generate-toolbox-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mission: { ...mission, toolbox: workingTb },
            job,
            refineInstructions: instructions.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
        workingTb = mergeJobResult(workingTb, job, data.data);
        update((prev) => ({ ...prev, toolbox: mergeJobResult(prev.toolbox ?? emptyToolbox(), job, data.data) }));
        setProgress({ done: i + 1, total: jobs.length, current: `${jobLabel(job)} ✓` });
      }
      if (!cancelRef.current) {
        setOpen(false);
        setInstructions("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant={variant} size="sm">
        <RefreshCw /> Régénérer cette section ({def.key === "pitch" ? "6 blocs" : def.key === "objections" ? "5 familles" : "1 bloc"})
      </Button>
      <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Régénérer {def.label}</DialogTitle>
            <DialogDescription>L'IA va remplacer toute la section, bloc par bloc.</DialogDescription>
          </DialogHeader>
          {!busy && !progress && (
            <div className="grid gap-2">
              <Label htmlFor="sec-instructions">Instructions (optionnel)</Label>
              <Input
                id="sec-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Plus terrain, plus direct, focus sur cible chaude…"
              />
            </div>
          )}
          {progress && busy && (
            <div className="space-y-3">
              <AiThinking label={progress.current} size="md" />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progression</span>
                  <span className="tabular-nums text-muted-foreground">{progress.done}/{progress.total} blocs</span>
                </div>
                <Progress value={Math.round((progress.done / progress.total) * 100)} />
              </div>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            {!busy && (
              <DialogClose asChild>
                <Button variant="ghost">Annuler</Button>
              </DialogClose>
            )}
            {busy ? (
              <Button onClick={() => { cancelRef.current = true; }} variant="outline"><StopCircle /> Stopper</Button>
            ) : (
              <Button onClick={regen} variant="accent">
                <RefreshCw /> Lancer
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
