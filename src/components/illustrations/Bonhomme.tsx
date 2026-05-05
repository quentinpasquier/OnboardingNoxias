"use client";
import { cn } from "@/lib/utils";

/**
 * Famille d'illustrations « Bonhomme Noxias » — style flat moderne, accueillant.
 * Cohérente avec AiThinking. Couleurs charte (#221932 deep, #000c1e ink, #3cc879 accent).
 */

type Props = { className?: string; size?: number };

const Frame = ({ children, size = 120, className }: { children: React.ReactNode; size?: number; className?: string }) => (
  <div className={cn("relative inline-block noxias-float", className)} style={{ width: size, height: size }}>
    <svg viewBox="0 0 120 120" className="block w-full h-full" aria-hidden>
      {children}
    </svg>
  </div>
);

/* ---------- Sous-formes réutilisables ---------- */

/** Buste arrondi (chemise / pull) — couleur deep par défaut */
function Torso({ fill = "hsl(var(--noxias-deep))" }: { fill?: string }) {
  return (
    <>
      {/* col en V subtil au-dessus du buste */}
      <path d="M50 70 Q60 76 70 70" stroke={fill} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* corps : rectangle arrondi */}
      <rect x="36" y="71" width="48" height="32" rx="14" fill={fill} />
      {/* col chemise / accent vert */}
      <path d="M55 73 L60 78 L65 73" stroke="hsl(var(--noxias-accent))" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  );
}

/** Tête ronde avec coiffure / cheveux courts. Yeux + sourire optionnels via children */
function Head({
  cx = 60,
  cy = 44,
  r = 14,
  hair = true,
  rotate = 0,
  children,
}: {
  cx?: number;
  cy?: number;
  r?: number;
  hair?: boolean;
  rotate?: number;
  children?: React.ReactNode;
}) {
  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      {/* visage rond */}
      <circle cx={cx} cy={cy} r={r} fill="hsl(var(--noxias-deep))" />
      {/* cheveux : arc qui couvre la moitié haute, plus foncé */}
      {hair && (
        <path
          d={`M${cx - r} ${cy - 1} Q${cx - r + 2} ${cy - r - 3} ${cx} ${cy - r - 4} Q${cx + r - 2} ${cy - r - 3} ${cx + r} ${cy - 1} Q${cx + r - 1} ${cy - r + 4} ${cx + r / 2} ${cy - r + 2} Q${cx} ${cy - r + 6} ${cx - r / 2} ${cy - r + 2} Q${cx - r + 1} ${cy - r + 4} ${cx - r} ${cy - 1} Z`}
          fill="hsl(var(--noxias-ink))"
        />
      )}
      {children}
    </g>
  );
}

/** Yeux ouverts (default) — deux ovales blancs + pupille */
function EyesOpen({ cx = 60, cy = 44 }: { cx?: number; cy?: number }) {
  return (
    <>
      <ellipse cx={cx - 4.5} cy={cy + 1} rx="2.2" ry="2.6" fill="white" />
      <ellipse cx={cx + 4.5} cy={cy + 1} rx="2.2" ry="2.6" fill="white" />
      <circle cx={cx - 4.2} cy={cy + 1.5} r="1.1" fill="hsl(var(--noxias-ink))" />
      <circle cx={cx + 4.8} cy={cy + 1.5} r="1.1" fill="hsl(var(--noxias-ink))" />
    </>
  );
}

/** Yeux fermés en sourire (pour célébration) */
function EyesHappy({ cx = 60, cy = 44 }: { cx?: number; cy?: number }) {
  return (
    <>
      <path d={`M${cx - 7} ${cy + 1} Q${cx - 4.5} ${cy - 2} ${cx - 2} ${cy + 1}`} stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d={`M${cx + 2} ${cy + 1} Q${cx + 4.5} ${cy - 2} ${cx + 7} ${cy + 1}`} stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  );
}

/** Sourire (curve) */
function SmileCurve({ cx = 60, cy = 52, w = 6, color = "hsl(var(--noxias-accent))" }: { cx?: number; cy?: number; w?: number; color?: string }) {
  return (
    <path
      d={`M${cx - w} ${cy} Q${cx} ${cy + 3} ${cx + w} ${cy}`}
      stroke={color}
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
  );
}

/* ---------- Illustrations exportées ---------- */

/** Bonhomme qui salue (welcome / accueil). */
export function BonhommeWelcome({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.10)" />
      <Torso />
      {/* bras gauche le long du corps */}
      <path d="M40 78 Q34 88 38 96" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* bras droit qui salue (rotation) */}
      <g style={{ transformOrigin: "78px 78px" }} className="noxias-wave">
        <path d="M78 78 Q88 70 92 58" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="92" cy="58" r="4.5" fill="hsl(var(--noxias-deep))" />
      </g>
      <Head>
        <EyesOpen />
        <SmileCurve />
      </Head>
      <style jsx>{`
        :global(.noxias-wave) { animation: noxias-wave 1.6s ease-in-out infinite; }
        @keyframes noxias-wave {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(15deg); }
        }
      `}</style>
    </Frame>
  );
}

/** Bonhomme avec dossier vide (empty state). */
export function BonhommeEmpty({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.06)" />
      <Torso />
      {/* bras tenant le dossier */}
      <path d="M40 80 L30 92" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M80 80 L90 92" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* dossier ouvert devant */}
      <g>
        <rect x="28" y="86" width="64" height="22" rx="4" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.6" />
        <line x1="60" y1="86" x2="60" y2="108" stroke="hsl(var(--noxias-deep))" strokeWidth="1" opacity="0.4" />
        {/* lignes pointillées symbolisant un contenu vide */}
        <line x1="34" y1="93" x2="56" y2="93" stroke="hsl(var(--noxias-muted))" strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round" opacity="0.6" />
        <line x1="34" y1="98" x2="52" y2="98" stroke="hsl(var(--noxias-muted))" strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round" opacity="0.6" />
        <line x1="64" y1="93" x2="86" y2="93" stroke="hsl(var(--noxias-muted))" strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round" opacity="0.6" />
        <line x1="64" y1="98" x2="82" y2="98" stroke="hsl(var(--noxias-muted))" strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round" opacity="0.6" />
        {/* coin replié vert */}
        <path d="M86 86 L86 92 L80 86 Z" fill="hsl(var(--noxias-accent) / 0.4)" />
      </g>
      <Head rotate={-5}>
        <EyesOpen />
        {/* bouche neutre légèrement perplexe */}
        <line x1="56" y1="52" x2="64" y2="52" stroke="hsl(var(--noxias-muted))" strokeWidth="1.6" strokeLinecap="round" />
      </Head>
    </Frame>
  );
}

/** Bonhomme qui célèbre (succès / boîte prête). */
export function BonhommeReady({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.18)" />
      {/* étoiles modernes (4 branches) */}
      <g className="noxias-twinkle-1" style={{ transformOrigin: "20px 30px" }}>
        <path d="M20 26 L21 29 L24 30 L21 31 L20 34 L19 31 L16 30 L19 29 Z" fill="hsl(var(--noxias-accent))" />
      </g>
      <g className="noxias-twinkle-2" style={{ transformOrigin: "100px 38px" }}>
        <path d="M100 35 L101 37.5 L103.5 38 L101 38.5 L100 41 L99 38.5 L96.5 38 L99 37.5 Z" fill="hsl(var(--noxias-accent))" />
      </g>
      <g className="noxias-twinkle-3" style={{ transformOrigin: "98px 84px" }}>
        <path d="M98 81 L98.8 83 L101 84 L98.8 85 L98 87 L97.2 85 L95 84 L97.2 83 Z" fill="hsl(var(--noxias-accent))" />
      </g>

      <Torso />
      {/* bras levés en V */}
      <path d="M40 76 Q30 64 26 50" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="26" cy="50" r="4.5" fill="hsl(var(--noxias-deep))" />
      <path d="M80 76 Q90 64 94 50" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="94" cy="50" r="4.5" fill="hsl(var(--noxias-deep))" />

      <Head>
        <EyesHappy />
        {/* grand sourire */}
        <path d="M53 51 Q60 58 67 51" stroke="hsl(var(--noxias-accent))" strokeWidth="2" fill="none" strokeLinecap="round" />
      </Head>

      <style jsx>{`
        :global(.noxias-twinkle-1) { animation: noxias-twinkle 1.8s ease-in-out infinite; }
        :global(.noxias-twinkle-2) { animation: noxias-twinkle 1.8s ease-in-out 0.3s infinite; }
        :global(.noxias-twinkle-3) { animation: noxias-twinkle 1.8s ease-in-out 0.6s infinite; }
        @keyframes noxias-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.6) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(45deg); }
        }
      `}</style>
    </Frame>
  );
}

/** Bonhomme un peu perdu (404 / introuvable). Friendly, pas triste. */
export function BonhommeError({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-muted) / 0.10)" />
      <Torso />
      {/* bras le long du corps */}
      <path d="M40 78 Q35 88 38 96" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M80 78 Q85 88 82 96" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />

      <Head rotate={-8}>
        <EyesOpen />
        {/* bouche neutre incertaine (légère ondulation) */}
        <path d="M56 53 Q58 51 60 53 Q62 55 64 53" stroke="hsl(var(--noxias-muted))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </Head>

      {/* Bulle "?" moderne (rounded square) */}
      <g className="noxias-bubble-q" style={{ transformOrigin: "94px 24px" }}>
        <rect x="82" y="14" width="22" height="22" rx="6" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" />
        <text x="93" y="29" textAnchor="middle" fontSize="14" fontWeight="700" fill="hsl(var(--noxias-deep))" fontFamily="Ubuntu, sans-serif">?</text>
        {/* petite queue de bulle */}
        <path d="M82 32 L78 38 L84 34 Z" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" strokeLinejoin="round" />
      </g>

      <style jsx>{`
        :global(.noxias-bubble-q) { animation: noxias-bubble-q 2.4s ease-in-out infinite; }
        @keyframes noxias-bubble-q {
          0%, 100% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </Frame>
  );
}

/** Bonhomme qui pointe vers l'avant (CTA / next step). */
export function BonhommePointing({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.10)" />
      <Torso />
      {/* bras gauche le long */}
      <path d="M40 78 Q35 88 38 96" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* bras droit tendu vers la droite */}
      <path d="M78 76 Q90 72 100 70" stroke="hsl(var(--noxias-deep))" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="70" r="4" fill="hsl(var(--noxias-deep))" />
      {/* flèche moderne (chevron) */}
      <g className="noxias-arrow" style={{ transformOrigin: "108px 70px" }}>
        <path d="M104 65 L112 70 L104 75" stroke="hsl(var(--noxias-accent))" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <Head cx={56}>
        <EyesOpen cx={56} />
        <SmileCurve cx={56} />
      </Head>

      <style jsx>{`
        :global(.noxias-arrow) { animation: noxias-arrow 1.6s ease-in-out infinite; }
        @keyframes noxias-arrow {
          0%, 100% { transform: translateX(0); opacity: 0.8; }
          50% { transform: translateX(4px); opacity: 1; }
        }
      `}</style>
    </Frame>
  );
}
