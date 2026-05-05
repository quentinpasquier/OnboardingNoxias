export type Profile = {
  id: string;            // = auth.users.id
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Initiales à afficher en fallback quand pas d'avatar (ex. "JD"). */
export function profileInitials(p: { displayName?: string | null; email?: string | null }): string {
  const source = (p.displayName?.trim() || p.email?.trim() || "").trim();
  if (!source) return "?";
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
