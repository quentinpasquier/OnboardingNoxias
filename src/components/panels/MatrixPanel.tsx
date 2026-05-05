"use client";
import { useState, useMemo } from "react";
import { Sparkles, Loader2, Check, X, Wand2, CheckCircle2, FileQuestion, FileEdit } from "lucide-react";
import type { Mission } from "@/types/mission";
import { MATRIX_QUESTIONS, CATEGORY_GROUPS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "draft" | "validated" | "empty";

function statusOf(mission: Mission, id: number): Status {
  const text = mission.matrix[id]?.trim();
  if (!text) return "empty";
  return mission.matrixStatus?.[id] ?? "validated";
}

export function MatrixPanel({ mission, update }: { mission: Mission; update: (m: Mission) => void }) {
  const [activeGroup, setActiveGroup] = useState<string>(CATEGORY_GROUPS[0].label);
  const visibleIds = useMemo(
    () => CATEGORY_GROUPS.find((g) => g.label === activeGroup)?.ids ?? [],
    [activeGroup],
  );

  const counts = useMemo(() => {
    let drafts = 0, validated = 0, empty = 0;
    for (const q of MATRIX_QUESTIONS) {
      const s = statusOf(mission, q.id);
      if (s === "draft") drafts++;
      else if (s === "validated") validated++;
      else empty++;
    }
    return { drafts, validated, empty };
  }, [mission]);

  function setAnswer(id: number, value: string) {
    const status: MissionStatus = { ...(mission.matrixStatus ?? {}) };
    if (value.trim()) status[id] = "validated";
    else delete status[id];
    update({ ...mission, matrix: { ...mission.matrix, [id]: value }, matrixStatus: status });
  }

  function setStatus(id: number, s: "draft" | "validated") {
    const status = { ...(mission.matrixStatus ?? {}) };
    status[id] = s;
    update({ ...mission, matrixStatus: status });
  }

  function applyDraftAnswers(items: { id: number; text: string }[]) {
    const matrix = { ...mission.matrix };
    const status = { ...(mission.matrixStatus ?? {}) };
    for (const a of items) {
      matrix[a.id] = a.text;
      status[a.id] = "draft";
    }
    update({ ...mission, matrix, matrixStatus: status });
  }

  function validateAllDrafts() {
    const status = { ...(mission.matrixStatus ?? {}) };
    for (const q of MATRIX_QUESTIONS) {
      if (status[q.id] === "draft") status[q.id] = "validated";
    }
    update({ ...mission, matrixStatus: status });
  }

  return (
    <div className="space-y-5">
      <BulkGenerateBar
        mission={mission}
        counts={counts}
        onApply={applyDraftAnswers}
        onValidateAll={validateAllDrafts}
      />

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">Sections</p>
          {CATEGORY_GROUPS.map((g) => {
            const draftCount = g.ids.filter((id) => statusOf(mission, id) === "draft").length;
            const validatedCount = g.ids.filter((id) => statusOf(mission, id) === "validated").length;
            return (
              <button
                key={g.label}
                onClick={() => setActiveGroup(g.label)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                  activeGroup === g.label ? "bg-card border border-border shadow-sm" : "hover:bg-secondary/60"
                }`}
              >
                <span className={activeGroup === g.label ? "font-medium" : ""}>{g.label}</span>
                <span className="flex items-center gap-1 text-xs tabular-nums">
                  {draftCount > 0 && <span className="text-amber-600 font-medium">{draftCount}</span>}
                  <span className="text-muted-foreground">{validatedCount}/{g.ids.length}</span>
                </span>
              </button>
            );
          })}
        </aside>

        <div className="space-y-4">
          {visibleIds.map((id) => {
            const q = MATRIX_QUESTIONS.find((x) => x.id === id)!;
            return (
              <MatrixRow
                key={q.id}
                question={q}
                answer={mission.matrix[q.id] ?? ""}
                status={statusOf(mission, q.id)}
                setAnswer={(v) => setAnswer(q.id, v)}
                setStatus={(s) => setStatus(q.id, s)}
                mission={mission}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

type MissionStatus = NonNullable<Mission["matrixStatus"]>;

function BulkGenerateBar({
  mission,
  counts,
  onApply,
  onValidateAll,
}: {
  mission: Mission;
  counts: { drafts: number; validated: number; empty: number };
  onApply: (items: { id: number; text: string }[]) => void;
  onValidateAll: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState("");

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/matrix-generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, refineInstructions: instructions.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      if (data.skipped) {
        setError(data.skipped);
        return;
      }
      onApply(data.answers);
      setOpen(false);
      setInstructions("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardContent className="py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="rounded-full bg-accent/15 p-2"><Sparkles className="h-4 w-4 text-accent" /></div>
          <div>
            <p className="text-sm font-medium">Génération en lot</p>
            <p className="text-xs text-muted-foreground">
              {counts.empty > 0
                ? `${counts.empty} question${counts.empty > 1 ? "s" : ""} vide${counts.empty > 1 ? "s" : ""} à pré-remplir`
                : "Toutes les questions sont remplies"}
              {counts.drafts > 0 && (
                <> · <span className="text-amber-600 font-medium">{counts.drafts} brouillon{counts.drafts > 1 ? "s" : ""} à valider</span></>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {counts.drafts > 0 && (
            <Button variant="outline" size="sm" onClick={onValidateAll}>
              <CheckCircle2 /> Valider tous les brouillons
            </Button>
          )}
          <Button
            variant="accent"
            size="sm"
            onClick={() => { setOpen(true); setError(null); }}
            disabled={counts.empty === 0}
          >
            <Wand2 /> Générer la matrice complète
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Génération en lot</DialogTitle>
            <DialogDescription>
              L'IA va remplir les <strong>{counts.empty}</strong> question{counts.empty > 1 ? "s" : ""} vide{counts.empty > 1 ? "s" : ""} en s'appuyant sur le contexte (documents, site, notes, matrice déjà remplie). Chaque réponse arrive en <span className="text-amber-700 font-medium">brouillon</span> — tu valides ensuite ligne par ligne.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="bulk-instructions">Instructions optionnelles</Label>
            <Textarea
              id="bulk-instructions"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex. ton plus direct, focus sur le persona dirigeant, accentuer les douleurs financières…"
              disabled={busy}
            />
          </div>
          <p className="text-xs text-muted-foreground">~ 30s à 90s. Coût estimé : 5–15 ¢ pour la matrice complète (avec prompt caching).</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>Annuler</Button>
            </DialogClose>
            <Button onClick={generate} disabled={busy} variant="accent">
              {busy ? <><Loader2 className="animate-spin" /> Génération…</> : <><Sparkles /> Lancer la génération</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function MatrixRow({
  question,
  answer,
  status,
  setAnswer,
  setStatus,
  mission,
}: {
  question: { id: number; category: string; question: string; hint?: string };
  answer: string;
  status: Status;
  setAnswer: (v: string) => void;
  setStatus: (s: "draft" | "validated") => void;
  mission: Mission;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [mode, setMode] = useState<"draft" | "refine">(answer.trim() ? "refine" : "draft");

  async function callAi() {
    setBusy(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/ai/matrix-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, questionId: question.id, mode, currentAnswer: answer, instructions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      setDraft(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function applyDraft() {
    if (draft) {
      setAnswer(draft);
      setAiOpen(false);
      setDraft(null);
      setInstructions("");
    }
  }

  const cardClass =
    status === "draft" ? "border-amber-300 bg-amber-50/40"
    : status === "validated" ? "border-emerald-200/60"
    : "";

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">#{question.id} · {question.category}</Badge>
              {status === "draft" && (
                <Badge variant="outline" className="border-amber-400 bg-amber-100 text-amber-900">
                  <FileEdit className="h-3 w-3 mr-1" /> Brouillon IA
                </Badge>
              )}
              {status === "validated" && (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Validé
                </Badge>
              )}
              {status === "empty" && (
                <Badge variant="outline" className="text-muted-foreground">
                  <FileQuestion className="h-3 w-3 mr-1" /> Vide
                </Badge>
              )}
            </div>
            <CardTitle className="text-base">{question.question}</CardTitle>
            {question.hint && <CardDescription className="text-xs">{question.hint}</CardDescription>}
          </div>
          <Button
            variant={status === "empty" ? "accent" : "outline"}
            size="sm"
            onClick={() => {
              setMode(answer.trim() ? "refine" : "draft");
              setAiOpen(true);
              setDraft(null);
              setError(null);
            }}
          >
            <Sparkles /> IA
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Réponse co-construite avec le client…"
          rows={4}
        />
        {status === "draft" && (
          <div className="flex items-center justify-between gap-2 -mt-1">
            <p className="text-xs text-amber-700">Brouillon IA — relis et valide.</p>
            <Button size="sm" variant="accent" onClick={() => setStatus("validated")}>
              <Check /> Valider la réponse
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Assistance IA — question #{question.id}</DialogTitle>
            <DialogDescription>{question.question}</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setMode("draft")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${mode === "draft" ? "bg-accent/15 border border-accent/30 text-foreground" : "bg-secondary hover:bg-secondary/80"}`}
            >
              <Wand2 className="h-3.5 w-3.5 inline mr-1.5" /> Proposer
            </button>
            <button
              onClick={() => setMode("refine")}
              disabled={!answer.trim()}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${mode === "refine" ? "bg-accent/15 border border-accent/30 text-foreground" : "bg-secondary hover:bg-secondary/80"}`}
            >
              Affiner ma réponse
            </button>
          </div>

          {mode === "refine" && (
            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions (optionnel)</Label>
              <Input
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Plus court, plus concret, ajouter un exemple…"
              />
            </div>
          )}

          {!draft && !busy && (
            <Button onClick={callAi} variant="accent">
              <Sparkles /> {mode === "draft" ? "Générer une proposition" : "Affiner avec l'IA"}
            </Button>
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> L'IA réfléchit…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {draft && (
            <>
              <div className="rounded-md border bg-secondary/40 p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{draft}</div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="ghost"><X /> Ignorer</Button>
                </DialogClose>
                <Button variant="outline" onClick={() => { setDraft(null); }}>Régénérer</Button>
                <Button variant="accent" onClick={applyDraft}><Check /> Appliquer</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
