"use client";
import { useState, useMemo } from "react";
import { Sparkles, Loader2, Check, X, Wand2 } from "lucide-react";
import type { Mission } from "@/types/mission";
import { MATRIX_QUESTIONS, CATEGORY_GROUPS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MatrixPanel({ mission, update }: { mission: Mission; update: (m: Mission) => void }) {
  const [activeGroup, setActiveGroup] = useState<string>(CATEGORY_GROUPS[0].label);
  const visibleIds = useMemo(
    () => CATEGORY_GROUPS.find((g) => g.label === activeGroup)?.ids ?? [],
    [activeGroup],
  );

  function setAnswer(id: number, value: string) {
    update({ ...mission, matrix: { ...mission.matrix, [id]: value } });
  }

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6">
      <aside className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">Sections</p>
        {CATEGORY_GROUPS.map((g) => {
          const filled = g.ids.filter((id) => mission.matrix[id]?.trim()).length;
          return (
            <button
              key={g.label}
              onClick={() => setActiveGroup(g.label)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                activeGroup === g.label ? "bg-card border border-border shadow-sm" : "hover:bg-secondary/60"
              }`}
            >
              <span className={activeGroup === g.label ? "font-medium" : ""}>{g.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{filled}/{g.ids.length}</span>
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
              setAnswer={(v) => setAnswer(q.id, v)}
              mission={mission}
            />
          );
        })}
      </div>
    </div>
  );
}

function MatrixRow({
  question,
  answer,
  setAnswer,
  mission,
}: {
  question: { id: number; category: string; question: string; hint?: string };
  answer: string;
  setAnswer: (v: string) => void;
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
        body: JSON.stringify({
          mission,
          questionId: question.id,
          mode,
          currentAnswer: answer,
          instructions,
        }),
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="secondary">#{question.id} · {question.category}</Badge>
            <CardTitle className="text-base">{question.question}</CardTitle>
            {question.hint && <CardDescription className="text-xs">{question.hint}</CardDescription>}
          </div>
          <Button
            variant={answer.trim() ? "outline" : "accent"}
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
      <CardContent>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Réponse co-construite avec le client…"
          rows={4}
        />
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
