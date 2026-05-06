"use client";
import { useEffect, useState } from "react";
import { MessageSquareText, Loader2, CheckCircle2, RotateCcw, Trash2, Filter as FilterIcon } from "lucide-react";
import { commentsStore } from "@/lib/supabase/missions-store";
import type { MissionComment } from "@/types/mission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { formatDate } from "@/lib/utils";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { PITCH_SECTION_LABELS, OBJECTION_CATEGORY_LABELS } from "@/lib/toolbox-sections";

const ANCHOR_LABELS: Record<string, string> = {
  positioning: "Positionnement",
  arguments: "Arguments massue",
  qualification: "Qualification R1",
  general: "Discussion générale",
};

function describeAnchor(c: MissionComment): string {
  const at = c.anchorType;
  const id = c.anchorId;
  if (at === "matrix") {
    const q = id ? MATRIX_QUESTIONS.find((x) => x.id === Number(id)) : null;
    return q ? `Matrice #${q.id} · ${q.question}` : `Matrice #${id ?? "?"}`;
  }
  if (at === "persona") return `Persona ${(Number(id ?? 0) + 1)}`;
  if (at === "pitch") return `Pitch ${id ?? "?"} · ${PITCH_SECTION_LABELS[id as keyof typeof PITCH_SECTION_LABELS] ?? ""}`;
  if (at === "objection_family") return `Objections ${id ?? "?"} · ${OBJECTION_CATEGORY_LABELS[id as keyof typeof OBJECTION_CATEGORY_LABELS] ?? ""}`;
  return ANCHOR_LABELS[at] ?? at;
}

type FilterMode = "all" | "open" | "treated";

export function MissionCommentsPanel({ missionId }: { missionId: string; adminName?: string }) {
  const [comments, setComments] = useState<MissionComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("open");

  async function refresh() {
    try {
      const list = await commentsStore.listForMission(missionId);
      setComments(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setComments([]);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  if (comments === null) {
    return (
      <Card><CardContent className="py-6 text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Chargement des commentaires…</CardContent></Card>
    );
  }

  if (comments.length === 0) {
    return null;
  }

  const filtered = filter === "all"
    ? comments
    : filter === "treated"
      ? comments.filter((c) => c.resolved)
      : comments.filter((c) => !c.resolved);

  const groups = new Map<string, MissionComment[]>();
  for (const c of filtered) {
    const key = `${c.anchorType}|${c.anchorId ?? ""}`;
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  const openCount = comments.filter((c) => !c.resolved).length;
  const treatedCount = comments.filter((c) => c.resolved).length;

  async function setTreated(id: string, treated: boolean) {
    try {
      await commentsStore.setResolved(id, treated);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function remove(id: string) {
    try {
      await commentsStore.remove(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <Card className="border-noxias-deep/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-accent" /> Retours du client
              {openCount > 0 && <Badge variant="accent" className="text-[10px]">{openCount} à traiter</Badge>}
              {treatedCount > 0 && <Badge variant="secondary" className="text-[10px]">{treatedCount} traité{treatedCount > 1 ? "s" : ""}</Badge>}
            </CardTitle>
            <CardDescription>Le client a déposé ces retours sur des éléments précis du livrable. Marque chaque commentaire comme traité une fois pris en compte dans ton travail.</CardDescription>
          </div>
          <div className="inline-flex items-center gap-1 text-xs">
            <FilterIcon className="h-3.5 w-3.5 text-muted-foreground" />
            {(["open", "all", "treated"] as FilterMode[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md transition-colors ${filter === f ? "bg-accent/15 text-foreground border border-accent/30" : "hover:bg-secondary"}`}
              >
                {f === "open" ? "À traiter" : f === "all" ? "Tous" : "Traités"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {filter === "open" ? "Aucun retour en attente, tout est à jour." : filter === "treated" ? "Aucun retour encore traité." : "Aucun retour."}
          </p>
        ) : (
          <div className="space-y-5">
            {Array.from(groups.entries()).map(([key, items]) => {
              const first = items[0];
              return (
                <div key={key} className="rounded-md border border-border/60 bg-secondary/20">
                  <div className="px-4 py-2.5 border-b bg-card/60">
                    <p className="text-xs uppercase tracking-wider text-accent font-bold">{describeAnchor(first)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{items.length} retour{items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="p-3 space-y-3">
                    {items.map((c) => (
                      <div key={c.id} className={`rounded-md p-3 ${c.resolved ? "opacity-60 bg-secondary/40" : "bg-card border"}`}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-sm truncate">{c.authorName || "Anonyme"}</span>
                            <Badge variant="outline" className="text-[10px]">Client</Badge>
                            {c.resolved && <Badge variant="success" className="text-[10px]">traité</Badge>}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${c.resolved ? "line-through" : ""}`}>{c.body}</p>
                        <div className="flex items-center gap-1 mt-2 -mb-1">
                          {c.resolved ? (
                            <Button onClick={() => setTreated(c.id, false)} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <RotateCcw className="h-3 w-3" /> Repasser à traiter
                            </Button>
                          ) : (
                            <Button onClick={() => setTreated(c.id, true)} variant="ghost" size="sm" className="h-6 px-2 text-xs text-emerald-700 hover:bg-emerald-50">
                              <CheckCircle2 className="h-3 w-3" /> Marquer comme traité
                            </Button>
                          )}
                          <ConfirmButton
                            onConfirm={() => remove(c.id)}
                            question="Supprimer ?"
                            confirmLabel="Supprimer"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </ConfirmButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
