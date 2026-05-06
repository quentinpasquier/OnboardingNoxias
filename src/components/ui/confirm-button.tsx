"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Variant = "ghost" | "outline" | "destructive";
type Size = "sm" | "default";

export function ConfirmButton({
  onConfirm,
  question = "Confirmer ?",
  confirmLabel = "Effacer",
  cancelLabel = "Annuler",
  variant = "ghost",
  size = "sm",
  className,
  children,
}: {
  onConfirm: () => void;
  question?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setArmed(true)}
        className={className}
      >
        {children}
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-destructive font-medium">{question}</span>
      <Button
        type="button"
        variant="destructive"
        size={size}
        onClick={() => {
          onConfirm();
          setArmed(false);
        }}
      >
        {confirmLabel}
      </Button>
      <Button type="button" variant="ghost" size={size} onClick={() => setArmed(false)}>
        {cancelLabel}
      </Button>
    </span>
  );
}
