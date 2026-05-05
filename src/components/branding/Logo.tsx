import { cn } from "@/lib/utils";

/**
 * Wordmark Noxias — approximation SVG du logo officiel (lettres bold rondes
 * en deep navy #221932, triangle vert ▶ logé dans le X).
 *
 * Pour utiliser l'asset officiel à la place : déposer le SVG dans
 * `public/brand/logo.svg`, puis remplacer ce composant par un `next/image`.
 */
export function NoxiasLogo({ className, mono = false, size = 22 }: { className?: string; mono?: boolean; size?: number }) {
  const ink = mono ? "currentColor" : "#221932";
  const accent = mono ? "currentColor" : "hsl(var(--noxias-accent))";

  // Hauteur ~24px par défaut, ratio ~3.6:1
  const h = size;
  const w = Math.round(h * 3.6);

  return (
    <div className={cn("inline-flex items-center", className)} aria-label="Noxias">
      <svg
        width={w}
        height={h}
        viewBox="0 0 360 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="block"
      >
        <text
          x="0"
          y="78"
          fill={ink}
          fontFamily="Ubuntu, system-ui, sans-serif"
          fontWeight="700"
          fontSize="92"
          letterSpacing="-2"
        >
          noxias
        </text>
        {/* Triangle vert centré dans le X (3e lettre, ~150-180px) */}
        <polygon points="160,42 184,55 160,68" fill={accent} />
      </svg>
    </div>
  );
}
