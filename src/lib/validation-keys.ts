/**
 * Clés de validation par bloc.
 * Format identique aux ancres de commentaires pour cohérence (mais différent du
 * système de commentaires : matrix utilise matrixStatus, ici on adresse la
 * boîte à outils via mission.validations).
 */

export const ValidationKey = {
  positioning: () => "positioning",
  persona: (i: number) => `persona:${i}`,
  arguments_: () => "arguments",
  pitch: (id: string) => `pitch:${id}`,
  objection: (code: string) => `objection:${code}`,
  qualification: () => "qualification",
};

export function isValidated(validations: Record<string, boolean> | undefined, key: string): boolean {
  return validations?.[key] === true;
}
