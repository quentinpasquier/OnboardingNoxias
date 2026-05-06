"use client";
import type { Toolbox } from "@/lib/toolbox-schema";
import { OBJECTION_CATEGORIES } from "@/lib/toolbox-schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

export function PositioningEditor({ value, onChange }: { value: Toolbox["positioning"]; onChange: (v: Toolbox["positioning"]) => void }) {
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
          <CardTitle className="text-sm">Irritants, questions à poser au prospect</CardTitle>
          <CardDescription>Pour ouvrir l'échange sans pitcher.</CardDescription>
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

const PERSONA_FIELD_LABEL: Record<string, string> = {
  profile: "Profil",
  kpis: "KPI",
  pains: "Douleurs",
  motivations: "Motivations",
  triggers: "Déclencheurs d'achat",
};

export function PersonasEditor({
  value,
  onChange,
  validationSlot,
}: {
  value: Toolbox["personas"];
  onChange: (v: Toolbox["personas"]) => void;
  validationSlot?: (index: number) => React.ReactNode;
}) {
  function addPersona() {
    onChange([
      ...value,
      {
        title: `Persona ${value.length + 1} : (à compléter)`,
        profile: "",
        kpis: "",
        pains: "",
        motivations: "",
        triggers: "",
      },
    ]);
  }

  function removePersona(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {value.map((p, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <input
                className="font-display text-lg w-full bg-transparent focus:outline-none"
                value={p.title}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...p, title: e.target.value };
                  onChange(next);
                }}
              />
              <div className="flex items-center gap-2 shrink-0">
                {validationSlot?.(i)}
                <Button variant="ghost" size="sm" onClick={() => removePersona(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            {(["profile", "kpis", "pains", "motivations", "triggers"] as const).map((k) => (
              <div key={k} className={k === "profile" ? "md:col-span-2" : ""}>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{PERSONA_FIELD_LABEL[k]}</p>
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
      <Button onClick={addPersona} variant="outline" className="w-full border-dashed">
        <Plus /> Ajouter un persona manuellement
      </Button>
    </div>
  );
}

export function ArgumentsEditor({
  disqualified,
  killerArguments,
  setDisqualified,
  setKillerArguments,
}: {
  disqualified: string;
  killerArguments: Toolbox["killerArguments"];
  setDisqualified: (s: string) => void;
  setKillerArguments: (v: Toolbox["killerArguments"]) => void;
}) {
  function addArgument() {
    setKillerArguments([...killerArguments, { headline: "(à compléter)", body: "" }]);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Profils à disqualifier</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={4} value={disqualified} onChange={(e) => setDisqualified(e.target.value)} />
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-3">
        {killerArguments.map((a, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <input
                  className="font-display text-base w-full bg-transparent focus:outline-none italic"
                  value={a.headline}
                  onChange={(e) => {
                    const next = [...killerArguments];
                    next[i] = { ...a, headline: e.target.value };
                    setKillerArguments(next);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKillerArguments(killerArguments.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-destructive shrink-0 -mt-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={a.body}
                onChange={(e) => {
                  const next = [...killerArguments];
                  next[i] = { ...a, body: e.target.value };
                  setKillerArguments(next);
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <Button onClick={addArgument} variant="outline" className="w-full border-dashed">
        <Plus /> Ajouter un argument manuellement
      </Button>
    </div>
  );
}

export function PitchEditor({ value, onChange }: { value: Toolbox["pitch"]; onChange: (v: Toolbox["pitch"]) => void }) {
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

/**
 * Liste plate d'objections (pas de regroupement interne par catégorie).
 * À utiliser quand le composant parent gère déjà l'affichage par famille.
 */
export function ObjectionsListEditor({
  value,
  onChange,
  onAdd,
}: {
  value: Toolbox["objections"];
  onChange: (v: Toolbox["objections"]) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      {value.map((o) => {
        const idx = value.findIndex((x) => x.id === o.id);
        return (
          <Card key={o.id} className="bg-secondary/30">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <input
                  className="text-sm font-medium w-full bg-transparent focus:outline-none italic"
                  value={o.text}
                  onChange={(e) => {
                    const next = [...value];
                    next[idx] = { ...o, text: e.target.value };
                    onChange(next);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(value.filter((x) => x.id !== o.id))}
                  className="text-muted-foreground hover:text-destructive shrink-0 -mt-1 h-7 w-7 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
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
      <Button onClick={onAdd} variant="outline" size="sm" className="border-dashed">
        <Plus /> Ajouter une objection manuellement
      </Button>
    </div>
  );
}

/**
 * Ancien éditeur regroupé par catégorie, conservé pour rétro-compat si
 * jamais utilisé ailleurs. Préférer ObjectionsListEditor + parent qui groupe.
 */
export function ObjectionsEditor({ value, onChange }: { value: Toolbox["objections"]; onChange: (v: Toolbox["objections"]) => void }) {
  const grouped = OBJECTION_CATEGORIES.map((cat) => ({
    ...cat,
    items: value.filter((o) => o.category === cat.code).sort((a, b) => a.id - b.id),
  }));
  return (
    <div className="space-y-6">
      {grouped.map((g) => (
        <div key={g.code}>
          <h4 className="font-display text-base font-medium mb-3 flex items-center gap-2">
            <Badge variant="accent">{g.code}</Badge> {g.label} <span className="text-xs text-muted-foreground font-sans font-normal">· {g.items.length} objections</span>
          </h4>
          <ObjectionsListEditor
            value={g.items}
            onChange={(next) => {
              const others = value.filter((o) => o.category !== g.code);
              onChange([...others, ...next].sort((a, b) => a.id - b.id));
            }}
            onAdd={() => {
              const others = value.filter((o) => o.category !== g.code);
              const maxIdInCat = g.items.reduce((m, o) => Math.max(m, o.id), 0);
              const nextId = Math.max(maxIdInCat + 1, value.reduce((m, o) => Math.max(m, o.id), 0) + 1);
              onChange([...others, ...g.items, { id: nextId, category: g.code, text: "(nouvelle objection)", response: "" }].sort((a, b) => a.id - b.id));
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function QualificationEditor({ value, onChange }: { value: Toolbox["qualification"]; onChange: (v: Toolbox["qualification"]) => void }) {
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
                  {(["score0", "score1", "score2"] as const).map((sk) => (
                    <td key={sk} className="py-3 px-3">
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
