import { cn } from "@/lib/utils";

/**
 * Wordmark Noxias — recréé en SVG (Ubuntu, accent vert #3cc879).
 * Pour utiliser l'asset officiel, remplacer ce fichier par un import du SVG :
 *   import LogoSvg from "@/../public/brand/logo.svg";
 *   export const NoxiasLogo = ({ className }) => <Image src={LogoSvg} ... />;
 */
export function NoxiasLogo({ className, mono = false }: { className?: string; mono?: boolean }) {
  const ink = mono ? "currentColor" : "hsl(var(--noxias-ink))";
  const accent = mono ? "currentColor" : "hsl(var(--noxias-accent))";
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label="Noxias">
      <span
        className="font-sans tracking-tight text-[1.2rem] leading-none font-light"
        style={{ color: ink, letterSpacing: "0.02em" }}
      >
        noxia
      </span>
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className="-mb-[1px]">
        <polygon points="3,2 13,8 3,14" fill={accent} />
      </svg>
      <span
        className="font-sans tracking-tight text-[1.2rem] leading-none font-light"
        style={{ color: ink, letterSpacing: "0.02em" }}
      >
        s
      </span>
    </div>
  );
}
