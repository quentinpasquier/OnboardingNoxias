/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Wordmark Noxias — fichier SVG vectoriel dans /public/brand/logo.svg.
 * Pour swap de l'asset officiel : remplacer simplement public/brand/logo.svg.
 */
export function NoxiasLogo({ className, size = 72 }: { className?: string; size?: number }) {
  return (
    <img
      src="/brand/logo.svg"
      alt="Noxias"
      height={size}
      style={{ height: size, width: "auto" }}
      className={cn("inline-block select-none", className)}
      draggable={false}
    />
  );
}
