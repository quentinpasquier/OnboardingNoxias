"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BonhommeError } from "@/components/illustrations/Bonhomme";

export function AtelierShell({
  missionId,
  clientName,
  atelierLabel,
  atelierTitle,
  atelierDescription,
  rightBadge,
  children,
}: {
  missionId: string;
  clientName: string;
  atelierLabel: string;
  atelierTitle: string;
  atelierDescription?: string;
  rightBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="container max-w-7xl py-10 noxias-page-in">
      <div className="mb-10">
        <Link href={`/missions/${missionId}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Onboarding · {clientName}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent font-medium mb-2">{atelierLabel}</p>
            <h1 className="font-display text-4xl font-bold tracking-tight">{atelierTitle}</h1>
            {atelierDescription && <p className="text-muted-foreground mt-2 max-w-2xl text-base leading-relaxed">{atelierDescription}</p>}
          </div>
          {rightBadge}
        </div>
      </div>
      {children}
    </main>
  );
}

export function BackToHubButton({ missionId }: { missionId: string }) {
  return (
    <Link href={`/missions/${missionId}`}>
      <Button variant="ghost" size="sm">← Retour mission</Button>
    </Link>
  );
}

export function AtelierLoading() {
  return (
    <main className="container max-w-7xl py-10">
      <div className="animate-pulse">
        <div className="h-3 w-32 bg-secondary rounded mb-4" />
        <div className="h-9 w-72 bg-secondary rounded mb-2" />
        <div className="h-4 w-96 bg-secondary/60 rounded mb-8" />
        <div className="rounded-lg border bg-card p-6 mb-4 space-y-3">
          <div className="h-4 w-1/3 bg-secondary rounded" />
          <div className="h-3 w-2/3 bg-secondary/60 rounded" />
          <div className="h-24 w-full bg-secondary/40 rounded" />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <div className="h-4 w-1/3 bg-secondary rounded" />
          <div className="h-24 w-full bg-secondary/40 rounded" />
        </div>
      </div>
    </main>
  );
}

export function AtelierNotFound() {
  return (
    <main className="container max-w-md py-20 text-center noxias-page-in">
      <BonhommeError size={140} className="mb-6" />
      <h1 className="font-display text-2xl font-bold mb-2">Onboarding introuvable</h1>
      <p className="text-muted-foreground mb-6">Ce dossier client n'existe plus, ou tu n'as plus accès.</p>
      <Link href="/"><Button variant="accent"><ArrowLeft /> Retour aux onboardings</Button></Link>
    </main>
  );
}

export { Badge };
