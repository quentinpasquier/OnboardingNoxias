"use client";
import { useEffect, useState } from "react";
import {
  Loader2, FileText, Send, CheckCircle2, MessageSquareQuote, Eye, Lock, ListChecks, Sparkles,
  Target, Users, Phone, Shield, Layers, Globe, ChevronDown, ChevronUp, Download, Upload,
  Trash2, FileSpreadsheet, FileType, Printer, Plus,
} from "lucide-react";
import { sharedMissionsStore } from "@/lib/supabase/missions-store";
import type { Mission, MissionFile } from "@/types/mission";
import { MATRIX_QUESTIONS, CATEGORY_GROUPS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { NoxiasLogo } from "@/components/branding/Logo";
import { formatDate } from "@/lib/utils";
import { matrixToCsv, downloadCsv } from "@/lib/share-csv";

const OBJ_CATS: Record<string, string> = {
  A: "Prestataires actuels / interne",
  B: "Budget / coût",
  C: "Temps / priorité",
  D: "Confiance / transparence",
  E: "Besoin / pertinence",
};

export function SharedMissionView({ token }: { token: string }) {
  const [mission, setMission] = useState<Mission | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      const m = await sharedMissionsStore.get(token);
      setMission(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setMission(null);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (mission === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="animate-spin h-5 w-5" /> Chargement de l'onboarding…
        </div>
      </main>
    );
  }

  if (mission === null) {
    return (
      <main className="container max-w-md py-20 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold mb-2">Lien invalide ou expiré</h1>
        <p className="text-muted-foreground mb-2">Ce lien de partage n'est pas valide. Il a peut-être été désactivé par l'équipe Noxias.</p>
        {error && <p className="text-xs text-destructive mt-4">{error}</p>}
      </main>
    );
  }

  return (
    <>
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex h-20 items-center justify-between gap-4">
          <NoxiasLogo size={48} />
          <Badge variant="outline" className="text-[10px]"><Eye className="h-3 w-3 mr-1" /> LECTURE SEULE</Badge>
        </div>
      </header>

      <main className="container max-w-5xl py-12 noxias-page-in space-y-6">
        <section className="text-center mb-2">
          <p className="text-xs uppercase tracking-[0.22em] text-noxias-muted mb-3 font-medium">▶ ONBOARDING NOXIAS</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3 text-noxias-ink">{mission.clientName}</h1>
          {mission.clientWebsite && (
            <a href={mission.clientWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> {mission.clientWebsite}
            </a>
          )}
          <p className="text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
            Cet espace partagé synthétise le travail de cadrage de votre prospection. Vous pouvez consulter chaque module, exporter au format de votre choix, ajouter vos documents et nous laisser vos recommandations.
          </p>
        </section>

        <LibraryModule mission={mission} token={token} onChange={reload} />

        <MatrixModule mission={mission} token={token} />

        {mission.toolbox && <ToolboxModule mission={mission} token={token} />}

        <RecommendationsForm token={token} initialValue={mission.recommendations ?? ""} />

        <footer className="text-center mt-12 pt-8 border-t text-xs text-muted-foreground">
          <p>▶ Onboarding Noxias · {mission.clientName} · Mis à jour le {formatDate(mission.updatedAt)}</p>
          <p className="mt-1">Document confidentiel destiné au client. Aucune indexation.</p>
        </footer>
      </main>
    </>
  );
}

// ============================================================================
// Module dépliable générique
// ============================================================================
function CollapsibleModule({
  icon, title, subtitle, defaultOpen = true, actions, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-secondary/30 border-b">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 text-left flex-1 min-w-0 group"
          >
            <span className="text-accent shrink-0">{icon}</span>
            <span className="min-w-0">
              <CardTitle className="text-lg font-display group-hover:text-accent transition-colors">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>
            </span>
            <span className="ml-auto text-muted-foreground group-hover:text-accent transition-colors">
              {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </span>
          </button>
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      </CardHeader>
      {open && <CardContent className="py-6">{children}</CardContent>}
    </Card>
  );
}

// ============================================================================
// Module bibliothèque (avec upload / suppression)
// ============================================================================
function LibraryModule({ mission, token, onChange }: { mission: Mission; token: string; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteName, setPasteName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [viewing, setViewing] = useState<MissionFile | null>(null);

  async function onPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("pdf");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Erreur d'extraction (${res.status})`);
      const { text } = await res.json();
      await sharedMissionsStore.addFile(token, file.name, text || "(PDF vide)");
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function onPaste(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteName.trim() || !pasteText.trim()) return;
    setBusy("paste");
    setError(null);
    try {
      await sharedMissionsStore.addFile(token, pasteName.trim(), pasteText.trim());
      setPasteName("");
      setPasteText("");
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function deleteFile(id: string) {
    setBusy("delete");
    try {
      await sharedMissionsStore.removeFile(token, id);
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  return (
    <CollapsibleModule
      icon={<FileText className="h-6 w-6" />}
      title="Bibliothèque de documents"
      subtitle={`${mission.files.length} document${mission.files.length > 1 ? "s" : ""} · documents partagés avec Noxias pour cadrer la mission`}
      defaultOpen={false}
    >
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="space-y-4">
          <p className="text-sm font-medium text-noxias-deep">Ajouter un document</p>
          <Label className="border border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
            {busy === "pdf" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-accent" />}
            <span className="text-sm font-medium">Importer un PDF</span>
            <span className="text-xs text-muted-foreground text-center">Brief, audit, plaquette, présentation…</span>
            <input type="file" accept="application/pdf" className="sr-only" onChange={onPdfUpload} disabled={busy === "pdf"} />
          </Label>

          <form onSubmit={onPaste} className="space-y-2 border border-dashed border-border rounded-lg p-4">
            <p className="text-sm font-medium">Coller du texte</p>
            <Input placeholder="Titre du document" value={pasteName} onChange={(e) => setPasteName(e.target.value)} disabled={busy === "paste"} />
            <Textarea placeholder="Contenu (transcription, mail, brief…)" rows={4} value={pasteText} onChange={(e) => setPasteText(e.target.value)} disabled={busy === "paste"} />
            <Button type="submit" variant="outline" size="sm" disabled={busy === "paste" || !pasteName.trim() || !pasteText.trim()}>
              {busy === "paste" ? <Loader2 className="animate-spin" /> : <Plus />} Ajouter
            </Button>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div>
          <p className="text-sm font-medium text-noxias-deep mb-3">Documents partagés ({mission.files.length})</p>
          {mission.files.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucun document pour l'instant. Ajoutez-en à gauche pour enrichir le contexte de la mission.</p>
          ) : (
            <ul className="space-y-2">
              {mission.files.map((f) => {
                const fromClient = f.addedBy === "client";
                return (
                  <li key={f.id} className="rounded-md border border-border/60 hover:border-accent/40 transition-colors">
                    <div className="flex items-start gap-2 p-2.5">
                      <button
                        type="button"
                        onClick={() => setViewing(f)}
                        className="flex items-start gap-2 flex-1 min-w-0 text-left group hover:text-accent transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-accent transition-colors" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{f.name}</span>
                          <span className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px]">{Math.round(f.excerpt.length / 1000)} k caractères</Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(f.addedAt)}</span>
                            {fromClient && <Badge variant="outline" className="text-[10px]">Ajouté par vous</Badge>}
                          </span>
                        </span>
                      </button>
                      {fromClient && (
                        <ConfirmButton
                          onConfirm={() => deleteFile(f.id)}
                          question="Retirer ?"
                          confirmLabel="Retirer"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </ConfirmButton>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={viewing !== null} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate"><FileText className="h-5 w-5 text-accent shrink-0" /> {viewing?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto rounded-md border bg-card/50 p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">
            {viewing?.excerpt || "(contenu vide)"}
          </div>
          <div className="flex justify-end pt-2">
            <DialogClose asChild><Button variant="ghost">Fermer</Button></DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </CollapsibleModule>
  );
}

// ============================================================================
// Module Matrice
// ============================================================================
function MatrixModule({ mission, token }: { mission: Mission; token: string }) {
  const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim());
  const total = MATRIX_QUESTIONS.length;

  function exportCsv() {
    const safeName = mission.clientName.replace(/[^a-zA-Z0-9-_]/g, "_");
    downloadCsv(`${safeName}-matrice.csv`, matrixToCsv(mission));
  }

  function exportPdf() {
    window.open(`/share/${token}/print?scope=matrix`, "_blank", "noopener");
  }

  return (
    <CollapsibleModule
      icon={<ListChecks className="h-6 w-6" />}
      title="Matrice de prospection"
      subtitle={`${answered.length} / ${total} réponses · cadrage stratégique`}
      defaultOpen={true}
      actions={<ExportToolbar onCsv={exportCsv} onPdf={exportPdf} onDocx={() => exportSharedDocx(token, "matrix", mission.clientName)} />}
    >
      {answered.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Aucune réponse pour l'instant.</p>
      ) : (
        <div className="space-y-6">
          {CATEGORY_GROUPS.map((g) => {
            const groupAnswers = g.ids.map((id) => MATRIX_QUESTIONS.find((q) => q.id === id)!).filter((q) => mission.matrix[q.id]?.trim());
            if (groupAnswers.length === 0) return null;
            return (
              <div key={g.label}>
                <h3 className="text-xs uppercase tracking-[0.18em] text-accent font-bold mb-3">{g.label}</h3>
                <div className="space-y-3">
                  {groupAnswers.map((q) => (
                    <Card key={q.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-2 flex-wrap">
                          <Badge variant="secondary">#{q.id}</Badge>
                          <CardTitle className="text-base">{q.question}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ProseRender text={mission.matrix[q.id]} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleModule>
  );
}

// ============================================================================
// Module Boîte à outils
// ============================================================================
function ToolboxModule({ mission, token }: { mission: Mission; token: string }) {
  const tb = mission.toolbox!;
  const sectionCount = [
    tb.positioning?.intro,
    tb.personas.length > 0,
    tb.killerArguments.length > 0 || tb.disqualified,
    tb.pitch.length > 0,
    tb.objections.length > 0,
    tb.qualification?.criteria?.length > 0,
  ].filter(Boolean).length;

  function exportPdf() {
    window.open(`/share/${token}/print?scope=toolbox`, "_blank", "noopener");
  }

  return (
    <CollapsibleModule
      icon={<Sparkles className="h-6 w-6" />}
      title="Boîte à outils du commercial"
      subtitle={`${sectionCount} / 6 sections · livrable opérationnel`}
      defaultOpen={true}
      actions={<ExportToolbar onPdf={exportPdf} onDocx={() => exportSharedDocx(token, "toolbox", mission.clientName)} />}
    >
      <div className="space-y-10">
        {tb.positioning?.intro && <PositioningBlock tb={tb} />}
        {tb.personas.length > 0 && <PersonasBlock tb={tb} />}
        {(tb.killerArguments.length > 0 || tb.disqualified) && <ArgumentsBlock tb={tb} />}
        {tb.pitch.length > 0 && <PitchBlock tb={tb} />}
        {tb.objections.length > 0 && <ObjectionsBlock tb={tb} />}
        {tb.qualification?.criteria?.length > 0 && <QualificationBlock tb={tb} />}
      </div>
    </CollapsibleModule>
  );
}

function ExportToolbar({ onCsv, onDocx, onPdf }: { onCsv?: () => void; onDocx?: () => void; onPdf?: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Exporter</span>
      {onCsv && <Button onClick={onCsv} variant="outline" size="sm" title="Exporter en CSV"><FileSpreadsheet /> CSV</Button>}
      {onDocx && <Button onClick={onDocx} variant="outline" size="sm" title="Exporter en Word"><FileType /> DOCX</Button>}
      {onPdf && <Button onClick={onPdf} variant="outline" size="sm" title="Exporter en PDF"><Printer /> PDF</Button>}
    </div>
  );
}

async function exportSharedDocx(token: string, scope: "matrix" | "toolbox" | "both", clientName: string) {
  try {
    const res = await fetch("/api/share/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, scope }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Erreur ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = clientName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const suffix = scope === "matrix" ? "matrice" : scope === "toolbox" ? "boite-a-outils" : "onboarding";
    a.download = `${safe}-${suffix}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    alert(err instanceof Error ? err.message : "Export DOCX impossible");
  }
}

// ============================================================================
// Sous-blocs de la boîte à outils
// ============================================================================
function PositioningBlock({ tb }: { tb: NonNullable<Mission["toolbox"]> }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-accent" /> Positionnement</h3>
      <Card>
        <CardContent className="py-6 space-y-5">
          {tb.positioning.intro && (
            <div>
              <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">Cadrage</p>
              <ProseRender text={tb.positioning.intro} />
            </div>
          )}
          {tb.positioning.promise && (
            <div className="rounded-md bg-accent/10 border-l-4 border-accent p-4">
              <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">Promesse centrale</p>
              <p className="text-base font-medium leading-relaxed">{tb.positioning.promise}</p>
            </div>
          )}
          {tb.positioning.services && (
            <div>
              <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">Services à mettre en avant</p>
              <ProseRender text={tb.positioning.services} />
            </div>
          )}
          {tb.positioning.targets && (
            <div>
              <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">Cibles à prioriser</p>
              <ProseRender text={tb.positioning.targets} />
            </div>
          )}
          {tb.positioning.valueResult && (
            <div>
              <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">Résultat promis (30 à 60 jours)</p>
              <ProseRender text={tb.positioning.valueResult} />
            </div>
          )}
          {tb.positioning.phrases?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Phrases à marteler</p>
              <ul className="space-y-2">
                {tb.positioning.phrases.map((p, i) => (
                  <li key={i} className="italic text-noxias-deep border-l-2 border-accent/40 pl-3">« {p} »</li>
                ))}
              </ul>
            </div>
          )}
          {tb.positioning.finalAnchor && (
            <div className="rounded-md bg-noxias-deep text-white p-4">
              <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">Ancrage final</p>
              <p className="text-base leading-relaxed">{tb.positioning.finalAnchor}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PersonasBlock({ tb }: { tb: NonNullable<Mission["toolbox"]> }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> Personas cibles</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {tb.personas.map((p, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base">{p.title}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-wider text-accent font-bold">PERSONA {String(i + 1).padStart(2, "0")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {p.profile && <div><p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Profil</p><ProseRender text={p.profile} /></div>}
              {p.kpis && <div><p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">KPIs & métriques</p><ProseRender text={p.kpis} /></div>}
              {p.pains && <div><p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Douleurs & freins</p><ProseRender text={p.pains} /></div>}
              {p.motivations && <div><p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Motivations</p><ProseRender text={p.motivations} /></div>}
              {p.triggers && <div><p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Déclencheurs d'achat</p><ProseRender text={p.triggers} /></div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ArgumentsBlock({ tb }: { tb: NonNullable<Mission["toolbox"]> }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold mb-3">Arguments massue & disqualification</h3>
      {tb.killerArguments.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          {tb.killerArguments.map((a, i) => (
            <div key={i} className="rounded-md border-l-4 border-accent bg-accent/5 p-4">
              <p className="font-display italic text-base font-bold mb-2">« {a.headline} »</p>
              <div className="text-sm text-muted-foreground"><ProseRender text={a.body} /></div>
            </div>
          ))}
        </div>
      )}
      {tb.disqualified && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Profils à disqualifier</CardTitle></CardHeader>
          <CardContent><ProseRender text={tb.disqualified} /></CardContent>
        </Card>
      )}
    </div>
  );
}

function PitchBlock({ tb }: { tb: NonNullable<Mission["toolbox"]> }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2"><Phone className="h-5 w-5 text-accent" /> Pitch V1</h3>
      <div className="space-y-4">
        {tb.pitch.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{s.id}</Badge>
                <CardTitle className="text-base">{s.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.scripts.map((sc, i) => (
                <div key={i} className="border-l-2 border-accent/30 pl-4">
                  <p className="text-xs uppercase tracking-wider text-accent font-bold mb-1">{sc.variant}</p>
                  <p className="text-sm leading-relaxed italic whitespace-pre-wrap">{sc.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ObjectionsBlock({ tb }: { tb: NonNullable<Mission["toolbox"]> }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2"><Shield className="h-5 w-5 text-accent" /> Traitement des objections</h3>
      <div className="space-y-5">
        {(["A", "B", "C", "D", "E"] as const).map((code) => {
          const items = tb.objections.filter((o) => o.category === code).sort((a, b) => a.id - b.id);
          if (items.length === 0) return null;
          return (
            <Card key={code}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="accent">{code}</Badge>
                  <CardTitle className="text-base">{OBJ_CATS[code]}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((o) => (
                  <div key={o.id} className="border-l-2 border-border pl-4">
                    <p className="italic font-medium text-sm text-noxias-deep mb-1.5">{o.id}. « {o.text} »</p>
                    <p className="text-sm italic leading-relaxed whitespace-pre-wrap">{o.response}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function QualificationBlock({ tb }: { tb: NonNullable<Mission["toolbox"]> }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2"><Layers className="h-5 w-5 text-accent" /> Matrice de qualification (R1)</h3>
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground mb-4 italic">Lead « Qualifié pour R2 » si score ≥ 7/10. Cinq critères, chacun noté 0/1/2.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-noxias-deep text-white">
                  <th className="text-left p-3 font-bold">Critère</th>
                  <th className="text-left p-3 font-bold">0 · faible</th>
                  <th className="text-left p-3 font-bold">1 · moyen</th>
                  <th className="text-left p-3 font-bold">2 · élevé</th>
                </tr>
              </thead>
              <tbody>
                {tb.qualification.criteria.map((c, i) => (
                  <tr key={i} className="border-b">
                    <th className="text-left p-3 bg-accent/5 font-bold">{c.label}</th>
                    <td className="p-3 align-top">{c.score0}</td>
                    <td className="p-3 align-top">{c.score1}</td>
                    <td className="p-3 align-top">{c.score2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tb.qualification.tiers.length > 0 && (
            <div className="grid md:grid-cols-3 gap-3 mt-6">
              {tb.qualification.tiers.map((t, i) => (
                <div key={i} className={`rounded-md p-4 ${i === 0 ? "bg-accent/10 border-t-4 border-accent" : i === 1 ? "bg-amber-50 border-t-4 border-amber-500" : "bg-secondary border-t-4 border-muted-foreground"}`}>
                  <p className="text-xs uppercase tracking-wider font-bold mb-1">{i === 0 ? "PRIORITÉ ABSOLUE" : i === 1 ? "À NOURRIR" : "DISQUALIFIÉ"}</p>
                  <p className="font-display text-base font-bold">{t.name}</p>
                  <p className="text-xs italic mb-2">Score {t.score}</p>
                  <p className="text-sm">{t.description}</p>
                  <p className="text-xs mt-2"><strong>Action :</strong> <em>{t.action}</em></p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Formulaire recommandations
// ============================================================================
function RecommendationsForm({ token, initialValue }: { token: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(initialValue.trim().length > 0);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sharedMissionsStore.submitRecommendations(token, value.trim());
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquareQuote className="h-5 w-5 text-accent" /> Vos recommandations globales
        </CardTitle>
        <CardDescription>
          Pour des retours précis sur un élément (un script du pitch, une objection, un persona…), utilisez le système de commentaires bientôt disponible. Ici, vous pouvez nous transmettre une vision d'ensemble.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => { setValue(e.target.value); setDone(false); }}
            rows={6}
            maxLength={10000}
            placeholder="Ex. Sur le pitch 4.0, j'aimerais qu'on insiste plus sur l'argument prix. Sur les personas, j'ajouterais le DAF en cible secondaire…"
            disabled={busy}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{value.length} / 10 000 caractères</p>
            <div className="flex items-center gap-3">
              {done && !busy && (
                <span className="text-sm text-emerald-700 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Envoyé
                </span>
              )}
              <Button type="submit" variant="accent" disabled={busy || !value.trim()}>
                {busy ? <><Loader2 className="animate-spin" /> Envoi…</> : <><Send /> Envoyer à Noxias</>}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function ProseRender({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  function flush() {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`b-${blocks.length}`} className="space-y-1.5 my-2 list-none">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 leading-relaxed text-sm">
            <span className="mt-[0.55em] h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  }

  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(/^[-•*]\s+(.+)$/);
    if (m) bullets.push(m[1]);
    else if (line.length === 0) flush();
    else { flush(); blocks.push(<p key={`p-${blocks.length}`} className="text-sm leading-relaxed my-1">{line}</p>); }
  }
  flush();
  return <div>{blocks}</div>;
}
