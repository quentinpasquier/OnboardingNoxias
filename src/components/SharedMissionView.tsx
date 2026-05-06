"use client";
import { useEffect, useState } from "react";
import { Loader2, FileText, Send, CheckCircle2, MessageSquareQuote, Eye, Lock, ListChecks, Sparkles, Target, Users, Phone, Shield, Layers, Globe } from "lucide-react";
import { sharedMissionsStore } from "@/lib/supabase/missions-store";
import type { Mission, MissionFile } from "@/types/mission";
import { MATRIX_QUESTIONS, CATEGORY_GROUPS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { NoxiasLogo } from "@/components/branding/Logo";
import { formatDate } from "@/lib/utils";

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

  useEffect(() => {
    sharedMissionsStore
      .get(token)
      .then((m) => setMission(m))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Erreur de chargement");
        setMission(null);
      });
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

  const tb = mission.toolbox;

  return (
    <>
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container flex h-20 items-center justify-between gap-4">
          <NoxiasLogo size={48} />
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px]"><Eye className="h-3 w-3 mr-1" /> LECTURE SEULE</Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-12 noxias-page-in">
        <section className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-noxias-muted mb-3 font-medium">▶ ONBOARDING NOXIAS</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3 text-noxias-ink">
            {mission.clientName}
          </h1>
          {mission.clientWebsite && (
            <a href={mission.clientWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> {mission.clientWebsite}
            </a>
          )}
          <p className="text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
            Cet espace partagé synthétise le travail de cadrage de votre prospection, mené avec l'équipe Noxias. Vous pouvez le consulter, et nous laisser vos recommandations en bas de page.
          </p>
        </section>

        {mission.files.length > 0 && (
          <SharedFilesSection files={mission.files} />
        )}

        <SharedMatrixSection mission={mission} />

        {tb && <SharedToolboxSection tb={tb} />}

        <RecommendationsForm token={token} initialValue={mission.recommendations ?? ""} />

        <footer className="text-center mt-16 pt-8 border-t text-xs text-muted-foreground">
          <p>▶ Onboarding Noxias · {mission.clientName} · Partage généré le {formatDate(mission.updatedAt)}</p>
          <p className="mt-1">Document confidentiel destiné au client. Aucune indexation.</p>
        </footer>
      </main>
    </>
  );
}

function SharedFilesSection({ files }: { files: MissionFile[] }) {
  const [viewing, setViewing] = useState<MissionFile | null>(null);
  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-accent" /> Bibliothèque des documents
      </h2>
      <p className="text-sm text-muted-foreground mb-5">Documents que vous avez transmis et qui ont servi de socle à ce travail. Cliquez pour consulter.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setViewing(f)}
            className="text-left rounded-md border border-border/60 hover:border-accent/40 hover:bg-accent/5 transition-colors p-3 flex items-start gap-3 group"
          >
            <FileText className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">{f.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{Math.round(f.excerpt.length / 1000)} k caractères · {formatDate(f.addedAt)}</p>
            </div>
          </button>
        ))}
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
    </section>
  );
}

function SharedMatrixSection({ mission }: { mission: Mission }) {
  const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim());
  if (answered.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
        <ListChecks className="h-6 w-6 text-accent" /> Matrice de prospection
      </h2>
      <p className="text-sm text-muted-foreground mb-5">{answered.length} réponse{answered.length > 1 ? "s" : ""} structurée{answered.length > 1 ? "s" : ""} sur les {MATRIX_QUESTIONS.length} questions du cadrage.</p>
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
    </section>
  );
}

function SharedToolboxSection({ tb }: { tb: NonNullable<Mission["toolbox"]> }) {
  return (
    <section className="mb-12 space-y-10">
      <div>
        <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" /> Boîte à outils du commercial
        </h2>
        <p className="text-sm text-muted-foreground">Toutes les briques opérationnelles co-construites pour armer vos équipes commerciales.</p>
      </div>

      {tb.positioning?.intro && <PositioningBlock tb={tb} />}
      {tb.personas.length > 0 && <PersonasBlock tb={tb} />}
      {(tb.killerArguments.length > 0 || tb.disqualified) && <ArgumentsBlock tb={tb} />}
      {tb.pitch.length > 0 && <PitchBlock tb={tb} />}
      {tb.objections.length > 0 && <ObjectionsBlock tb={tb} />}
      {tb.qualification?.criteria?.length > 0 && <QualificationBlock tb={tb} />}
    </section>
  );
}

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
    <Card className="mt-12 border-accent/40 bg-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquareQuote className="h-5 w-5 text-accent" /> Vos recommandations
        </CardTitle>
        <CardDescription>
          Vous souhaitez ajuster un élément du pitch, faire évoluer la stratégie de prospection, ou nous transmettre un retour ? Écrivez-le ici. L'équipe Noxias verra votre message dans son interface.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            value={value}
            onChange={(e) => { setValue(e.target.value); setDone(false); }}
            rows={8}
            maxLength={10000}
            placeholder="Ex. Sur le pitch 4.0, j'aimerais qu'on insiste plus sur l'argument prix. Sur les personas, j'ajouterais le DAF en cible secondaire. Côté objections D, on voit aussi…"
            disabled={busy}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{value.length} / 10 000 caractères</p>
            <div className="flex items-center gap-3">
              {done && !busy && (
                <span className="text-sm text-emerald-700 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Recommandations envoyées
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
