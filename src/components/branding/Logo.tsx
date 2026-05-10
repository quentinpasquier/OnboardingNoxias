/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Wordmark Noxias — fichier SVG vectoriel dans /public/brand/logo.svg.
 * Pour swap de l'asset officiel : remplacer simplement public/brand/logo.svg.
 */
export function NoxiasLogo({ className, size = 48 }: { className?: string; size?: number }) {
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

/**
 * Icône carré (X + triangle vert sur fond marine), identique au favicon.
 * Pour les écrans de chargement, header mobile, OG previews, places où le
 * wordmark est trop large.
 */
export function NoxiasIconMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src="/brand/icon.svg"
      alt="Noxias"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("inline-block select-none", className)}
      draggable={false}
    />
  );
}
