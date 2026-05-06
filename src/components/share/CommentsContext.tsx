"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { sharedMissionsStore } from "@/lib/supabase/missions-store";
import type { MissionComment } from "@/types/mission";

type AnchorTarget = {
  anchorType: string;
  anchorId: string | null;
  anchorLabel: string;
};

type CommentsCtx = {
  comments: MissionComment[];
  loading: boolean;
  error: string | null;
  authorName: string;
  setAuthorName: (n: string) => void;
  countFor: (anchorType: string, anchorId: string | null) => number;
  unresolvedFor: (anchorType: string, anchorId: string | null) => number;
  open: (target: AnchorTarget) => void;
  close: () => void;
  active: AnchorTarget | null;
  add: (target: AnchorTarget, body: string) => Promise<MissionComment>;
  resolve: (id: string, resolved: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const Ctx = createContext<CommentsCtx | null>(null);

const NAME_LS_KEY = "noxias-share-comment-name";

export function CommentsProvider({ token, children }: { token: string; children: React.ReactNode }) {
  const [comments, setComments] = useState<MissionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<AnchorTarget | null>(null);
  const [authorName, setAuthorNameState] = useState("");

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(NAME_LS_KEY) : null;
      if (stored) setAuthorNameState(stored);
    } catch {}
    sharedMissionsStore
      .listComments(token)
      .then((list) => setComments(list))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [token]);

  const setAuthorName = useCallback((n: string) => {
    setAuthorNameState(n);
    try {
      if (typeof window !== "undefined") localStorage.setItem(NAME_LS_KEY, n);
    } catch {}
  }, []);

  const countFor = useCallback(
    (anchorType: string, anchorId: string | null) =>
      comments.filter((c) => c.anchorType === anchorType && (c.anchorId ?? null) === anchorId).length,
    [comments],
  );

  const unresolvedFor = useCallback(
    (anchorType: string, anchorId: string | null) =>
      comments.filter((c) => c.anchorType === anchorType && (c.anchorId ?? null) === anchorId && !c.resolved).length,
    [comments],
  );

  const open = useCallback((target: AnchorTarget) => setActive(target), []);
  const close = useCallback(() => setActive(null), []);

  const add = useCallback(async (target: AnchorTarget, body: string) => {
    if (!authorName.trim()) throw new Error("Renseignez d'abord votre nom.");
    const c = await sharedMissionsStore.addComment(token, {
      anchorType: target.anchorType,
      anchorId: target.anchorId,
      authorName: authorName.trim(),
      body,
    });
    setComments((cs) => [...cs, c]);
    return c;
  }, [authorName, token]);

  const resolve = useCallback(async (id: string, resolved: boolean) => {
    await sharedMissionsStore.resolveComment(token, id, resolved);
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, resolved } : c)));
  }, [token]);

  const remove = useCallback(async (id: string) => {
    await sharedMissionsStore.deleteComment(token, id);
    setComments((cs) => cs.filter((c) => c.id !== id));
  }, [token]);

  const value = useMemo<CommentsCtx>(() => ({
    comments, loading, error, authorName, setAuthorName, countFor, unresolvedFor,
    open, close, active, add, resolve, remove,
  }), [comments, loading, error, authorName, setAuthorName, countFor, unresolvedFor, open, close, active, add, resolve, remove]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useComments() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useComments must be used inside CommentsProvider");
  return ctx;
}
