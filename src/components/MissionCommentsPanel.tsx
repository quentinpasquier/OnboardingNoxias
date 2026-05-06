"use client";
import { useEffect, useState } from "react";
import { MessageSquareText, Loader2, CheckCircle2, RotateCcw, Trash2, Send, Filter } from "lucide-react";
import { commentsStore } from "@/lib/supabase/missions-store";
import type { MissionComment } from "@/types/mission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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

type Filter = "all" | "open" | "resolved";

export function MissionCommentsPanel({ missionId, adminName }: { missionId: string; adminName: string }) {
  const [comments, setComments] = useState<MissionComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [replyingTo, setReplyingTo] = useState<{ anchorType: string; anchorId: string | null } | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);

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

  const filtered = filter === "all" ? comments : filter === "resolved" ? comments.filter((c) => c.resolved) : comments.filter((c) => !c.resolved);

  // Group by anchor (anchorType + anchorId)
  const groups = new Map<string, MissionComment[]>();
  for (const c of filtered) {
    const key = `${c.anchorType}|${c.anchorId ?? ""}`;
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  const openCount = comments.filter((c) => !c.resolved).length;
  const resolvedCount = comments.filter((c) => c.resolved).length;

  async function postReply(anchorType: string, anchorId: string | null) {
    if (!replyBody.trim()) return;
    setBusy(true);
    try {
      await commentsStore.addAdminComment(missionId, {
        anchorType,
        anchorId,
        authorName: adminName || "Noxias",
        body: replyBody.trim(),
      });
      setReplyBody("");
      setReplyingTo(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'envoi");
    } finally {
      setBusy(false);
    }
  }

  async function setResolved(id: string, resolved: boolean) {
    try {
      await commentsStore.setResolved(id, resolved);
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
              <MessageSquareText className="h-4 w-4 text-accent" /> Commentaires
              {openCount > 0 && <Badge variant="accent" className="text-[10px]">{openCount} ouvert{openCount > 1 ? "s" : ""}</Badge>}
              {resolvedCount > 0 && <Badge variant="secondary" className="text-[10px]">{resolvedCount} résolu{resolvedCount > 1 ? "s" : ""}</Badge>}
            </CardTitle>
            <CardDescription>Échanges avec le client via le lien partagé. Vous pouvez répondre, marquer comme résolu, ou supprimer.</CardDescription>
          </div>
          <div className="inline-flex items-center gap-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {(["open", "all", "resolved"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md transition-colors ${filter === f ? "bg-accent/15 text-foreground border border-accent/30" : "hover:bg-secondary"}`}
              >
                {f === "open" ? "Ouverts" : f === "all" ? "Tous" : "Résolus"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucun commentaire {filter === "open" ? "ouvert" : filter === "resolved" ? "résolu" : ""}.</p>
        ) : (
          <div className="space-y-5">
            {Array.from(groups.entries()).map(([key, items]) => {
              const first = items[0];
              const isReplying = replyingTo?.anchorType === first.anchorType && (replyingTo?.anchorId ?? null) === (first.anchorId ?? null);
              return (
                <div key={key} className="rounded-md border border-border/60 bg-secondary/20">
                  <div className="px-4 py-2.5 border-b bg-card/60">
                    <p className="text-xs uppercase tracking-wider text-accent font-bold">{describeAnchor(first)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{items.length} message{items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="p-3 space-y-3">
                    {items.map((c) => {
                      const isAdmin = c.authorRole === "admin";
                      return (
                        <div key={c.id} className={`rounded-md p-3 ${c.resolved ? "opacity-60 bg-secondary/40" : isAdmin ? "bg-accent/5 border border-accent/20" : "bg-card border"}`}>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-sm truncate">{c.authorName || "Anonyme"}</span>
                              {isAdmin ? (
                                <Badge variant="accent" className="text-[10px]">Noxias</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">Client</Badge>
                              )}
                              {c.resolved && <Badge variant="success" className="text-[10px]">résolu</Badge>}
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(c.createdAt)}</span>
                          </div>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${c.resolved ? "line-through" : ""}`}>{c.body}</p>
                          <div className="flex items-center gap-1 mt-2 -mb-1">
                            {c.resolved ? (
                              <Button onClick={() => setResolved(c.id, false)} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                <RotateCcw className="h-3 w-3" /> Rouvrir
                              </Button>
                            ) : (
                              <Button onClick={() => setResolved(c.id, true)} variant="ghost" size="sm" className="h-6 px-2 text-xs text-emerald-700 hover:bg-emerald-50">
                                <CheckCircle2 className="h-3 w-3" /> Résolu
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
                      );
                    })}

                    {isReplying ? (
                      <div className="space-y-2 pt-2 border-t">
                        <Textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          rows={3}
                          placeholder={`Réponse de ${adminName || "Noxias"}…`}
                          disabled={busy}
                          maxLength={5000}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => { setReplyingTo(null); setReplyBody(""); }} variant="ghost" size="sm" disabled={busy}>Annuler</Button>
                          <Button onClick={() => postReply(first.anchorType, first.anchorId)} variant="accent" size="sm" disabled={busy || !replyBody.trim()}>
                            {busy ? <Loader2 className="animate-spin" /> : <Send />} Répondre
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setReplyingTo({ anchorType: first.anchorType, anchorId: first.anchorId })}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Send className="h-3.5 w-3.5" /> Répondre dans ce fil
                      </Button>
                    )}
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
