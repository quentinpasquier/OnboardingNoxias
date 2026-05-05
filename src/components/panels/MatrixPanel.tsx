"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { Sparkles, Loader2, Check, X, Wand2, CheckCircle2, FileQuestion, FileEdit, StopCircle } from "lucide-react";
import type { Mission } from "@/types/mission";
import { MATRIX_QUESTIONS, CATEGORY_GROUPS } from "@/lib/matrix-questions";
import type { MissionUpdater } from "@/hooks/use-mission";
import { AiThinking } from "@/components/ai/AiThinking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "draft" | "validated" | "empty";

const BATCH_SIZE = 6;

function statusOf(mission: Mission, id: number): Status {
  const text = mission.matrix[id]?.trim();
  if (!text) return "empty";
  return mission.matrixStatus?.[id] ?? "validated";
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function MatrixPanel({ mission, update }: { mission: Mission; update: (u: MissionUpdater) => void }) {
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
    update((prev) => {
      const status = { ...(prev.matrixStatus ?? {}) };
      if (value.trim()) status[id] = "validated";
      else delete status[id];
      return { ...prev, matrix: { ...prev.matrix, [id]: value }, matrixStatus: status };
    });
  }

  function setStatus(id: number, s: "draft" | "validated") {
    update((prev) => ({ ...prev, matrixStatus: { ...(prev.matrixStatus ?? {}), [id]: s } }));
  }

  function applyDraftAnswers(items: { id: number; text: string }[]) {
    update((prev) => {
      const matrix = { ...prev.matrix };
      const status = { ...(prev.matrixStatus ?? {}) };
      for (const a of items) {
        matrix[a.id] = a.text;
        status[a.id] = "draft";
      }
      return { ...prev, matrix, matrixStatus: status };
    });
  }

  function validateAllDrafts() {
    update((prev) => {
      const status = { ...(prev.matrixStatus ?? {}) };
      for (const q of MATRIX_QUESTIONS) {
        if (status[q.id] === "draft") status[q.id] = "validated";
      }
      return { ...prev, matrixStatus: status };
    });
  }

  function validateSection(ids: number[]) {
    update((prev) => {
      const status = { ...(prev.matrixStatus ?? {}) };
      for (const id of ids) {
        if (prev.matrix[id]?.trim() && status[id] !== "validated") status[id] = "validated";
      }
      return { ...prev, matrixStatus: status };
    });
  }

  return (
    <div className="space-y-5">
      <BulkGenerateBar
        mission={mission}
        counts={counts}
        onApply={applyDraftAnswers}
        onValidateAll={validateAllDrafts}
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">Sections</p>
          {CATEGORY_GROUPS.map((g) => {
            const draftCount = g.ids.filter((id) => statusOf(mission, id) === "draft").length;
            const validatedCount = g.ids.filter((id) => statusOf(mission, id) === "validated").length;
            const isActive = activeGroup === g.label;
            return (
              <div key={g.label} className={`rounded-md transition-colors ${isActive ? "bg-card border border-border shadow-sm" : "hover:bg-secondary/60"}`}>
                <button
                  onClick={() => setActiveGroup(g.label)}
                  className="w-full text-left px-3 py-2 text-sm flex items-center justify-between"
                >
                  <span className={isActive ? "font-medium" : ""}>{g.label}</span>
                  <span className="flex items-center gap-1 text-xs tabular-nums">
                    {draftCount > 0 && <span className="text-amber-600 font-medium">{draftCount}</span>}
                    <span className="text-muted-foreground">{validatedCount}/{g.ids.length}</span>
                  </span>
                </button>
                {isActive && draftCount > 0 && (
                  <div className="px-3 pb-2 pt-1">
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => validateSection(g.ids)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Valider la section ({draftCount})
                    </Button>
                  </div>
                )}
              </div>
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
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const cancelRef = useRef(false);

  async function generate() {
    setBusy(true);
    setError(null);
    cancelRef.current = false;

    const missingIds = MATRIX_QUESTIONS.filter((q) => !mission.matrix[q.id]?.trim()).map((q) => q.id);
    if (missingIds.length === 0) {
      setError("Toutes les questions sont déjà remplies.");
      setBusy(false);
      return;
    }

    const batches = chunk(missingIds, BATCH_SIZE);
    setProgress({ done: 0, total: missingIds.length, current: `Bloc 1/${batches.length}` });

    // Working copy : on accumule les réponses des blocs précédents
    // pour que l'IA voie un contexte qui s'enrichit batch après batch,
    // ET pour ne pas perdre de réponses si plusieurs batches sont en vol.
    let workingMission: Mission = {
      ...mission,
      matrix: { ...mission.matrix },
      matrixStatus: { ...(mission.matrixStatus ?? {}) },
    };

    let processed = 0;
    try {
      for (let i = 0; i < batches.length; i++) {
        if (cancelRef.current) {
          setError("Génération annulée.");
          break;
        }
        const batch = batches[i];
        setProgress({ done: processed, total: missingIds.length, current: `Bloc ${i + 1}/${batches.length} — ${batch.length} question${batch.length > 1 ? "s" : ""}` });

        const res = await fetch("/api/ai/matrix-generate-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mission: workingMission, questionIds: batch, refineInstructions: instructions.trim() || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
        if (Array.isArray(data.answers) && data.answers.length > 0) {
          // Met à jour la copie locale ET l'état React (functional update)
          for (const a of data.answers) {
            workingMission.matrix[a.id] = a.text;
            (workingMission.matrixStatus as Record<number, "draft" | "validated">)[a.id] = "draft";
          }
          onApply(data.answers);
          processed += data.answers.length;
          setProgress({ done: processed, total: missingIds.length, current: `Bloc ${i + 1}/${batches.length} — ${processed}/${missingIds.length} appliquées` });
        }
      }
      if (!cancelRef.current && processed === missingIds.length) {
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

  function cancel() {
    cancelRef.current = true;
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

      <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Génération en lot</DialogTitle>
            <DialogDescription>
              L'IA remplit les <strong>{counts.empty}</strong> question{counts.empty > 1 ? "s" : ""} vide{counts.empty > 1 ? "s" : ""} en plusieurs blocs de {BATCH_SIZE} (pour rester dans les limites de timeout). Chaque réponse arrive en <span className="text-amber-700 font-medium">brouillon</span> — tu valides ensuite ligne par ligne ou par section.
            </DialogDescription>
          </DialogHeader>
          {!busy && (
            <div className="grid gap-2">
              <Label htmlFor="bulk-instructions">Instructions optionnelles</Label>
              <Textarea
                id="bulk-instructions"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex. ton plus direct, focus sur le persona dirigeant, accentuer les douleurs financières…"
              />
              <p className="text-xs text-muted-foreground">~ 60 à 120 s au total. Coût estimé : 5–15 ¢ par mission complète (avec prompt caching).</p>
            </div>
          )}
          {progress && (
            <div className="space-y-3">
              <AiThinking label={progress.current} size="md" />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progression</span>
                  <span className="tabular-nums text-muted-foreground">{progress.done}/{progress.total} questions</span>
                </div>
                <Progress value={Math.round((progress.done / progress.total) * 100)} />
              </div>
              <p className="text-xs text-muted-foreground text-center">Les réponses apparaissent en direct dans la matrice. Tu peux annuler à tout moment, le travail déjà généré reste.</p>
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
              <Button onClick={cancel} variant="outline"><StopCircle /> Stopper</Button>
            ) : (
              <Button onClick={generate} variant="accent">
                <Sparkles /> Lancer la génération
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Auto-resize textarea — grows with content, no scrollbar. */
function AutoTextarea({ value, onChange, ...props }: React.ComponentProps<typeof Textarea>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight + 2}px`;
    }
  }, [value]);
  return <Textarea ref={ref} value={value} onChange={onChange} {...props} className={`resize-none overflow-hidden ${props.className ?? ""}`} />;
}

/** Render markdown-ish bullet list and paragraphs. */
function AnswerPreview({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletGroup: string[] = [];

  function flushBullets() {
    if (bulletGroup.length === 0) return;
    blocks.push(
      <ul key={`b-${blocks.length}`} className="space-y-1.5 my-1">
        {bulletGroup.map((b, i) => (
          <li key={i} className="flex gap-2.5 leading-relaxed">
            <span className="text-accent shrink-0 mt-[0.4em] h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>,
    );
    bulletGroup = [];
  }

  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^[-•*]\s+(.+)$/);
    if (bullet) {
      bulletGroup.push(bullet[1]);
    } else if (line.length === 0) {
      flushBullets();
    } else {
      flushBullets();
      blocks.push(<p key={`p-${blocks.length}`} className="my-1 leading-relaxed">{line}</p>);
    }
  }
  flushBullets();

  return <div className="text-sm">{blocks}</div>;
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
  const [editing, setEditing] = useState(!answer.trim());

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
      setEditing(false);
    }
  }

  const cardClass =
    status === "draft" ? "border-amber-300 bg-amber-50/40"
    : status === "validated" ? "border-emerald-200/70"
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
        {editing || !answer.trim() ? (
          <AutoTextarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onBlur={() => { if (answer.trim()) setEditing(false); }}
            placeholder="Réponse co-construite avec le client. Liste à puces : commence chaque ligne par « - »."
            rows={4}
            autoFocus={editing}
            className="leading-relaxed"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-left rounded-md border border-input bg-card px-4 py-3 hover:border-accent/40 hover:bg-secondary/30 transition-colors cursor-text"
            aria-label="Modifier la réponse"
          >
            <AnswerPreview text={answer} />
          </button>
        )}
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
                placeholder="Plus court, plus concret, mettre en bullet points…"
              />
            </div>
          )}

          {!draft && !busy && (
            <Button onClick={callAi} variant="accent">
              <Sparkles /> {mode === "draft" ? "Générer une proposition" : "Affiner avec l'IA"}
            </Button>
          )}
          {busy && (
            <div className="py-2"><AiThinking label="L'IA travaille sur ta réponse" size="md" /></div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {draft && (
            <>
              <div className="rounded-md border bg-secondary/40 p-4 text-sm leading-relaxed max-h-80 overflow-y-auto">
                <AnswerPreview text={draft} />
              </div>
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
