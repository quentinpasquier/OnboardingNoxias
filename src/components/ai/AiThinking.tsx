"use client";
import { cn } from "@/lib/utils";

/**
 * Animation de chargement IA — petit personnage qui écrit dans un livre,
 * avec une bulle de pensée. Aux couleurs de la charte Noxias.
 */
export function AiThinking({
  label = "L'IA réfléchit",
  size = "md",
  className,
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? "h-14 w-14" : size === "lg" ? "h-32 w-32" : "h-20 w-20";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)} role="status" aria-live="polite">
      <div className={cn("relative", dims)}>
        <svg viewBox="0 0 120 120" className="absolute inset-0" aria-hidden>
          {/* Cercle de fond accent vert clair */}
          <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.08)" />

          {/* Bulle de pensée animée (3 points qui pulsent) */}
          <g className="ai-bubble">
            <ellipse cx="92" cy="22" rx="13" ry="9" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" />
            <circle cx="86" cy="22" r="1.5" fill="hsl(var(--noxias-deep))" className="ai-dot ai-dot-1" />
            <circle cx="92" cy="22" r="1.5" fill="hsl(var(--noxias-deep))" className="ai-dot ai-dot-2" />
            <circle cx="98" cy="22" r="1.5" fill="hsl(var(--noxias-deep))" className="ai-dot ai-dot-3" />
            <circle cx="80" cy="30" r="2" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1" />
            <circle cx="76" cy="34" r="1.2" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1" />
          </g>

          {/* Tête */}
          <circle cx="60" cy="44" r="11" fill="hsl(var(--noxias-deep))" />
          {/* Yeux qui clignent doucement */}
          <circle cx="56" cy="43" r="1.4" fill="white" className="ai-eye ai-eye-l" />
          <circle cx="64" cy="43" r="1.4" fill="white" className="ai-eye ai-eye-r" />

          {/* Corps (épaules / torse) */}
          <path d="M40 78 Q60 60 80 78 L80 88 L40 88 Z" fill="hsl(var(--noxias-ink))" />

          {/* Livre ouvert devant le personnage */}
          <g>
            <path d="M28 90 L60 86 L92 90 L92 98 L60 94 L28 98 Z" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" />
            <line x1="60" y1="86" x2="60" y2="94" stroke="hsl(var(--noxias-deep))" strokeWidth="1" />
            {/* Lignes de texte sur la page */}
            <line x1="34" y1="91" x2="55" y2="89" stroke="hsl(var(--noxias-muted))" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="34" y1="93.5" x2="50" y2="92" stroke="hsl(var(--noxias-muted))" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="65" y1="89" x2="86" y2="91" stroke="hsl(var(--noxias-muted))" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="70" y1="92" x2="86" y2="93.5" stroke="hsl(var(--noxias-muted))" strokeWidth="0.8" strokeLinecap="round" />
          </g>

          {/* Bras + stylo qui écrit (rotation) */}
          <g style={{ transformOrigin: "76px 75px" }} className="ai-arm">
            <path d="M76 75 L88 82" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
            {/* Stylo */}
            <path d="M88 82 L94 87" stroke="hsl(var(--noxias-accent))" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="94" cy="87" r="1.5" fill="hsl(var(--noxias-accent))" />
          </g>
          {/* Bras gauche fixe */}
          <path d="M44 75 L36 82" stroke="hsl(var(--noxias-ink))" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <span>{label}</span>
        <span className="ai-typing-dots inline-flex gap-0.5">
          <span>·</span><span>·</span><span>·</span>
        </span>
      </p>

      <style jsx>{`
        :global(.ai-arm) { animation: noxias-arm 1.4s ease-in-out infinite; }
        :global(.ai-eye-l), :global(.ai-eye-r) { animation: noxias-blink 4s ease-in-out infinite; }
        :global(.ai-bubble) { animation: noxias-bubble 2.6s ease-in-out infinite; transform-origin: 92px 22px; }
        :global(.ai-dot-1) { animation: noxias-pulse 1.4s ease-in-out infinite; }
        :global(.ai-dot-2) { animation: noxias-pulse 1.4s ease-in-out 0.2s infinite; }
        :global(.ai-dot-3) { animation: noxias-pulse 1.4s ease-in-out 0.4s infinite; }
        @keyframes noxias-arm {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes noxias-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes noxias-bubble {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
        @keyframes noxias-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .ai-typing-dots > span { animation: noxias-pulse 1.2s ease-in-out infinite; }
        .ai-typing-dots > span:nth-child(2) { animation-delay: 0.15s; }
        .ai-typing-dots > span:nth-child(3) { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
}

/** Version inline compacte pour intégrer dans un bouton ou une ligne. */
export function AiThinkingInline({ label = "Génération…", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="hsl(var(--noxias-accent) / 0.15)" />
        <circle cx="12" cy="9" r="2.5" fill="hsl(var(--noxias-deep))" />
        <path d="M7 18 Q12 14 17 18 L17 19 L7 19 Z" fill="hsl(var(--noxias-ink))" />
        <g style={{ transformOrigin: "15px 15px" }} className="ai-arm-inline">
          <path d="M15 15 L18 17" stroke="hsl(var(--noxias-accent))" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </svg>
      <span>{label}</span>
      <style jsx>{`
        :global(.ai-arm-inline) { animation: noxias-arm-inline 1s ease-in-out infinite; }
        @keyframes noxias-arm-inline {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
      `}</style>
    </span>
  );
}
