"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, FileText, Sparkles, Loader2 } from "lucide-react";
import { missionsStore } from "@/lib/supabase/missions-store";
import { emptyMission, type Mission } from "@/types/mission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { formatDate } from "@/lib/utils";

export function Dashboard() {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clientName, setClientName] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    missionsStore.list()
      .then(setMissions)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"));
  }, []);

  async function createMission(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) return;
    setBusy(true);
    try {
      const m = emptyMission(clientName.trim());
      if (website.trim()) m.clientWebsite = website.trim();
      const saved = await missionsStore.create(m);
      setClientName("");
      setWebsite("");
      setOpen(false);
      window.location.href = `/missions/${saved.id}`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur création");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container max-w-6xl py-12">
      <section className="mb-12 noxias-hero-glow rounded-2xl p-8 md:p-10 -mx-2">
        <p className="text-xs uppercase tracking-[0.22em] text-noxias-muted mb-4 font-medium">Atelier prospection · co-construction client</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4 max-w-3xl leading-[1.05] text-noxias-ink">
          La matrice et la boîte à outils du commercial, <span className="text-accent">prêtes en 2 h</span>.
        </h1>
        <p className="text-noxias-muted max-w-2xl text-base md:text-lg leading-relaxed">
          Vous interviewez le client, l'IA structure, vous arbitrez. À la sortie : deux livrables actionnables, calés sur la méthode Noxias.
        </p>
      </section>

      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-medium">Missions</h2>
          <p className="text-sm text-muted-foreground mt-1">{missions === null ? "Chargement…" : `${missions.length} mission${missions.length > 1 ? "s" : ""}`}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="lg">
              <Plus /> Nouvelle mission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={createMission}>
              <DialogHeader>
                <DialogTitle>Nouvelle mission de prospection</DialogTitle>
                <DialogDescription>Crée un dossier client. Tu pourras ajouter des documents, remplir la matrice et générer la boîte à outils ensuite.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientName">Nom du client</Label>
                  <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="ex. Bowigo" autoFocus required disabled={busy} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Site web (optionnel)</Label>
                  <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" type="url" disabled={busy} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <DialogClose asChild>
                  <Button variant="ghost" type="button" disabled={busy}>Annuler</Button>
                </DialogClose>
                <Button type="submit" variant="accent" disabled={busy}>
                  {busy ? <><Loader2 className="animate-spin" /> Création…</> : <>Créer la mission <ArrowRight /></>}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5 mb-4">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {missions !== null && missions.length === 0 && !error && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-accent/10 p-4 mb-4"><Sparkles className="h-6 w-6 text-accent" /></div>
            <h3 className="font-display text-lg mb-2">Aucune mission pour l'instant</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">Crée ta première mission pour démarrer un atelier de prospection avec un client. Tu pourras y associer des documents (brief, plaquette, site web) et co-construire les livrables.</p>
            <Button onClick={() => setOpen(true)} variant="accent"><Plus /> Créer une mission</Button>
          </CardContent>
        </Card>
      )}

      {missions !== null && missions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((m) => <MissionCard key={m.id} mission={m} />)}
        </div>
      )}
    </main>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  const answered = Object.values(mission.matrix).filter((v) => v && v.trim().length > 0).length;
  const matrixPct = Math.round((answered / MATRIX_QUESTIONS.length) * 100);
  const toolboxReady = !!mission.toolbox;

  return (
    <Link href={`/missions/${mission.id}`} className="group">
      <Card className="h-full hover:border-accent/50 hover:shadow-md transition-all">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="group-hover:text-accent transition-colors">{mission.clientName}</CardTitle>
            <Badge variant={toolboxReady ? "accent" : "secondary"}>{toolboxReady ? "Boîte prête" : "En cours"}</Badge>
          </div>
          <CardDescription>{mission.clientWebsite || "—"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Matrice de prospection</span>
              <span className="font-medium text-foreground">{answered}/{MATRIX_QUESTIONS.length}</span>
            </div>
            <Progress value={matrixPct} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {mission.files.length} document{mission.files.length > 1 ? "s" : ""}</span>
            <span>Maj {formatDate(mission.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
