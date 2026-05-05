"use client";
import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Users, MessageSquare, Phone, Shield, Target } from "lucide-react";
import type { Mission } from "@/types/mission";
import type { Toolbox } from "@/lib/toolbox-schema";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OBJECTION_CATEGORIES } from "@/lib/toolbox-schema";

export function ToolboxPanel({ mission, update }: { mission: Mission; update: (m: Mission) => void }) {
  const answered = Object.values(mission.matrix).filter((v) => v && v.trim().length > 0).length;
  const ratio = answered / MATRIX_QUESTIONS.length;

  if (!mission.toolbox) return <ToolboxEmpty mission={mission} update={update} ratio={ratio} answered={answered} />;
  return <ToolboxView mission={mission} update={update} />;
}

function ToolboxEmpty({ mission, update, ratio, answered }: { mission: Mission; update: (m: Mission) => void; ratio: number; answered: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-toolbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, refineInstructions: instructions.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`);
      update({ ...mission, toolbox: data.toolbox as Toolbox });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const lowMatrix = ratio < 0.5;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> Génération de la boîte à outils</CardTitle>
        <CardDescription>L'IA construit personas, argumentaires, pitch ramifié, 30 objections et matrice de qualification, à partir de la matrice et du contexte client.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {lowMatrix && (
          <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Matrice peu remplie ({answered}/{MATRIX_QUESTIONS.length})</p>
              <p className="text-amber-800">L'IA peut générer mais le résultat sera moins ancré. Idéal : ≥ 20 réponses.</p>
            </div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium block mb-1.5">Instructions optionnelles</label>
          <Textarea
            placeholder="Ex. ton plus direct, prioriser le persona dirigeant, accentuer l'objection budget…"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">~30s à 2 min selon la richesse du contexte. Coût estimé : 5–15 ¢ par génération.</p>
          <Button onClick={generate} disabled={busy} variant="accent" size="lg">
            {busy ? <><Loader2 className="animate-spin" /> Génération…</> : <><Sparkles /> Générer la boîte à outils</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ToolboxView({ mission, update }: { mission: Mission; update: (m: Mission) => void }) {
  const tb = mission.toolbox!;
  const [busy, setBusy] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState("");

  async function regenerate() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/generate-toolbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, refineInstructions: refineText.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      update({ ...mission, toolbox: data.toolbox as Toolbox });
      setRefineOpen(false);
      setRefineText("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function patch<K extends keyof Toolbox>(key: K, value: Toolbox[K]) {
    update({ ...mission, toolbox: { ...tb, [key]: value } });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border bg-card">
        <div>
          <h3 className="font-display text-lg font-medium">Boîte à outils générée</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tous les blocs sont éditables. Tu peux régénérer avec des instructions ciblées.</p>
        </div>
        <div className="flex items-center gap-2">
          {refineOpen ? (
            <div className="flex items-center gap-2">
              <input
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder="Ex. ton plus premium, raccourcir le pitch 1.1…"
                className="h-9 px-3 rounded-md border border-input bg-card text-sm w-72"
                autoFocus
              />
              <Button onClick={regenerate} disabled={busy} variant="accent" size="sm">
                {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Régénérer
              </Button>
              <Button onClick={() => setRefineOpen(false)} variant="ghost" size="sm" disabled={busy}>Annuler</Button>
            </div>
          ) : (
            <Button onClick={() => setRefineOpen(true)} variant="outline" size="sm"><RefreshCw /> Régénérer</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="positioning">
        <TabsList className="bg-secondary/60 flex-wrap h-auto">
          <TabsTrigger value="positioning"><Target className="h-4 w-4 mr-1.5" /> Positionnement</TabsTrigger>
          <TabsTrigger value="personas"><Users className="h-4 w-4 mr-1.5" /> Personas ({tb.personas.length})</TabsTrigger>
          <TabsTrigger value="arguments"><MessageSquare className="h-4 w-4 mr-1.5" /> Arguments</TabsTrigger>
          <TabsTrigger value="pitch"><Phone className="h-4 w-4 mr-1.5" /> Pitch V1</TabsTrigger>
          <TabsTrigger value="objections"><Shield className="h-4 w-4 mr-1.5" /> Objections (30)</TabsTrigger>
          <TabsTrigger value="qualification">Qualification</TabsTrigger>
        </TabsList>

        <TabsContent value="positioning"><PositioningEditor value={tb.positioning} onChange={(v) => patch("positioning", v)} /></TabsContent>
        <TabsContent value="personas"><PersonasEditor value={tb.personas} onChange={(v) => patch("personas", v)} /></TabsContent>
        <TabsContent value="arguments"><ArgumentsEditor tb={tb} patch={patch} /></TabsContent>
        <TabsContent value="pitch"><PitchEditor value={tb.pitch} onChange={(v) => patch("pitch", v)} /></TabsContent>
        <TabsContent value="objections"><ObjectionsEditor value={tb.objections} onChange={(v) => patch("objections", v)} /></TabsContent>
        <TabsContent value="qualification"><QualificationEditor value={tb.qualification} onChange={(v) => patch("qualification", v)} /></TabsContent>
      </Tabs>
    </div>
  );
}

function PositioningEditor({ value, onChange }: { value: Toolbox["positioning"]; onChange: (v: Toolbox["positioning"]) => void }) {
  const longFields: { key: keyof Toolbox["positioning"]; label: string; rows: number }[] = [
    { key: "intro", label: "Introduction / cadrage (4–6 paragraphes)", rows: 12 },
    { key: "promise", label: "Promesse centrale", rows: 2 },
    { key: "services", label: "Services à mettre en avant (ordre constant)", rows: 3 },
    { key: "targets", label: "Cibles à prioriser", rows: 4 },
    { key: "valueResult", label: "Résultat tangible promis (30–60j)", rows: 5 },
    { key: "finalAnchor", label: "Positionnement final à ancrer", rows: 3 },
  ];

  function setStringList(key: "phrases" | "irritants", next: string[]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {longFields.map((f) => (
        <Card key={f.key} className={f.key === "intro" || f.key === "valueResult" ? "lg:col-span-2" : ""}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{f.label}</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={String(value[f.key] ?? "")}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              rows={f.rows}
            />
          </CardContent>
        </Card>
      ))}

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Phrases à marteler</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(value.phrases ?? []).map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 h-9 px-3 rounded-md border border-input bg-card text-sm"
                value={p}
                onChange={(e) => {
                  const next = [...(value.phrases ?? [])];
                  next[i] = e.target.value;
                  setStringList("phrases", next);
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => setStringList("phrases", (value.phrases ?? []).filter((_, idx) => idx !== i))}>×</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setStringList("phrases", [...(value.phrases ?? []), ""])}>+ Ajouter une phrase</Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Irritants — questions à poser au prospect</CardTitle>
          <CardDescription>Pour ouvrir l'échange sans pitcher. Remplace « Nous créons des sites… » par « Comment gérez-vous … ? ».</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(value.irritants ?? []).map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 h-9 px-3 rounded-md border border-input bg-card text-sm"
                value={p}
                onChange={(e) => {
                  const next = [...(value.irritants ?? [])];
                  next[i] = e.target.value;
                  setStringList("irritants", next);
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => setStringList("irritants", (value.irritants ?? []).filter((_, idx) => idx !== i))}>×</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setStringList("irritants", [...(value.irritants ?? []), ""])}>+ Ajouter une question</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PersonasEditor({ value, onChange }: { value: Toolbox["personas"]; onChange: (v: Toolbox["personas"]) => void }) {
  return (
    <div className="space-y-4">
      {value.map((p, i) => (
        <Card key={i}>
          <CardHeader>
            <input
              className="font-display text-lg w-full bg-transparent focus:outline-none"
              value={p.title}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...p, title: e.target.value };
                onChange(next);
              }}
            />
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            {(["profile", "kpis", "pains", "motivations", "triggers"] as const).map((k) => (
              <div key={k} className={k === "profile" ? "md:col-span-2" : ""}>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{labelFor(k)}</p>
                <Textarea
                  rows={k === "profile" ? 4 : 3}
                  value={p[k]}
                  onChange={(e) => {
                    const next = [...value];
                    next[i] = { ...p, [k]: e.target.value };
                    onChange(next);
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function labelFor(k: string) {
  const map: Record<string, string> = { profile: "Profil", kpis: "KPI", pains: "Douleurs", motivations: "Motivations", triggers: "Déclencheurs d'achat" };
  return map[k] ?? k;
}

function ArgumentsEditor({ tb, patch }: { tb: Toolbox; patch: <K extends keyof Toolbox>(k: K, v: Toolbox[K]) => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Profils à disqualifier</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={4} value={tb.disqualified} onChange={(e) => patch("disqualified", e.target.value)} />
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-3">
        {tb.killerArguments.map((a, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <input
                className="font-display text-base w-full bg-transparent focus:outline-none italic"
                value={a.headline}
                onChange={(e) => {
                  const next = [...tb.killerArguments];
                  next[i] = { ...a, headline: e.target.value };
                  patch("killerArguments", next);
                }}
              />
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={a.body}
                onChange={(e) => {
                  const next = [...tb.killerArguments];
                  next[i] = { ...a, body: e.target.value };
                  patch("killerArguments", next);
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PitchEditor({ value, onChange }: { value: Toolbox["pitch"]; onChange: (v: Toolbox["pitch"]) => void }) {
  return (
    <div className="space-y-5">
      {value.map((section, sIdx) => (
        <Card key={section.id}>
          <CardHeader>
            <Badge variant="accent">{section.id}</Badge>
            <CardTitle className="text-base">{section.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.scripts.map((s, i) => (
              <div key={i} className="border-l-2 border-accent/30 pl-4 space-y-2">
                <input
                  className="text-xs uppercase tracking-wider text-accent w-full bg-transparent focus:outline-none font-medium"
                  value={s.variant}
                  onChange={(e) => {
                    const next = [...value];
                    const scripts = [...section.scripts];
                    scripts[i] = { ...s, variant: e.target.value };
                    next[sIdx] = { ...section, scripts };
                    onChange(next);
                  }}
                />
                <Textarea
                  rows={5}
                  value={s.text}
                  onChange={(e) => {
                    const next = [...value];
                    const scripts = [...section.scripts];
                    scripts[i] = { ...s, text: e.target.value };
                    next[sIdx] = { ...section, scripts };
                    onChange(next);
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ObjectionsEditor({ value, onChange }: { value: Toolbox["objections"]; onChange: (v: Toolbox["objections"]) => void }) {
  const grouped = OBJECTION_CATEGORIES.map((cat) => ({
    ...cat,
    items: value.filter((o) => o.category === cat.code),
  }));
  return (
    <div className="space-y-6">
      {grouped.map((g) => (
        <div key={g.code}>
          <h4 className="font-display text-base font-medium mb-3 flex items-center gap-2">
            <Badge variant="accent">{g.code}</Badge> {g.label} <span className="text-xs text-muted-foreground font-sans font-normal">— {g.items.length} objections</span>
          </h4>
          <div className="space-y-2">
            {g.items.map((o) => {
              const idx = value.findIndex((x) => x.id === o.id);
              return (
                <Card key={o.id}>
                  <CardContent className="pt-4 space-y-2">
                    <input
                      className="text-sm font-medium w-full bg-transparent focus:outline-none italic"
                      value={o.text}
                      onChange={(e) => {
                        const next = [...value];
                        next[idx] = { ...o, text: e.target.value };
                        onChange(next);
                      }}
                    />
                    <Textarea
                      rows={4}
                      value={o.response}
                      onChange={(e) => {
                        const next = [...value];
                        next[idx] = { ...o, response: e.target.value };
                        onChange(next);
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function QualificationEditor({ value, onChange }: { value: Toolbox["qualification"]; onChange: (v: Toolbox["qualification"]) => void }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle className="text-base">Critères de scoring</CardTitle><CardDescription>Note de 0 à 10 sur 5 critères. Lead qualifié pour R2 si ≥ 7/10.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2 pr-3 font-medium">Critère</th>
                <th className="pb-2 px-3 font-medium">Score 0 (faible)</th>
                <th className="pb-2 px-3 font-medium">Score 1 (moyen)</th>
                <th className="pb-2 pl-3 font-medium">Score 2 (élevé)</th>
              </tr>
            </thead>
            <tbody>
              {value.criteria.map((c, i) => (
                <tr key={i} className="border-b last:border-0 align-top">
                  <td className="py-3 pr-3 font-medium">{c.label}</td>
                  {(["score0", "score1", "score2"] as const).map((sk, sIdx) => (
                    <td key={sk} className={sIdx === 0 ? "py-3 px-3" : sIdx === 2 ? "py-3 pl-3" : "py-3 px-3"}>
                      <Textarea
                        rows={3}
                        value={c[sk]}
                        onChange={(e) => {
                          const next = [...value.criteria];
                          next[i] = { ...c, [sk]: e.target.value };
                          onChange({ ...value, criteria: next });
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-3 gap-3">
        {value.tiers.map((t, i) => (
          <Card key={i}>
            <CardHeader>
              <Badge variant={i === 0 ? "accent" : "secondary"}>{t.score}</Badge>
              <CardTitle className="text-sm">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                <Textarea rows={3} value={t.description} onChange={(e) => {
                  const next = [...value.tiers];
                  next[i] = { ...t, description: e.target.value };
                  onChange({ ...value, tiers: next });
                }} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Action</p>
                <Textarea rows={3} value={t.action} onChange={(e) => {
                  const next = [...value.tiers];
                  next[i] = { ...t, action: e.target.value };
                  onChange({ ...value, tiers: next });
                }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
