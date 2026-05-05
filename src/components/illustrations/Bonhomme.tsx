"use client";
import { cn } from "@/lib/utils";

/**
 * Famille d'illustrations « Bonhomme Noxias » — cohérente avec AiThinking.
 * Mêmes proportions, même palette, postures différentes selon le contexte.
 *
 * Tous SVG inline (zéro asset externe). Couleurs via variables CSS.
 */

type Props = { className?: string; size?: number };

const Frame = ({ children, size = 120, className }: { children: React.ReactNode; size?: number; className?: string }) => (
  <div className={cn("relative inline-block noxias-float", className)} style={{ width: size, height: size }}>
    <svg viewBox="0 0 120 120" className="block w-full h-full" aria-hidden>
      {children}
    </svg>
  </div>
);

/** Bonhomme qui salue (welcome / accueil). */
export function BonhommeWelcome({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.10)" />
      {/* Tête */}
      <circle cx="60" cy="48" r="13" fill="hsl(var(--noxias-deep))" />
      {/* Yeux */}
      <circle cx="55" cy="47" r="1.5" fill="white" />
      <circle cx="65" cy="47" r="1.5" fill="white" />
      {/* Sourire */}
      <path d="M55 53 Q60 56 65 53" stroke="hsl(var(--noxias-accent))" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* Corps */}
      <path d="M40 80 Q60 64 80 80 L80 92 L40 92 Z" fill="hsl(var(--noxias-ink))" />
      {/* Bras gauche fixe */}
      <path d="M44 78 L34 86" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
      {/* Bras droit qui salue */}
      <g style={{ transformOrigin: "76px 78px" }} className="noxias-wave">
        <path d="M76 78 L92 64" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
        <circle cx="92" cy="64" r="3.5" fill="hsl(var(--noxias-deep))" />
      </g>
      <style jsx>{`
        :global(.noxias-wave) { animation: noxias-wave 1.6s ease-in-out infinite; }
        @keyframes noxias-wave {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
      `}</style>
    </Frame>
  );
}

/** Bonhomme qui regarde un dossier vide (empty state). */
export function BonhommeEmpty({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.06)" />
      {/* Tête (légèrement penchée) */}
      <g transform="rotate(-6 60 50)">
        <circle cx="60" cy="48" r="12" fill="hsl(var(--noxias-deep))" />
        {/* Yeux semi-fermés */}
        <line x1="53" y1="47" x2="57" y2="47" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="63" y1="47" x2="67" y2="47" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        {/* Bouche neutre */}
        <line x1="56" y1="54" x2="64" y2="54" stroke="hsl(var(--noxias-muted))" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* Corps */}
      <path d="M40 78 Q60 62 80 78 L80 92 L40 92 Z" fill="hsl(var(--noxias-ink))" />
      {/* Dossier vide tenu */}
      <rect x="34" y="80" width="52" height="22" rx="3" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" />
      <line x1="40" y1="88" x2="64" y2="88" stroke="hsl(var(--noxias-muted) / 0.5)" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2 2" />
      <line x1="40" y1="93" x2="56" y2="93" stroke="hsl(var(--noxias-muted) / 0.5)" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2 2" />
      {/* Coin replié */}
      <path d="M86 80 L86 86 L80 80 Z" fill="hsl(var(--noxias-accent) / 0.3)" />
    </Frame>
  );
}

/** Bonhomme qui célèbre (mission terminée / succès). */
export function BonhommeReady({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.18)" />
      {/* Étoiles autour */}
      <circle cx="22" cy="32" r="2" fill="hsl(var(--noxias-accent))" className="noxias-twinkle-1" />
      <circle cx="100" cy="38" r="1.8" fill="hsl(var(--noxias-accent))" className="noxias-twinkle-2" />
      <circle cx="98" cy="86" r="1.6" fill="hsl(var(--noxias-accent))" className="noxias-twinkle-3" />
      {/* Tête */}
      <circle cx="60" cy="48" r="13" fill="hsl(var(--noxias-deep))" />
      {/* Yeux fermés (sourire) */}
      <path d="M52 47 Q55 44 58 47" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M62 47 Q65 44 68 47" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Grand sourire */}
      <path d="M53 53 Q60 59 67 53" stroke="hsl(var(--noxias-accent))" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Corps */}
      <path d="M40 78 Q60 62 80 78 L80 92 L40 92 Z" fill="hsl(var(--noxias-ink))" />
      {/* Bras levés en V */}
      <path d="M44 76 L30 60" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="60" r="3.5" fill="hsl(var(--noxias-deep))" />
      <path d="M76 76 L90 60" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
      <circle cx="90" cy="60" r="3.5" fill="hsl(var(--noxias-deep))" />
      <style jsx>{`
        :global(.noxias-twinkle-1) { animation: noxias-twinkle 1.8s ease-in-out infinite; }
        :global(.noxias-twinkle-2) { animation: noxias-twinkle 1.8s ease-in-out 0.4s infinite; }
        :global(.noxias-twinkle-3) { animation: noxias-twinkle 1.8s ease-in-out 0.8s infinite; }
        @keyframes noxias-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </Frame>
  );
}

/** Bonhomme perdu / triste (404 / erreur). */
export function BonhommeError({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-muted) / 0.10)" />
      {/* Tête baissée */}
      <g transform="rotate(-12 60 50)">
        <circle cx="60" cy="48" r="12" fill="hsl(var(--noxias-deep))" />
        <line x1="53" y1="48" x2="57" y2="48" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="63" y1="48" x2="67" y2="48" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        {/* Bouche triste */}
        <path d="M55 56 Q60 53 65 56" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {/* Corps */}
      <path d="M40 78 Q60 64 80 78 L80 92 L40 92 Z" fill="hsl(var(--noxias-ink))" />
      <path d="M44 78 L36 86" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
      <path d="M76 78 L84 86" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
      {/* Bulle "?" */}
      <ellipse cx="92" cy="22" rx="12" ry="9" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" />
      <text x="92" y="26" textAnchor="middle" fontSize="11" fill="hsl(var(--noxias-deep))" fontWeight="700" fontFamily="Ubuntu, sans-serif">?</text>
    </Frame>
  );
}

/** Bonhomme qui pointe vers l'avant (call to action / next step). */
export function BonhommePointing({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.10)" />
      {/* Tête tournée légèrement */}
      <circle cx="56" cy="48" r="12" fill="hsl(var(--noxias-deep))" />
      <circle cx="59" cy="47" r="1.5" fill="white" />
      <circle cx="53" cy="47" r="1.5" fill="white" />
      <path d="M51 53 Q56 55 60 53" stroke="hsl(var(--noxias-accent))" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Corps */}
      <path d="M36 78 Q56 62 76 78 L76 92 L36 92 Z" fill="hsl(var(--noxias-ink))" />
      <path d="M40 78 L30 86" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
      {/* Bras tendu vers la droite avec petite flèche */}
      <path d="M72 78 L98 70" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
      <polygon points="98,66 108,70 98,74" fill="hsl(var(--noxias-accent))" className="noxias-arrow" />
      <style jsx>{`
        :global(.noxias-arrow) { animation: noxias-arrow 1.6s ease-in-out infinite; transform-origin: 100px 70px; }
        @keyframes noxias-arrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
      `}</style>
    </Frame>
  );
}
