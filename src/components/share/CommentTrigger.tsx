"use client";
import { MessageSquare } from "lucide-react";
import { useComments } from "@/components/share/CommentsContext";
import { cn } from "@/lib/utils";

export function CommentTrigger({
  anchorType,
  anchorId,
  anchorLabel,
  className,
}: {
  anchorType: string;
  anchorId: string | null;
  anchorLabel: string;
  className?: string;
}) {
  const { open, countFor, unresolvedFor } = useComments();
  const count = countFor(anchorType, anchorId);
  const unresolved = unresolvedFor(anchorType, anchorId);
  const has = count > 0;

  return (
    <button
      type="button"
      onClick={() => open({ anchorType, anchorId, anchorLabel })}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 transition-all",
        has
          ? "bg-accent/15 text-accent-foreground hover:bg-accent/25 border border-accent/30"
          : "bg-secondary/50 text-muted-foreground hover:bg-accent/10 hover:text-accent border border-transparent",
        className,
      )}
      title={has ? `${count} commentaire${count > 1 ? "s" : ""}` : "Ajouter un commentaire"}
      aria-label={has ? `${count} commentaire${count > 1 ? "s" : ""}` : "Ajouter un commentaire"}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {has && (
        <span className="font-medium tabular-nums">
          {count}
          {unresolved > 0 && unresolved < count && <span className="text-amber-700">·{unresolved}</span>}
        </span>
      )}
    </button>
  );
}
