"use client";
import { cn } from "@/lib/utils";
import { profileInitials } from "@/types/profile";

export function Avatar({
  src,
  displayName,
  email,
  size = 32,
  className,
}: {
  src?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = profileInitials({ displayName, email });
  const dim = `${size}px`;

  if (src) {
    return (
      <span
        className={cn("inline-block rounded-full overflow-hidden bg-secondary border border-border align-middle", className)}
        style={{ width: dim, height: dim }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={displayName ?? email ?? "Avatar"}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  // Fallback initiales avec dégradé léger sur fond accent_light → ink-tinted
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-noxias-deep bg-accent/15 border border-accent/30 select-none",
        className,
      )}
      style={{ width: dim, height: dim, fontSize: Math.max(10, Math.round(size * 0.38)) }}
      aria-label={displayName ?? email ?? "Utilisateur"}
    >
      {initials}
    </span>
  );
}
