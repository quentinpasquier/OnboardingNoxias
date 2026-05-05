"use client";
import { cn } from "@/lib/utils";

/**
 * Animation IA — petit robot mignon en train de réfléchir.
 * Cohérent avec la famille Bonhomme*.
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
          <circle cx="60" cy="60" r="58" fill="hsl(var(--noxias-accent) / 0.08)" />

          {/* Bulle de pensée (3 dots qui pulsent) */}
          <g className="ai-bubble">
            <ellipse cx="92" cy="22" rx="14" ry="9" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1.5" />
            <circle cx="86" cy="22" r="1.5" fill="hsl(var(--noxias-deep))" className="ai-dot ai-dot-1" />
            <circle cx="92" cy="22" r="1.5" fill="hsl(var(--noxias-deep))" className="ai-dot ai-dot-2" />
            <circle cx="98" cy="22" r="1.5" fill="hsl(var(--noxias-deep))" className="ai-dot ai-dot-3" />
            <circle cx="80" cy="30" r="2" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1" />
            <circle cx="76" cy="34" r="1.2" fill="white" stroke="hsl(var(--noxias-deep))" strokeWidth="1" />
          </g>

          {/* Antenne */}
          <line x1="60" y1="22" x2="60" y2="14" stroke="hsl(var(--noxias-deep))" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="12" r="3" fill="hsl(var(--noxias-accent))" className="ai-antenna" />

          {/* Tête robot */}
          <rect x="40" y="22" width="40" height="34" rx="9" fill="hsl(var(--noxias-deep))" />
          <rect x="36" y="33" width="6" height="12" rx="2" fill="hsl(var(--noxias-deep))" />
          <rect x="78" y="33" width="6" height="12" rx="2" fill="hsl(var(--noxias-deep))" />
          <circle cx="38" cy="39" r="1.5" fill="hsl(var(--noxias-accent))" />
          <circle cx="82" cy="39" r="1.5" fill="hsl(var(--noxias-accent))" />

          {/* Écran */}
          <rect x="44" y="28" width="32" height="22" rx="6" fill="hsl(var(--noxias-ink))" />

          {/* Yeux LED qui pulsent (réflexion) */}
          <circle cx="53" cy="38" r="3.5" fill="hsl(var(--noxias-accent))" className="ai-eye-l" />
          <circle cx="67" cy="38" r="3.5" fill="hsl(var(--noxias-accent))" className="ai-eye-r" />
          <circle cx="54" cy="37" r="1.2" fill="white" opacity="0.85" />
          <circle cx="68" cy="37" r="1.2" fill="white" opacity="0.85" />

          {/* Bouche (ligne neutre) */}
          <line x1="55" y1="46" x2="65" y2="46" stroke="hsl(var(--noxias-accent) / 0.6)" strokeWidth="1.6" strokeLinecap="round" />

          {/* Cou */}
          <rect x="55" y="56" width="10" height="5" rx="2" fill="hsl(var(--noxias-deep) / 0.7)" />

          {/* Corps */}
          <rect x="34" y="61" width="52" height="38" rx="10" fill="hsl(var(--noxias-deep))" />
          {/* Panneau central avec LEDs */}
          <rect x="46" y="71" width="28" height="16" rx="4" fill="hsl(var(--noxias-ink))" />
          <circle cx="53" cy="79" r="2" fill="hsl(var(--noxias-accent))" className="ai-led-1" />
          <circle cx="60" cy="79" r="2" fill="hsl(var(--noxias-accent))" className="ai-led-2" />
          <circle cx="67" cy="79" r="2" fill="hsl(var(--noxias-accent))" className="ai-led-3" />

          {/* Bras gauche fixe */}
          <line x1="36" y1="74" x2="30" y2="92" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
          <circle cx="30" cy="92" r="4" fill="hsl(var(--noxias-deep))" />
          {/* Bras droit qui "réfléchit" en se levant */}
          <g style={{ transformOrigin: "84px 74px" }} className="ai-arm">
            <line x1="84" y1="74" x2="92" y2="58" stroke="hsl(var(--noxias-deep))" strokeWidth="5" strokeLinecap="round" />
            <circle cx="92" cy="58" r="4" fill="hsl(var(--noxias-deep))" />
          </g>
        </svg>
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <span>{label}</span>
        <span className="ai-typing-dots inline-flex gap-0.5">
          <span>·</span><span>·</span><span>·</span>
        </span>
      </p>

      <style jsx>{`
        :global(.ai-arm) { animation: ai-arm 2.4s ease-in-out infinite; }
        :global(.ai-eye-l), :global(.ai-eye-r) { animation: ai-eye-pulse 1.6s ease-in-out infinite; }
        :global(.ai-antenna) { animation: ai-antenna 1.4s ease-in-out infinite; }
        :global(.ai-bubble) { animation: ai-bubble 2.6s ease-in-out infinite; transform-origin: 92px 22px; }
        :global(.ai-dot-1) { animation: ai-pulse 1.4s ease-in-out infinite; }
        :global(.ai-dot-2) { animation: ai-pulse 1.4s ease-in-out 0.2s infinite; }
        :global(.ai-dot-3) { animation: ai-pulse 1.4s ease-in-out 0.4s infinite; }
        :global(.ai-led-1) { animation: ai-led 1.4s ease-in-out infinite; }
        :global(.ai-led-2) { animation: ai-led 1.4s ease-in-out 0.25s infinite; }
        :global(.ai-led-3) { animation: ai-led 1.4s ease-in-out 0.5s infinite; }
        @keyframes ai-arm {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-15deg); }
        }
        @keyframes ai-eye-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes ai-antenna {
          0%, 100% { opacity: 0.5; transform: scale(0.85); transform-origin: 60px 12px; }
          50% { opacity: 1; transform: scale(1.2); transform-origin: 60px 12px; }
        }
        @keyframes ai-bubble {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
        @keyframes ai-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes ai-led {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .ai-typing-dots > span { animation: ai-pulse 1.2s ease-in-out infinite; }
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
        {/* mini robot */}
        <rect x="6" y="6" width="12" height="11" rx="3" fill="hsl(var(--noxias-deep))" />
        <line x1="12" y1="6" x2="12" y2="3" stroke="hsl(var(--noxias-deep))" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="12" cy="2.5" r="1.2" fill="hsl(var(--noxias-accent))" className="ai-mini-led" />
        <circle cx="9.5" cy="11" r="1.4" fill="hsl(var(--noxias-accent))" className="ai-mini-led" />
        <circle cx="14.5" cy="11" r="1.4" fill="hsl(var(--noxias-accent))" className="ai-mini-led-2" />
      </svg>
      <span>{label}</span>
      <style jsx>{`
        :global(.ai-mini-led) { animation: ai-mini 1s ease-in-out infinite; }
        :global(.ai-mini-led-2) { animation: ai-mini 1s ease-in-out 0.25s infinite; }
        @keyframes ai-mini {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}
