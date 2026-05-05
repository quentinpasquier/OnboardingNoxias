"use client";
import { useEffect, useState } from "react";
import { missionsStore } from "@/lib/supabase/missions-store";
import type { Mission } from "@/types/mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { NoxiasLogo } from "@/components/branding/Logo";

export function PrintView({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<Mission | null | undefined>(undefined);

  useEffect(() => {
    missionsStore.get(missionId).then(setMission).catch(() => setMission(null));
  }, [missionId]);

  if (mission === undefined) return <main className="p-8">Chargement…</main>;
  if (mission === null) return <main className="p-8">Mission introuvable.</main>;

  const tb = mission.toolbox;
  const cats: Record<string, string> = { A: "Partenaires actuels / interne", B: "Budget / coût", C: "Temps / priorité", D: "Confiance / transparence", E: "Besoin / pertinence" };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page-break { page-break-before: always; }
          h1, h2, h3 { page-break-after: avoid; }
          .keep-together { page-break-inside: avoid; }
        }
        @page { margin: 18mm; }
      `}</style>
      <div className="no-print sticky top-0 z-10 bg-card border-b py-3">
        <div className="container max-w-4xl flex items-center justify-between">
          <NoxiasLogo />
          <Button onClick={() => window.print()} variant="accent"><Printer /> Imprimer / Enregistrer en PDF</Button>
        </div>
      </div>
      <main className="container max-w-4xl py-12 print:py-0 prose prose-stone max-w-none">
        <header className="mb-12 pb-8 border-b">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Noxias · Conseil prospection</p>
          <h1 className="font-display text-4xl font-medium tracking-tight">{mission.clientName}</h1>
          <p className="text-muted-foreground mt-2">Livrables prospection — matrice & boîte à outils</p>
        </header>

        <section>
          <h2 className="font-display text-2xl font-medium mb-6">Matrice de prospection</h2>
          {MATRIX_QUESTIONS.map((q) => {
            const a = mission.matrix[q.id]?.trim();
            if (!a) return null;
            return (
              <div key={q.id} className="mb-6 keep-together">
                <p className="text-xs uppercase tracking-wider text-accent">{q.id}. {q.category}</p>
                <h3 className="font-display text-lg font-medium mt-1 mb-2">{q.question}</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{a}</p>
              </div>
            );
          })}
        </section>

        {tb && (
          <>
            <div className="page-break" />
            <section>
              <h2 className="font-display text-2xl font-medium mb-6">Boîte à outils du commercial</h2>

              <h3 className="font-display text-xl mb-3">Positionnement</h3>
              <p className="whitespace-pre-wrap mb-4">{tb.positioning.intro}</p>
              <p><strong>Promesse.</strong> {tb.positioning.promise}</p>
              <p><strong>Services.</strong> {tb.positioning.services}</p>
              <p><strong>Cibles.</strong> {tb.positioning.targets}</p>
              <p><strong>Phrases à marteler.</strong></p>
              <ul>{tb.positioning.phrases.map((p, i) => <li key={i}>{p}</li>)}</ul>
              <p><strong>Ancrage final.</strong> {tb.positioning.finalAnchor}</p>

              <h3 className="font-display text-xl mb-3 mt-8">Personas</h3>
              {tb.personas.map((p, i) => (
                <div key={i} className="keep-together mb-6">
                  <h4 className="font-display text-lg">{p.title}</h4>
                  <p><strong>Profil.</strong> {p.profile}</p>
                  <p><strong>KPI.</strong> {p.kpis}</p>
                  <p><strong>Douleurs.</strong> {p.pains}</p>
                  <p><strong>Motivations.</strong> {p.motivations}</p>
                  <p><strong>Déclencheurs.</strong> {p.triggers}</p>
                </div>
              ))}

              <h3 className="font-display text-xl mb-3 mt-8">Profils à disqualifier</h3>
              <p className="whitespace-pre-wrap">{tb.disqualified}</p>

              <h3 className="font-display text-xl mb-3 mt-8">Argumentaires clés</h3>
              {tb.killerArguments.map((a, i) => (
                <div key={i} className="keep-together mb-4">
                  <p className="italic text-accent">« {a.headline} »</p>
                  <p>{a.body}</p>
                </div>
              ))}

              <div className="page-break" />
              <h3 className="font-display text-xl mb-3 mt-8">Pitch V1</h3>
              {tb.pitch.map((s) => (
                <div key={s.id} className="keep-together mb-6">
                  <h4 className="font-display text-lg">{s.id} — {s.label}</h4>
                  {s.scripts.map((sc, i) => (
                    <div key={i} className="border-l-2 border-accent pl-4 my-3">
                      <p className="text-xs uppercase tracking-wider text-accent">{sc.variant}</p>
                      <p className="whitespace-pre-wrap">{sc.text}</p>
                    </div>
                  ))}
                </div>
              ))}

              <div className="page-break" />
              <h3 className="font-display text-xl mb-3">Traitement des 30 objections</h3>
              {(["A", "B", "C", "D", "E"] as const).map((code) => (
                <div key={code} className="mb-6">
                  <h4 className="font-display text-lg">{code}. {cats[code]}</h4>
                  {tb.objections.filter((o) => o.category === code).map((o) => (
                    <div key={o.id} className="keep-together mb-3">
                      <p className="font-medium italic">{o.id}. « {o.text} »</p>
                      <p className="whitespace-pre-wrap">{o.response}</p>
                    </div>
                  ))}
                </div>
              ))}

              <h3 className="font-display text-xl mb-3 mt-8">Matrice de qualification</h3>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-secondary">
                  <th className="border p-2 text-left">Critère</th>
                  <th className="border p-2 text-left">Score 0 (faible)</th>
                  <th className="border p-2 text-left">Score 1 (moyen)</th>
                  <th className="border p-2 text-left">Score 2 (élevé)</th>
                </tr></thead>
                <tbody>
                  {tb.qualification.criteria.map((c, i) => (
                    <tr key={i}>
                      <td className="border p-2 font-medium">{c.label}</td>
                      <td className="border p-2">{c.score0}</td>
                      <td className="border p-2">{c.score1}</td>
                      <td className="border p-2">{c.score2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4">
                <p><strong>Tiers de leads.</strong></p>
                {tb.qualification.tiers.map((t, i) => (
                  <p key={i}><strong>{t.name} ({t.score}).</strong> {t.description} <em>Action : {t.action}</em></p>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="mt-16 pt-6 border-t text-xs text-muted-foreground text-center">
          Livrable produit avec Noxias Prospection Builder.
        </footer>
      </main>
    </>
  );
}
