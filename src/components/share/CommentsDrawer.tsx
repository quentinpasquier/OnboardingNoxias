"use client";
import { useEffect, useRef, useState } from "react";
import { X, Send, CheckCircle2, Trash2, Loader2, MessageSquareText } from "lucide-react";
import { useComments } from "@/components/share/CommentsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { formatDate } from "@/lib/utils";

export function CommentsDrawer() {
  const { active, close, comments, authorName, setAuthorName, add, remove } = useComments();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const open = active !== null;
  const thread = active
    ? comments
        .filter((c) => c.anchorType === active.anchorType && (c.anchorId ?? null) === active.anchorId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];

  useEffect(() => {
    if (open) {
      setBody("");
      setError(null);
      setTimeout(() => textareaRef.current?.focus(), 60);
    }
  }, [open, active?.anchorType, active?.anchorId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    if (!body.trim()) return;
    if (!authorName.trim()) {
      setError("Indiquez votre nom au-dessus avant de commenter.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await add(active, body.trim());
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'envoi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={close}
        aria-hidden
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-screen w-full sm:w-[420px] bg-card border-l shadow-2xl transition-transform duration-200 ease-out flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-label="Fil de commentaires"
      >
        {active && (
          <>
            <header className="border-b p-4 flex items-start justify-between gap-3 bg-secondary/30">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1 inline-flex items-center gap-1.5">
                  <MessageSquareText className="h-3.5 w-3.5" /> Fil de discussion
                </p>
                <h3 className="font-display font-bold text-base leading-tight truncate">{active.anchorLabel}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{thread.length} message{thread.length > 1 ? "s" : ""}</p>
              </div>
              <button onClick={close} className="text-muted-foreground hover:text-foreground p-1 -mr-1" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="px-4 py-3 border-b bg-card">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Votre nom (visible par Noxias)</label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Prénom Nom"
                maxLength={100}
                className="h-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {thread.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">Pas encore de commentaire sur cet élément. Laissez le premier ! L'équipe Noxias verra votre retour et le prendra en compte.</p>
              ) : (
                thread.map((c) => (
                  <CommentBubble
                    key={c.id}
                    comment={c}
                    onDelete={() => remove(c.id).catch((e) => setError(e instanceof Error ? e.message : "Erreur"))}
                  />
                ))
              )}
            </div>

            <form onSubmit={submit} className="border-t p-3 space-y-2 bg-card">
              <Textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={5000}
                placeholder="Votre commentaire…"
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    submit(e as unknown as React.FormEvent);
                  }
                }}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{body.length} / 5000 · ⌘/Ctrl + Entrée pour envoyer</span>
                <Button type="submit" variant="accent" size="sm" disabled={busy || !body.trim() || !authorName.trim()}>
                  {busy ? <Loader2 className="animate-spin" /> : <Send />} Envoyer
                </Button>
              </div>
            </form>
          </>
        )}
      </aside>
    </>
  );
}

function CommentBubble({
  comment,
  onDelete,
}: {
  comment: import("@/types/mission").MissionComment;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-lg border p-3 transition-opacity ${comment.resolved ? "opacity-60 bg-secondary/40" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm truncate">{comment.authorName || "Anonyme"}</span>
          {comment.resolved && <Badge variant="success" className="text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> traité par Noxias</Badge>}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(comment.createdAt)}</span>
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${comment.resolved ? "line-through" : ""}`}>{comment.body}</p>
      <div className="flex items-center gap-1 mt-2 -mb-1">
        <ConfirmButton
          onConfirm={onDelete}
          question="Retirer ce commentaire ?"
          confirmLabel="Retirer"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Retirer
        </ConfirmButton>
      </div>
    </div>
  );
}
