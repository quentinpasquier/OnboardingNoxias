import { cn } from "@/lib/utils";

export function NoxiasLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="6" stroke="hsl(var(--noxias-ink))" strokeWidth="1.5" fill="hsl(var(--noxias-paper))" />
        <path d="M9 22V10L23 22V10" stroke="hsl(var(--noxias-ink))" strokeWidth="2" strokeLinecap="square" />
        <circle cx="23" cy="10" r="2" fill="hsl(var(--noxias-accent))" />
      </svg>
      <span className="font-display text-lg font-medium tracking-tight">noxias</span>
    </div>
  );
}
