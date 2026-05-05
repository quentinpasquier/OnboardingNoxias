"use client";
import { cn } from "@/lib/utils";

/**
 * Famille « Robot Noxias » — petit robot mignon style Wall-E.
 * Tête rounded-square avec antenne, yeux LEDs verts, panneau de poitrine.
 * Couleurs charte (#221932 deep, #000c1e ink, #3cc879 accent).
 */

type Props = { className?: string; size?: number };

const Frame = ({ children, size = 120, className, animated = true }: { children: React.ReactNode; size?: number; className?: string; animated?: boolean }) => (
  <div className={cn("relative inline-block", animated && "noxias-float", className)} style={{ width: size, height: size }}>
    <svg viewBox="0 0 120 120" className="block w-full h-full" aria-hidden>
      {children}
    </svg>
  </div>
);

/* ---------- Sous-composants robot réutilisables ---------- */

function Antenna({ pulse = false }: { pulse?: boolean }) {
  return (
    <g>
      <line x1="60" y1="22" x2="60" y2="14" stroke="hsl(var(--noxias-deep))" strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="12" r="3" fill="hsl(var(--noxias-accent))" className={pulse ? "noxias-antenna-pulse" : ""} />
    </g>
  );
}

function Head({ rotate = 0, children, antenna = true, antennaPulse = false }: { rotate?: number; children?: React.ReactNode; antenna?: boolean; antennaPulse?: boolean }) {
  return (
    <g transform={`rotate(${rotate} 60 38)`}>
      {antenna && <Antenna pulse={antennaPulse} />}
      {/* tête rounded-square */}
      <rect x="40" y="22" width="40" height="34" rx="9" fill="hsl(var(--noxias-deep))" />
      {/* "écouteurs" sur les côtés */}
      <rect x="36" y="33" width="6" height="12" rx="2" fill="hsl(var(--noxias-deep))" />
      <rect x="78" y="33" width="6" height="12" rx="2" fill="hsl(var(--noxias-deep))" />
      <circle cx="38" cy="39" r="1.5" fill="hsl(var(--noxias-accent))" />
      <circle cx="82" cy="39" r="1.5" fill="hsl(var(--noxias-accent))" />
      {/* écran de visage */}
      <rect x="44" y="28" width="32" height="22" rx="6" fill="hsl(var(--noxias-ink))" />
      {children}
    </g>
  );
}

function Body({ withPanel = true }: { withPanel?: boolean }) {
  return (
    <g>
      {/* "cou" / connecteur */}
      <rect x="55" y="56" width="10" height="5" rx="2" fill="hsl(var(--noxias-deep) / 0.7)" />
      {/* torse */}
      <rect x="34" y="61" width="52" height="38" rx="10" fill="hsl(var(--noxias-deep))" />
      {withPanel && (
        <>
          {/* panneau central */}
          <rect x="46" y="71" width="28" height="16" rx="4" fill="hsl(var(--noxias-ink))" />
          {/* 3 LEDs */}
          <circle cx="53" cy="79" r="2" fill="hsl(var(--noxias-accent))" className="noxias-led-1" />
          <circle cx="60" cy="79" r="2" fill="hsl(var(--noxias-accent))" className="noxias-led-2" />
          <circle cx="67" cy="79" r="2" fill="hsl(var(--noxias-accent))" className="noxias-led-3" />
        </>
      )}
    </g>
  );
}

function EyesLed({ blink = true }: { blink?: boolean }) {
  return (
    <g className={blink ? "noxias-eyes-blink" : ""}>
      <circle cx="53" cy="38" r="3.5" fill="hsl(var(--noxias-accent))" />
      <circle cx="67" cy="38" r="3.5" fill="hsl(var(--noxias-accent))" />
      <circle cx="54" cy="37" r="1.2" fill="white" opacity="0.85" />
      <circle cx="68" cy="37" r="1.2" fill="white" opacity="0.85" />
    </g>
  );
}

function EyesHappy() {
  return (
    <g>
      <path d="M 49 38 Q 53 34 57 38" stroke="hsl(var(--noxias-accent))" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 63 38 Q 67 34 71 38" stroke="hsl(var(--noxias-accent))" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function EyesConfused() {
  return (
    <g>
      {/* œil gauche : croix */}
      <path d="M 51 36 L 55 40 M 55 36 L 51 40" stroke="hsl(var(--noxias-accent) / 0.7)" strokeWidth="1.6" strokeLinecap="round" />
      {/* œil droit : LED */}
      <circle cx="67" cy="38" r="3" fill="hsl(var(--noxias-accent) / 0.7)" />
      <circle cx="68" cy="37" r="1" fill="white" opacity="0.7" />
    </g>
  );
}

function MouthSmile() {
  return <path d="M 54 46 Q 60 50 66 46" stroke="hsl(var(--noxias-accent))" strokeWidth="1.8" fill="none" strokeLinecap="round" />;
}

function MouthBigSmile() {
  return <path d="M 52 44 Q 60 51 68 44" stroke="hsl(var(--noxias-accent))" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
}

function MouthNeutral() {
  return <line x1="55" y1="46" x2="65" y2="46" stroke="hsl(var(--noxias-accent) / 0.6)" strokeWidth="1.6" strokeLinecap="round" />;
}

function MouthWavy() {
  return <path d="M 54 46 Q 57 44 60 46 Q 63 48 66 46" stroke="hsl(var(--noxias-accent) / 0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />;
}

/* ---------- Illustrations exportées ---------- */

export function BonhommeWelcome({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.10)" />
      <Body />
      {/* bras gauche le long */}
      <line x1="36" y1="74" x2="30" y2="92" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      <circle cx="30" cy="92" r="4" fill="hsl(var(--noxias-deep))" />
      {/* bras droit qui salue */}
      <g style={{ transformOrigin: "84px 74px" }} className="noxias-wave">
        <line x1="84" y1="74" x2="98" y2="58" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
        <circle cx="98" cy="58" r="4.5" fill="hsl(var(--noxias-deep))" />
      </g>
      <Head antennaPulse>
        <EyesLed />
        <MouthSmile />
      </Head>

      <style jsx>{`
        :global(.noxias-wave) { animation: noxias-wave 1.6s ease-in-out infinite; }
        :global(.noxias-antenna-pulse) { animation: noxias-pulse 1.6s ease-in-out infinite; }
        :global(.noxias-eyes-blink) { animation: noxias-blink 4s ease-in-out infinite; transform-origin: 60px 38px; }
        :global(.noxias-led-1) { animation: noxias-led 1.4s ease-in-out infinite; }
        :global(.noxias-led-2) { animation: noxias-led 1.4s ease-in-out 0.2s infinite; }
        :global(.noxias-led-3) { animation: noxias-led 1.4s ease-in-out 0.4s infinite; }
        @keyframes noxias-wave {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes noxias-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes noxias-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes noxias-led {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </Frame>
  );
}

export function BonhommeEmpty({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.06)" />
      <Body withPanel={false} />
      {/* bras tenant un dossier */}
      <line x1="36" y1="76" x2="28" y2="86" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      <line x1="84" y1="76" x2="92" y2="86" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      {/* dossier vide */}
      <g>
        <rect x="26" y="84" width="68" height="22" rx="4" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" />
        <line x1="60" y1="84" x2="60" y2="106" stroke="hsl(var(--noxias-deep))" strokeWidth="1" opacity="0.4" />
        <line x1="32" y1="92" x2="56" y2="92" stroke="hsl(var(--noxias-muted))" strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round" opacity="0.6" />
        <line x1="32" y1="98" x2="52" y2="98" stroke="hsl(var(--noxias-muted))" strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round" opacity="0.6" />
        <line x1="64" y1="92" x2="88" y2="92" stroke="hsl(var(--noxias-muted))" strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round" opacity="0.6" />
        <line x1="64" y1="98" x2="84" y2="98" stroke="hsl(var(--noxias-muted))" strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round" opacity="0.6" />
        <path d="M 88 84 L 88 90 L 82 84 Z" fill="hsl(var(--noxias-accent) / 0.4)" />
      </g>
      <Head rotate={-6}>
        <EyesLed blink={false} />
        <MouthNeutral />
      </Head>

      <style jsx>{`
        :global(.noxias-led-1), :global(.noxias-led-2), :global(.noxias-led-3) {
          animation: noxias-led-soft 2.2s ease-in-out infinite;
        }
        @keyframes noxias-led-soft {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </Frame>
  );
}

export function BonhommeReady({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.18)" />
      {/* étoiles 4 branches */}
      <g className="noxias-twinkle-1" style={{ transformOrigin: "20px 30px" }}>
        <path d="M20 26 L21 29 L24 30 L21 31 L20 34 L19 31 L16 30 L19 29 Z" fill="hsl(var(--noxias-accent))" />
      </g>
      <g className="noxias-twinkle-2" style={{ transformOrigin: "100px 38px" }}>
        <path d="M100 35 L101 37.5 L103.5 38 L101 38.5 L100 41 L99 38.5 L96.5 38 L99 37.5 Z" fill="hsl(var(--noxias-accent))" />
      </g>
      <g className="noxias-twinkle-3" style={{ transformOrigin: "98px 84px" }}>
        <path d="M98 81 L98.8 83 L101 84 L98.8 85 L98 87 L97.2 85 L95 84 L97.2 83 Z" fill="hsl(var(--noxias-accent))" />
      </g>
      <Body />
      {/* bras levés en V */}
      <line x1="36" y1="72" x2="22" y2="50" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      <circle cx="22" cy="50" r="4.5" fill="hsl(var(--noxias-deep))" />
      <line x1="84" y1="72" x2="98" y2="50" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      <circle cx="98" cy="50" r="4.5" fill="hsl(var(--noxias-deep))" />
      <Head antennaPulse>
        <EyesHappy />
        <MouthBigSmile />
      </Head>

      <style jsx>{`
        :global(.noxias-twinkle-1) { animation: noxias-twinkle 1.8s ease-in-out infinite; }
        :global(.noxias-twinkle-2) { animation: noxias-twinkle 1.8s ease-in-out 0.3s infinite; }
        :global(.noxias-twinkle-3) { animation: noxias-twinkle 1.8s ease-in-out 0.6s infinite; }
        :global(.noxias-antenna-pulse) { animation: noxias-pulse 1.2s ease-in-out infinite; }
        @keyframes noxias-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.6) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(45deg); }
        }
        @keyframes noxias-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </Frame>
  );
}

export function BonhommeError({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-muted) / 0.10)" />
      <Body withPanel={false} />
      <line x1="36" y1="74" x2="32" y2="92" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="92" r="4" fill="hsl(var(--noxias-deep))" />
      <line x1="84" y1="74" x2="88" y2="92" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      <circle cx="88" cy="92" r="4" fill="hsl(var(--noxias-deep))" />
      <Head rotate={-8} antennaPulse={false}>
        <EyesConfused />
        <MouthWavy />
      </Head>
      {/* bulle "?" */}
      <g className="noxias-bubble-q" style={{ transformOrigin: "94px 24px" }}>
        <rect x="82" y="14" width="22" height="22" rx="6" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" />
        <text x="93" y="29" textAnchor="middle" fontSize="14" fontWeight="700" fill="hsl(var(--noxias-deep))" fontFamily="Ubuntu, sans-serif">?</text>
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

export function BonhommePointing({ className, size = 120 }: Props) {
  return (
    <Frame size={size} className={className}>
      <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.10)" />
      <Body />
      <line x1="36" y1="74" x2="30" y2="92" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      <circle cx="30" cy="92" r="4" fill="hsl(var(--noxias-deep))" />
      {/* bras tendu vers la droite */}
      <line x1="84" y1="72" x2="100" y2="68" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
      <circle cx="100" cy="68" r="4" fill="hsl(var(--noxias-deep))" />
      {/* chevron pointe */}
      <g className="noxias-arrow" style={{ transformOrigin: "108px 68px" }}>
        <path d="M104 63 L112 68 L104 73" stroke="hsl(var(--noxias-accent))" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Head antennaPulse>
        <EyesLed />
        <MouthSmile />
      </Head>

      <style jsx>{`
        :global(.noxias-arrow) { animation: noxias-arrow 1.6s ease-in-out infinite; }
        :global(.noxias-antenna-pulse) { animation: noxias-pulse 1.6s ease-in-out infinite; }
        @keyframes noxias-arrow {
          0%, 100% { transform: translateX(0); opacity: 0.8; }
          50% { transform: translateX(4px); opacity: 1; }
        }
        @keyframes noxias-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </Frame>
  );
}
