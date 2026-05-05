import Link from "next/link";
import { NoxiasLogo } from "@/components/branding/Logo";

export function Header({ trail }: { trail?: { label: string; href?: string }[] }) {
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-80 transition-opacity"><NoxiasLogo /></Link>
          {trail && trail.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-border">/</span>
              {trail.map((t, i) => (
                <span key={i} className="flex items-center gap-2">
                  {t.href ? (
                    <Link href={t.href} className="hover:text-foreground transition-colors">{t.label}</Link>
                  ) : (
                    <span className="text-foreground font-medium">{t.label}</span>
                  )}
                  {i < trail.length - 1 && <span className="text-border">/</span>}
                </span>
              ))}
            </nav>
          )}
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-[0.18em]">Prospection Builder</div>
      </div>
    </header>
  );
}
