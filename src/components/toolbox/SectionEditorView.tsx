"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Loader2, Sparkles, FileQuestion } from "lucide-react";
import { useMission } from "@/hooks/use-mission";
import type { Toolbox } from "@/lib/toolbox-schema";
import { SECTION_DEFS, isSectionDone, emptyToolbox, type SectionKey } from "@/lib/toolbox-sections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AtelierLoading, AtelierNotFound } from "@/components/AtelierShell";
import {
  PositioningEditor,
  PersonasEditor,
  ArgumentsEditor,
  PitchEditor,
  ObjectionsEditor,
  QualificationEditor,
} from "@/components/toolbox/editors";

export function SectionEditorView({ missionId, sectionKey }: { missionId: string; sectionKey: SectionKey }) {
  const { mission, update } = useMission(missionId);
  const def = SECTION_DEFS.find((s) => s.key === sectionKey);

  useEffect(() => {
    if (mission?.clientName && def) document.title = `${def.label} — ${mission.clientName} — Noxias`;
  }, [mission?.clientName, def]);

  if (mission === undefined) return <AtelierLoading />;
  if (mission === null || !def) return <AtelierNotFound />;

  const tb = mission.toolbox ?? emptyToolbox();
  const done = isSectionDone(tb, sectionKey);

  function patchToolbox(next: Partial<Toolbox>) {
    update((prev) => ({ ...prev, toolbox: { ...(prev.toolbox ?? emptyToolbox()), ...next } }));
  }

  return (
    <main className="container max-w-6xl py-10">
      <div className="mb-8">
        <Link href={`/missions/${mission.id}/boite-a-outils`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Boîte à outils — {mission.clientName}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl font-bold tracking-tight">{def.label}</h1>
            {done ? <Badge variant="success">Section générée</Badge> : <Badge variant="outline">À générer</Badge>}
          </div>
          <RegenerateSectionButton mission={mission} sectionKey={sectionKey} update={update} />
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">{def.description}</p>
      </div>

      {!done ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-accent/10 p-4 mb-4"><FileQuestion className="h-6 w-6 text-accent" /></div>
            <h3 className="font-display text-lg mb-2">Section non générée</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Lance la génération depuis le hub de la boîte à outils, ou régénère uniquement cette section avec le bouton ci-dessus.
            </p>
            <Link href={`/missions/${mission.id}/boite-a-outils`}>
              <Button variant="outline">Retour au hub</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <SectionEditor
          sectionKey={sectionKey}
          toolbox={tb}
          patch={patchToolbox}
        />
      )}
    </main>
  );
}

function SectionEditor({
  sectionKey,
  toolbox,
  patch,
}: {
  sectionKey: SectionKey;
  toolbox: Toolbox;
  patch: (next: Partial<Toolbox>) => void;
}) {
  switch (sectionKey) {
    case "positioning":
      return <PositioningEditor value={toolbox.positioning} onChange={(v) => patch({ positioning: v })} />;
    case "personas":
      return <PersonasEditor value={toolbox.personas} onChange={(v) => patch({ personas: v })} />;
    case "arguments":
      return (
        <ArgumentsEditor
          disqualified={toolbox.disqualified}
          killerArguments={toolbox.killerArguments}
          setDisqualified={(s) => patch({ disqualified: s })}
          setKillerArguments={(v) => patch({ killerArguments: v })}
        />
      );
    case "pitch":
      return <PitchEditor value={toolbox.pitch} onChange={(v) => patch({ pitch: v })} />;
    case "objections":
      return <ObjectionsEditor value={toolbox.objections} onChange={(v) => patch({ objections: v })} />;
    case "qualification":
      return <QualificationEditor value={toolbox.qualification} onChange={(v) => patch({ qualification: v })} />;
  }
}

function RegenerateSectionButton({
  mission,
  sectionKey,
  update,
}: {
  mission: ReturnType<typeof useMission>["mission"];
  sectionKey: SectionKey;
  update: ReturnType<typeof useMission>["update"];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");

  if (!mission) return null;

  async function regen() {
    if (!mission) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-toolbox-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, section: sectionKey, refineInstructions: instructions.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);

      const sectionData = data.data as Record<string, unknown>;
      update((prev) => {
        const tb = prev.toolbox ?? emptyToolbox();
        switch (sectionKey) {
          case "positioning":
            return { ...prev, toolbox: { ...tb, positioning: sectionData as Toolbox["positioning"] } };
          case "personas":
            return { ...prev, toolbox: { ...tb, personas: (sectionData.personas ?? []) as Toolbox["personas"] } };
          case "arguments":
            return {
              ...prev,
              toolbox: {
                ...tb,
                disqualified: (sectionData.disqualified ?? "") as string,
                killerArguments: (sectionData.killerArguments ?? []) as Toolbox["killerArguments"],
              },
            };
          case "pitch":
            return { ...prev, toolbox: { ...tb, pitch: (sectionData.pitch ?? []) as Toolbox["pitch"] } };
          case "objections":
            return { ...prev, toolbox: { ...tb, objections: (sectionData.objections ?? []) as Toolbox["objections"] } };
          case "qualification":
            return { ...prev, toolbox: { ...tb, qualification: (sectionData.qualification ?? { criteria: [], tiers: [] }) as Toolbox["qualification"] } };
          default:
            return prev;
        }
      });
      setOpen(false);
      setInstructions("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="sm">
        <RefreshCw /> Régénérer cette section
      </Button>
      <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Régénérer</DialogTitle>
            <DialogDescription>L'IA va remplacer le contenu de cette section. Le reste de la boîte n'est pas touché.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="regen-instructions">Instructions (optionnel)</Label>
            <Input
              id="regen-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Plus court, plus direct, prioriser persona dirigeant…"
              disabled={busy}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>Annuler</Button>
            </DialogClose>
            <Button onClick={regen} variant="accent" disabled={busy}>
              {busy ? <><Loader2 className="animate-spin" /> Génération…</> : <><RefreshCw /> Régénérer</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
