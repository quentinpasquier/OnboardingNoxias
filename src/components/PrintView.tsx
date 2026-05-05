"use client";
import { useEffect, useState, Fragment } from "react";
import { missionsStore } from "@/lib/supabase/missions-store";
import type { Mission } from "@/types/mission";
import type { ExportScope } from "@/lib/exporters";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { NoxiasLogo } from "@/components/branding/Logo";

const OBJ_CATS: Record<string, string> = {
  A: "Prestataires actuels / interne",
  B: "Budget / coût",
  C: "Temps / priorité",
  D: "Confiance / transparence",
  E: "Besoin / pertinence",
};

const PITCH_FLOW: { id: string; label: string }[] = [
  { id: "1.0", label: "Passage du barrage" },
  { id: "1.1", label: "Brise-glace décideur" },
  { id: "2.0", label: "Qualification" },
  { id: "3.0", label: "PAIN & KPI" },
  { id: "4.0", label: "Pitch adapté" },
  { id: "5.0", label: "Prise de RDV" },
];

export function PrintView({ missionId, scope = "both" }: { missionId: string; scope?: ExportScope }) {
  const [mission, setMission] = useState<Mission | null | undefined>(undefined);

  useEffect(() => {
    missionsStore.get(missionId).then(setMission).catch(() => setMission(null));
  }, [missionId]);

  if (mission === undefined) return <main className="p-8">Chargement…</main>;
  if (mission === null) return <main className="p-8">Mission introuvable.</main>;

  const tb = mission.toolbox;
  const showMatrix = scope === "matrix" || scope === "both";
  const showToolbox = (scope === "toolbox" || scope === "both") && tb;

  const docTitle = scope === "matrix"
    ? "Matrice de prospection"
    : scope === "toolbox"
      ? "Boîte à outils du commercial"
      : "Onboarding client — livrables prospection";

  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      <PrintStyles />

      {/* Barre d'action (cachée à l'impression) */}
      <div className="no-print sticky top-0 z-10 bg-card border-b py-3">
        <div className="container max-w-5xl flex items-center justify-between">
          <NoxiasLogo />
          <Button onClick={() => window.print()} variant="accent" size="lg">
            <Printer /> Imprimer / Enregistrer en PDF
          </Button>
        </div>
      </div>

      {/* PAGE DE GARDE */}
      <section className="cover-page">
        <div className="cover-inner">
          <div className="cover-eyebrow">▶  NOXIAS</div>
          <div className="cover-sub">ONBOARDING CLIENT</div>
          <h1 className="cover-title">{mission.clientName}</h1>
          <div className="cover-rule" />
          <p className="cover-doctitle">{docTitle}</p>
          <div className="cover-meta">
            <p>{today}</p>
            <p className="cover-conf">Document confidentiel — usage commercial Noxias</p>
          </div>
        </div>
      </section>

      {/* SOMMAIRE */}
      <section className="page sommaire">
        <p className="part-label">AU SOMMAIRE</p>
        <hr className="rule-accent" />
        <ol className="toc">
          {showMatrix && <li><span className="toc-num">01.</span> Matrice de prospection</li>}
          {showToolbox && (
            <>
              <li><span className="toc-num">{showMatrix ? "02." : "01."}</span> Boîte à outils du commercial</li>
              <li><span className="toc-num">{showMatrix ? "03." : "02."}</span> Pitch V1</li>
              <li><span className="toc-num">{showMatrix ? "04." : "03."}</span> Traitement des objections</li>
              <li><span className="toc-num">{showMatrix ? "05." : "04."}</span> Matrice de qualification (R1)</li>
            </>
          )}
        </ol>
      </section>

      {/* PARTIES */}
      {showMatrix && (
        <section className="page">
          <PartHeader number={showMatrix ? "01" : "01"} label="PARTIE 01" title="Matrice de prospection" />
          {MATRIX_QUESTIONS.map((q) => {
            const a = mission.matrix[q.id]?.trim();
            if (!a) return null;
            return (
              <article key={q.id} className="matrix-row">
                <p className="matrix-cat">{q.id}. {q.category}</p>
                <h3 className="matrix-q">{q.question}</h3>
                <div className="matrix-a">
                  {renderAnswer(a)}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {showToolbox && tb && (
        <>
          <section className="page page-break">
            <PartHeader number={showMatrix ? "02" : "01"} label={`PARTIE 0${showMatrix ? "2" : "1"}`} title="Boîte à outils du commercial" />

            <div className="intro-narrative">
              {tb.positioning.intro.split(/\n\s*\n/).filter(Boolean).map((para, i) => (
                <p key={i} className={i === 0 ? "drop-cap" : ""}>{para.trim()}</p>
              ))}
            </div>

            <h2 className="section-h2">Personas cibles</h2>
            {tb.personas.map((p, i) => (
              <article key={i} className="persona-card keep-together">
                <header className="persona-card-head">
                  <div className="persona-avatar">{(p.title.match(/[A-Za-zÀ-ÿ]/)?.[0] || "P").toUpperCase()}</div>
                  <div className="persona-card-headtext">
                    <p className="persona-eyebrow">PERSONA {String(i + 1).padStart(2, "0")}</p>
                    <h3 className="persona-title">{p.title}</h3>
                  </div>
                </header>
                <div className="persona-profile">{renderAnswer(p.profile)}</div>
                <div className="persona-grid">
                  <PersonaBox icon={<IconChart />} label="KPIs & métriques" value={p.kpis} />
                  <PersonaBox icon={<IconAlert />} label="Douleurs & freins" value={p.pains} />
                  <PersonaBox icon={<IconSparkle />} label="Motivations" value={p.motivations} />
                  <PersonaBox icon={<IconBolt />} label="Déclencheurs d'achat" value={p.triggers} />
                </div>
              </article>
            ))}

            <h2 className="section-h2">Profils à disqualifier</h2>
            <div className="prose-block">{renderAnswer(tb.disqualified)}</div>

            <h2 className="section-h2">Argumentaires clés</h2>
            <div className="arguments-grid">
              {tb.killerArguments.map((a, i) => (
                <article key={i} className="argument-card keep-together">
                  <p className="argument-headline">« {a.headline} »</p>
                  <div className="argument-body">{renderAnswer(a.body)}</div>
                </article>
              ))}
            </div>

            {tb.positioning.irritants?.length ? (
              <div className="callout">
                <p className="callout-eyebrow">POURQUOI NOUS ?</p>
                <p className="callout-title">Questions à poser pour ouvrir l'échange</p>
                <ul className="callout-list">{tb.positioning.irritants.map((q, i) => <li key={i}>{q}</li>)}</ul>
              </div>
            ) : null}

            <h2 className="section-h2">Services à mettre en avant</h2>
            <p className="prose-block">{tb.positioning.services}</p>

            <h2 className="section-h2">Cibles à prioriser en prospection</h2>
            <p className="prose-block">{tb.positioning.targets}</p>

            <div className="callout callout-promise">
              <p className="callout-eyebrow">PROMESSE COMMERCIALE CENTRALE</p>
              <p className="callout-text">{tb.positioning.promise}</p>
            </div>

            <h2 className="section-h2">Résultat concret promis (30–60 jours)</h2>
            <div className="prose-block">{renderAnswer(tb.positioning.valueResult ?? "")}</div>

            <h2 className="section-h2">Phrases à marteler</h2>
            <ul className="phrases-list">
              {tb.positioning.phrases.map((p, i) => <li key={i}><span className="phrase-quote">«</span> {p} <span className="phrase-quote">»</span></li>)}
            </ul>

            <div className="callout callout-anchor">
              <p className="callout-eyebrow">POSITIONNEMENT FINAL À ANCRER</p>
              <p className="callout-text">{tb.positioning.finalAnchor}</p>
            </div>
          </section>

          {/* PITCH */}
          <section className="page page-break">
            <PartHeader number={showMatrix ? "03" : "02"} label={`PARTIE 0${showMatrix ? "3" : "2"}`} title="Pitch V1" />
            <p className="part-intro">Trame d'entretien complète : passage du barrage, brise-glace décideur, qualification de la situation, questions PAIN & KPI, pitch de réponse adapté à la douleur identifiée et formulation de prise de RDV.</p>

            <div className="pitch-flow keep-together">
              {PITCH_FLOW.map((step, i) => (
                <Fragment key={step.id}>
                  <div className="pitch-flow-step">
                    <div className="pitch-flow-circle">{step.id}</div>
                    <p className="pitch-flow-label">{step.label}</p>
                  </div>
                  {i < PITCH_FLOW.length - 1 && (
                    <div className="pitch-flow-connector" aria-hidden>
                      <span className="pitch-flow-arrow" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>

            {tb.pitch.map((s) => (
              <article key={s.id} className="pitch-section keep-together">
                <h2 className="section-h2"><span className="pitch-id">({s.id})</span> {s.label}</h2>
                {s.scripts.map((sc, i) => (
                  <div key={i} className="pitch-script">
                    <p className="pitch-variant">{sc.variant}</p>
                    <p className="pitch-text">{sc.text}</p>
                  </div>
                ))}
              </article>
            ))}
          </section>

          {/* OBJECTIONS */}
          <section className="page page-break">
            <PartHeader number={showMatrix ? "04" : "03"} label={`PARTIE 0${showMatrix ? "4" : "3"}`} title="Traitement des objections" />
            <p className="part-intro">Cinq familles d'objections classiques : prestataires actuels & interne, budget & coût, temps & priorité, confiance & transparence, besoin & pertinence.</p>

            <div className="obj-overview keep-together">
              {(["A", "B", "C", "D", "E"] as const).map((code) => {
                const count = tb.objections.filter((o) => o.category === code).length;
                return (
                  <div key={code} className="obj-overview-card">
                    <div className="obj-overview-code">{code}</div>
                    <div className="obj-overview-count">
                      <span className="obj-overview-count-num">{count}</span>
                      <span className="obj-overview-count-of">/6</span>
                    </div>
                    <div className="obj-overview-label">{OBJ_CATS[code]}</div>
                  </div>
                );
              })}
            </div>

            {(["A", "B", "C", "D", "E"] as const).map((code) => (
              <article key={code} className="objection-family keep-together">
                <h2 className="section-h2"><span className="obj-code">{code}.</span> {OBJ_CATS[code]}</h2>
                {tb.objections.filter((o) => o.category === code).sort((a, b) => a.id - b.id).map((o) => (
                  <div key={o.id} className="objection keep-together">
                    <p className="objection-quote"><span className="obj-num">{o.id}.</span> « {o.text} »</p>
                    <p className="objection-response">{o.response}</p>
                  </div>
                ))}
              </article>
            ))}
          </section>

          {/* QUALIFICATION */}
          <section className="page page-break">
            <PartHeader number={showMatrix ? "05" : "04"} label={`PARTIE 0${showMatrix ? "5" : "4"}`} title="Matrice de qualification (R1)" />
            <p className="part-intro">Lead « Qualifié pour R2 » si score ≥ 7/10. Cinq critères, chacun noté 0/1/2.</p>

            <div className="qualif-scale keep-together">
              <div className="qualif-scale-track">
                <div className="qualif-zone qualif-zone-cold"><span>Froid · Disqualifié</span></div>
                <div className="qualif-zone qualif-zone-warm"><span>À nourrir</span></div>
                <div className="qualif-zone qualif-zone-hot"><span>Qualifié R2</span></div>
                <div className="qualif-scale-threshold" aria-hidden>
                  <span className="qualif-scale-threshold-pin" />
                  <span className="qualif-scale-threshold-label">SEUIL 7/10</span>
                </div>
              </div>
              <div className="qualif-scale-marks">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <span key={n} className={n === 7 ? "qualif-scale-mark mark-key" : "qualif-scale-mark"}>{n}</span>
                ))}
              </div>
              <p className="qualif-scale-note">5 critères × score 0/1/2 = 10 points maximum.</p>
            </div>

            <h2 className="section-h2">Grille des 5 critères</h2>
            <table className="qualif-table">
              <thead>
                <tr>
                  <th>Critère</th>
                  <th>Score 0 — faible</th>
                  <th>Score 1 — moyen</th>
                  <th>Score 2 — élevé</th>
                </tr>
              </thead>
              <tbody>
                {tb.qualification.criteria.map((c, i) => (
                  <tr key={i}>
                    <th scope="row">{c.label}</th>
                    <td>{c.score0}</td>
                    <td>{c.score1}</td>
                    <td>{c.score2}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="section-h2">Tiers de leads</h2>
            <div className="tiers-grid">
              {tb.qualification.tiers.map((t, i) => {
                const tierClass = i === 0 ? "tier-hot" : i === 1 ? "tier-warm" : "tier-cold";
                return (
                  <article key={i} className={`tier-card keep-together ${tierClass}`}>
                    <p className="tier-eyebrow">{i === 0 ? "PRIORITÉ ABSOLUE" : i === 1 ? "À NOURRIR" : "DISQUALIFIÉ / NURTURING"}</p>
                    <h3 className="tier-name">{t.name}</h3>
                    <p className="tier-score">Score {t.score}</p>
                    <p className="tier-desc">{t.description}</p>
                    <p className="tier-action"><strong>Action :</strong> <em>{t.action}</em></p>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}

      <footer className="print-footer">
        <p>▶  noxias  ·  {mission.clientName}  ·  {today}</p>
      </footer>
    </>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function PartHeader({ number, label, title }: { number: string; label: string; title: string }) {
  return (
    <header className="part-header">
      <p className="part-num">{number}</p>
      <p className="part-label">{label}</p>
      <h1 className="part-title">{title}</h1>
      <hr className="rule-accent" />
    </header>
  );
}

function PersonaBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="persona-box">
      <div className="persona-box-head">
        <span className="persona-box-icon">{icon}</span>
        <h4>{label}</h4>
      </div>
      <div className="prose-block">{renderAnswer(value)}</div>
    </div>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <rect x="6" y="13" width="3" height="5" />
      <rect x="11" y="9" width="3" height="9" />
      <rect x="16" y="5" width="3" height="13" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3z" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function renderAnswer(text: string): React.ReactNode {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletGroup: string[] = [];
  function flush() {
    if (bulletGroup.length === 0) return;
    blocks.push(<ul key={`b-${blocks.length}`} className="bullet-list">{bulletGroup.map((b, i) => <li key={i}>{b}</li>)}</ul>);
    bulletGroup = [];
  }
  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(/^[-•*]\s+(.+)$/);
    if (m) bulletGroup.push(m[1]);
    else if (line.length === 0) flush();
    else { flush(); blocks.push(<p key={`p-${blocks.length}`}>{line}</p>); }
  }
  flush();
  return blocks;
}

// -----------------------------------------------------------------------------
// Styles d'impression
// -----------------------------------------------------------------------------
function PrintStyles() {
  return (
    <style jsx global>{`
      :root {
        --noxias-print-ink: #000c1e;
        --noxias-print-deep: #221932;
        --noxias-print-accent: #3cc879;
        --noxias-print-accent-light: #e8f8ef;
        --noxias-print-accent-dark: #2fa566;
        --noxias-print-paper: #ffffff;
        --noxias-print-paper-alt: #f9fafb;
        --noxias-print-muted: #6a7280;
        --noxias-print-border: #e5e7eb;
      }

      @page { margin: 0; size: A4; }

      body {
        background: var(--noxias-print-paper-alt);
        color: var(--noxias-print-ink);
        font-family: var(--font-sans), Ubuntu, system-ui, sans-serif;
      }

      @media print {
        body { background: white !important; }
        .no-print { display: none !important; }
        .page-break { page-break-before: always; break-before: page; }
        .keep-together { page-break-inside: avoid; break-inside: avoid; }
        h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
      }

      /* PAGE DE GARDE */
      .cover-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32mm;
        background:
          radial-gradient(80% 60% at 100% 0%, var(--noxias-print-accent-light) 0%, transparent 60%),
          radial-gradient(60% 40% at 0% 100%, rgba(34, 25, 50, 0.04) 0%, transparent 60%),
          var(--noxias-print-paper);
      }
      @media print { .cover-page { min-height: 0; height: 100vh; } }
      .cover-inner { max-width: 600px; text-align: center; }
      .cover-eyebrow {
        color: var(--noxias-print-accent);
        font-weight: 700;
        letter-spacing: 0.3em;
        font-size: 12px;
        margin-bottom: 8px;
      }
      .cover-sub {
        color: var(--noxias-print-deep);
        font-weight: 700;
        letter-spacing: 0.25em;
        font-size: 11px;
        margin-bottom: 64px;
      }
      .cover-title {
        font-size: 64px;
        font-weight: 700;
        color: var(--noxias-print-ink);
        line-height: 1;
        margin-bottom: 16px;
        letter-spacing: -0.03em;
      }
      .cover-rule {
        width: 80px;
        height: 4px;
        margin: 24px auto;
        background: var(--noxias-print-accent);
      }
      .cover-doctitle {
        font-style: italic;
        color: var(--noxias-print-muted);
        font-size: 18px;
        margin-bottom: 96px;
      }
      .cover-meta { font-size: 13px; color: var(--noxias-print-muted); }
      .cover-meta p { margin: 4px 0; }
      .cover-conf { font-style: italic; }

      /* PAGES */
      .page {
        max-width: 800px;
        margin: 0 auto;
        padding: 32mm 28mm;
        background: var(--noxias-print-paper);
        min-height: 100vh;
      }
      @media print { .page { min-height: 0; padding: 24mm 24mm 28mm; } }
      .page-break { page-break-before: always; break-before: page; }

      /* SOMMAIRE */
      .sommaire .toc { list-style: none; padding: 0; margin: 32px 0; }
      .sommaire .toc li {
        font-size: 22px;
        font-weight: 700;
        color: var(--noxias-print-ink);
        padding: 16px 0;
        border-bottom: 1px solid var(--noxias-print-border);
        display: flex;
        gap: 24px;
        align-items: baseline;
      }
      .toc-num {
        color: var(--noxias-print-accent);
        font-size: 14px;
        letter-spacing: 0.1em;
      }

      /* PART HEADER */
      .part-header { margin-bottom: 32px; }
      .part-num {
        font-size: 56px;
        font-weight: 700;
        color: var(--noxias-print-accent-light);
        line-height: 1;
        margin: 0;
        letter-spacing: -0.03em;
      }
      .part-label {
        color: var(--noxias-print-accent);
        font-weight: 700;
        letter-spacing: 0.24em;
        font-size: 12px;
        margin: -16px 0 8px;
      }
      .part-title {
        font-size: 36px;
        font-weight: 700;
        color: var(--noxias-print-ink);
        line-height: 1.1;
        margin: 0 0 12px;
        letter-spacing: -0.02em;
      }
      .part-intro {
        font-style: italic;
        color: var(--noxias-print-muted);
        margin: 16px 0 32px;
        max-width: 60ch;
      }
      .rule-accent {
        height: 3px;
        background: var(--noxias-print-accent);
        border: none;
        width: 64px;
        margin: 12px 0 0;
      }
      .section-h2 {
        font-size: 22px;
        font-weight: 700;
        color: var(--noxias-print-deep);
        margin: 36px 0 12px;
        letter-spacing: -0.01em;
      }
      .section-h2 .pitch-id, .section-h2 .obj-code {
        color: var(--noxias-print-accent);
        font-weight: 700;
        margin-right: 8px;
      }

      /* MATRIX ROWS */
      .matrix-row { margin-bottom: 28px; page-break-inside: avoid; }
      .matrix-cat {
        color: var(--noxias-print-accent);
        font-weight: 700;
        letter-spacing: 0.12em;
        font-size: 11px;
        text-transform: uppercase;
        margin: 0 0 4px;
      }
      .matrix-q {
        font-size: 16px;
        font-weight: 700;
        color: var(--noxias-print-deep);
        margin: 0 0 8px;
      }
      .matrix-a { font-size: 14px; color: var(--noxias-print-ink); }
      .matrix-a p { margin: 0 0 8px; line-height: 1.65; }

      /* INTRO NARRATIVE */
      .intro-narrative p { line-height: 1.75; margin: 0 0 16px; color: var(--noxias-print-ink); font-size: 15px; }
      .intro-narrative .drop-cap::first-letter {
        float: left;
        font-size: 56px;
        line-height: 0.85;
        padding: 4px 8px 0 0;
        color: var(--noxias-print-accent);
        font-weight: 700;
      }

      /* PERSONAS — carte infographique */
      .persona-card {
        margin: 28px 0;
        padding: 24px;
        border-radius: 12px;
        background: var(--noxias-print-paper);
        border: 1px solid var(--noxias-print-border);
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
      }
      .persona-card-head {
        display: flex;
        align-items: center;
        gap: 16px;
        padding-bottom: 16px;
        margin-bottom: 16px;
        border-bottom: 1px solid var(--noxias-print-border);
      }
      .persona-avatar {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--noxias-print-deep);
        color: white;
        font-weight: 700;
        font-size: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: 3px solid var(--noxias-print-accent);
        letter-spacing: 0;
      }
      .persona-card-headtext { min-width: 0; }
      .persona-eyebrow {
        color: var(--noxias-print-accent);
        font-weight: 700;
        letter-spacing: 0.2em;
        font-size: 10px;
        margin: 0 0 2px;
      }
      .persona-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--noxias-print-deep);
        margin: 0;
        letter-spacing: -0.01em;
      }
      .persona-profile {
        margin-bottom: 18px;
        padding: 12px 16px;
        background: var(--noxias-print-paper-alt);
        border-left: 3px solid var(--noxias-print-accent);
        border-radius: 0 6px 6px 0;
      }
      .persona-profile p { margin: 0 0 6px; line-height: 1.6; font-size: 13px; }
      .persona-profile p:last-child { margin: 0; }
      .persona-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .persona-box {
        padding: 14px 16px;
        border-radius: 8px;
        background: var(--noxias-print-paper-alt);
        border-top: 3px solid var(--noxias-print-accent);
      }
      .persona-box-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .persona-box-icon {
        width: 18px;
        height: 18px;
        color: var(--noxias-print-accent-dark);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .persona-box-icon svg { width: 18px; height: 18px; }
      .persona-box h4 {
        color: var(--noxias-print-deep);
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-size: 11px;
        margin: 0;
      }
      .persona-box .prose-block p { font-size: 12.5px; line-height: 1.55; margin: 0 0 6px; }
      .persona-box .bullet-list li { font-size: 12.5px; padding-left: 14px; margin-bottom: 4px; }
      .persona-box .bullet-list li::before { width: 4px; height: 4px; top: 8px; }

      /* PITCH FLOW (stepper visuel des 6 étapes) */
      .pitch-flow {
        display: flex;
        align-items: flex-start;
        margin: 24px 0 40px;
        padding: 24px 16px;
        background: var(--noxias-print-paper-alt);
        border-radius: 12px;
        border: 1px solid var(--noxias-print-border);
      }
      .pitch-flow-step {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-width: 0;
      }
      .pitch-flow-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--noxias-print-deep);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        border: 3px solid var(--noxias-print-accent);
        margin-bottom: 10px;
      }
      .pitch-flow-label {
        font-size: 10.5px;
        font-weight: 600;
        line-height: 1.3;
        color: var(--noxias-print-deep);
        margin: 0;
        padding: 0 4px;
      }
      .pitch-flow-connector {
        flex: 0 0 24px;
        height: 2px;
        background: var(--noxias-print-accent);
        margin-top: 23px;
        position: relative;
      }
      .pitch-flow-arrow {
        position: absolute;
        right: -1px;
        top: -4px;
        width: 0;
        height: 0;
        border-left: 8px solid var(--noxias-print-accent);
        border-top: 5px solid transparent;
        border-bottom: 5px solid transparent;
      }

      /* OBJECTIONS — vue d'ensemble (5 cartes A → E) */
      .obj-overview {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin: 16px 0 32px;
      }
      .obj-overview-card {
        padding: 16px 12px;
        border-radius: 10px;
        background: var(--noxias-print-paper-alt);
        border-top: 4px solid var(--noxias-print-accent);
        text-align: center;
        position: relative;
      }
      .obj-overview-code {
        position: absolute;
        top: 8px;
        left: 10px;
        color: var(--noxias-print-accent);
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.1em;
      }
      .obj-overview-count {
        font-weight: 700;
        color: var(--noxias-print-deep);
        line-height: 1;
        margin: 8px 0 6px;
        letter-spacing: -0.02em;
      }
      .obj-overview-count-num { font-size: 32px; }
      .obj-overview-count-of { font-size: 16px; color: var(--noxias-print-muted); margin-left: 2px; }
      .obj-overview-label {
        font-size: 10.5px;
        font-weight: 600;
        line-height: 1.3;
        color: var(--noxias-print-deep);
      }

      /* QUALIFICATION SCALE — barre de scoring 0 → 10 */
      .qualif-scale {
        margin: 16px 0 36px;
        padding: 24px 24px 18px;
        background: var(--noxias-print-paper-alt);
        border-radius: 12px;
        border: 1px solid var(--noxias-print-border);
      }
      .qualif-scale-track {
        display: flex;
        height: 36px;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
      }
      .qualif-zone {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .qualif-zone-cold { flex: 4; background: #6a7280; }
      .qualif-zone-warm { flex: 3; background: #d97706; }
      .qualif-zone-hot { flex: 3; background: var(--noxias-print-accent-dark); }
      .qualif-scale-threshold {
        position: absolute;
        left: 70%;
        top: -10px;
        bottom: -10px;
        width: 0;
        border-left: 2px dashed var(--noxias-print-deep);
      }
      .qualif-scale-threshold-pin {
        position: absolute;
        top: -6px;
        left: -5px;
        width: 8px;
        height: 8px;
        background: var(--noxias-print-deep);
        border-radius: 50%;
      }
      .qualif-scale-threshold-label {
        position: absolute;
        top: -22px;
        left: -28px;
        background: var(--noxias-print-deep);
        color: white;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.12em;
        padding: 2px 8px;
        border-radius: 3px;
        white-space: nowrap;
      }
      .qualif-scale-marks {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        padding: 0 calc(50% / 11);
      }
      .qualif-scale-mark {
        font-size: 11px;
        font-weight: 600;
        color: var(--noxias-print-muted);
        font-variant-numeric: tabular-nums;
      }
      .qualif-scale-mark.mark-key { color: var(--noxias-print-accent-dark); font-weight: 700; }
      .qualif-scale-note {
        margin: 14px 0 0;
        font-size: 11px;
        color: var(--noxias-print-muted);
        text-align: center;
        font-style: italic;
      }
      .prose-block p { line-height: 1.7; margin: 0 0 10px; font-size: 14px; color: var(--noxias-print-ink); }
      .bullet-list { margin: 8px 0 12px; padding-left: 0; list-style: none; }
      .bullet-list li {
        position: relative;
        padding-left: 18px;
        margin-bottom: 6px;
        font-size: 14px;
        line-height: 1.6;
      }
      .bullet-list li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 9px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--noxias-print-accent);
      }

      /* ARGUMENTS */
      .arguments-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
      .argument-card {
        padding: 20px;
        border-radius: 8px;
        background: var(--noxias-print-paper-alt);
        border-left: 4px solid var(--noxias-print-accent);
      }
      .argument-headline {
        color: var(--noxias-print-accent-dark);
        font-style: italic;
        font-weight: 700;
        font-size: 17px;
        margin: 0 0 12px;
        line-height: 1.35;
      }
      .argument-body p { font-size: 13px; line-height: 1.6; margin: 0 0 6px; }

      /* CALLOUTS */
      .callout {
        background: var(--noxias-print-accent-light);
        border-left: 4px solid var(--noxias-print-accent);
        padding: 24px 28px;
        margin: 32px 0;
        border-radius: 0 8px 8px 0;
        page-break-inside: avoid;
      }
      .callout-eyebrow {
        color: var(--noxias-print-accent-dark);
        font-weight: 700;
        letter-spacing: 0.2em;
        font-size: 11px;
        margin: 0 0 8px;
      }
      .callout-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--noxias-print-deep);
        margin: 0 0 8px;
      }
      .callout-text {
        font-size: 17px;
        font-weight: 500;
        color: var(--noxias-print-ink);
        line-height: 1.55;
        margin: 0;
      }
      .callout-promise .callout-text { font-size: 19px; font-style: italic; }
      .callout-anchor { background: var(--noxias-print-deep); border-left-color: var(--noxias-print-accent); }
      .callout-anchor .callout-eyebrow { color: var(--noxias-print-accent); }
      .callout-anchor .callout-text { color: white; }
      .callout-list { margin: 0; padding-left: 0; list-style: none; }
      .callout-list li {
        position: relative;
        padding-left: 24px;
        margin-bottom: 8px;
        line-height: 1.5;
        color: var(--noxias-print-ink);
      }
      .callout-list li::before {
        content: "?";
        position: absolute;
        left: 0;
        top: 0;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--noxias-print-accent);
        color: white;
        font-weight: 700;
        font-size: 11px;
        text-align: center;
        line-height: 18px;
      }

      /* PHRASES À MARTELER */
      .phrases-list { margin: 12px 0; padding: 0; list-style: none; }
      .phrases-list li {
        position: relative;
        padding: 16px 0 16px 32px;
        border-bottom: 1px solid var(--noxias-print-border);
        font-size: 17px;
        font-style: italic;
        font-weight: 500;
        color: var(--noxias-print-deep);
        line-height: 1.4;
      }
      .phrases-list li::before {
        content: "▶";
        position: absolute;
        left: 0;
        top: 19px;
        color: var(--noxias-print-accent);
        font-size: 12px;
      }
      .phrase-quote { color: var(--noxias-print-accent); font-style: normal; font-size: 22px; vertical-align: -2px; }

      /* PITCH */
      .pitch-section { margin: 32px 0; }
      .pitch-script {
        margin: 16px 0;
        padding: 0 0 0 16px;
        border-left: 3px solid var(--noxias-print-accent);
      }
      .pitch-variant {
        color: var(--noxias-print-accent-dark);
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin: 0 0 6px;
      }
      .pitch-text {
        font-style: italic;
        color: var(--noxias-print-ink);
        line-height: 1.65;
        margin: 0;
        white-space: pre-wrap;
      }

      /* OBJECTIONS */
      .objection-family { margin: 28px 0; }
      .objection { margin: 16px 0 20px; padding-left: 16px; border-left: 2px solid var(--noxias-print-border); }
      .objection-quote {
        font-style: italic;
        font-weight: 700;
        color: var(--noxias-print-accent-dark);
        margin: 0 0 6px;
        font-size: 15px;
      }
      .obj-num {
        color: var(--noxias-print-muted);
        font-style: normal;
        font-weight: 400;
        margin-right: 6px;
      }
      .objection-response {
        font-style: italic;
        line-height: 1.65;
        margin: 0;
        white-space: pre-wrap;
      }

      /* QUALIFICATION */
      .qualif-table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0 32px;
        font-size: 13px;
      }
      .qualif-table thead th {
        background: var(--noxias-print-ink);
        color: white;
        font-weight: 700;
        text-align: left;
        padding: 12px 14px;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 12px;
        letter-spacing: 0.05em;
      }
      .qualif-table thead th:last-child { border-right: none; }
      .qualif-table tbody th[scope="row"] {
        background: var(--noxias-print-accent-light);
        color: var(--noxias-print-deep);
        font-weight: 700;
        text-align: left;
        padding: 12px 14px;
        vertical-align: top;
        width: 18%;
      }
      .qualif-table td {
        padding: 12px 14px;
        vertical-align: top;
        border-bottom: 1px solid var(--noxias-print-border);
        line-height: 1.5;
      }
      .qualif-table tbody tr:nth-child(even) td { background: var(--noxias-print-paper-alt); }

      .tiers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
      .tier-card {
        padding: 20px;
        border-radius: 12px;
        border: 1px solid var(--noxias-print-border);
        border-top: 4px solid var(--noxias-print-accent);
      }
      .tier-eyebrow {
        font-weight: 700;
        font-size: 10px;
        letter-spacing: 0.18em;
        margin: 0 0 4px;
      }
      .tier-name { font-size: 18px; font-weight: 700; color: var(--noxias-print-deep); margin: 0 0 4px; }
      .tier-score { font-size: 14px; font-style: italic; margin: 0 0 12px; }
      .tier-desc { font-size: 13px; line-height: 1.5; margin: 0 0 12px; color: var(--noxias-print-ink); }
      .tier-action { font-size: 12px; line-height: 1.5; margin: 0; color: var(--noxias-print-ink); }
      .tier-hot { background: var(--noxias-print-accent-light); border-top-color: var(--noxias-print-accent); }
      .tier-hot .tier-eyebrow, .tier-hot .tier-score { color: var(--noxias-print-accent-dark); }
      .tier-warm { background: #fef3c7; border-top-color: #d97706; }
      .tier-warm .tier-eyebrow, .tier-warm .tier-score { color: #d97706; }
      .tier-cold { background: #f3f4f6; border-top-color: var(--noxias-print-muted); }
      .tier-cold .tier-eyebrow, .tier-cold .tier-score { color: var(--noxias-print-muted); }

      /* FOOTER */
      .print-footer {
        text-align: center;
        padding: 32px 0 48px;
        font-size: 11px;
        color: var(--noxias-print-muted);
        letter-spacing: 0.1em;
      }
      @media print { .print-footer { display: none; } }
    `}</style>
  );
}
