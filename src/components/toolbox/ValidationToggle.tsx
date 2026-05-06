"use client";
import { CheckCircle2, Circle } from "lucide-react";
import type { Mission } from "@/types/mission";
import type { MissionUpdater } from "@/hooks/use-mission";
import { isValidated } from "@/lib/validation-keys";
import { Button } from "@/components/ui/button";

export function ValidationToggle({
  mission,
  update,
  validationKey,
  label = "Valider ce bloc",
}: {
  mission: Mission;
  update: (u: MissionUpdater) => void;
  validationKey: string;
  label?: string;
}) {
  const validated = isValidated(mission.validations, validationKey);

  function toggle() {
    update((prev) => {
      const v = { ...(prev.validations ?? {}) };
      if (validated) delete v[validationKey];
      else v[validationKey] = true;
      return { ...prev, validations: v };
    });
  }

  if (validated) {
    return (
      <Button
        type="button"
        onClick={toggle}
        variant="ghost"
        size="sm"
        className="text-emerald-700 hover:bg-emerald-50"
        title="Cliquer pour invalider"
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Validé
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      variant="outline"
      size="sm"
      className="border-dashed"
      title="Marquer ce bloc comme validé pour le client"
    >
      <Circle className="h-3.5 w-3.5" /> {label}
    </Button>
  );
}

export function ValidationBadge({
  validated,
  className = "",
}: {
  validated: boolean;
  className?: string;
}) {
  if (!validated) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700 ${className}`}>
      <CheckCircle2 className="h-3 w-3" /> Validé Noxias
    </span>
  );
}
