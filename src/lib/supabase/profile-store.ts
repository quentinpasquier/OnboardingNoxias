"use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { rowToProfile, type Profile, type ProfileRow } from "@/types/profile";

export const profileStore = {
  /** Profil de l'utilisateur courant (crée la ligne au passage si absente). */
  async me(): Promise<Profile | null> {
    const sb = getSupabaseBrowserClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return null;

    const { data, error } = await sb.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
    if (error) throw error;
    if (data) return rowToProfile(data as ProfileRow);

    // Pas encore de profil → on crée la ligne
    const { data: created, error: insertErr } = await sb
      .from("profiles")
      .insert({ id: auth.user.id, display_name: auth.user.email?.split("@")[0] ?? null })
      .select("*")
      .single();
    if (insertErr) throw insertErr;
    return rowToProfile(created as ProfileRow);
  },

  /** Profil par id user (pour afficher l'avatar du créateur d'une mission). */
  async byIds(ids: string[]): Promise<Map<string, Profile>> {
    const sb = getSupabaseBrowserClient();
    if (ids.length === 0) return new Map();
    const { data, error } = await sb.from("profiles").select("*").in("id", ids);
    if (error) throw error;
    const m = new Map<string, Profile>();
    for (const row of (data ?? []) as ProfileRow[]) m.set(row.id, rowToProfile(row));
    return m;
  },

  async update(patch: { displayName?: string | null; avatarUrl?: string | null }): Promise<Profile> {
    const sb = getSupabaseBrowserClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) throw new Error("Non authentifié");

    const updates: Partial<ProfileRow> = {};
    if (patch.displayName !== undefined) updates.display_name = patch.displayName;
    if (patch.avatarUrl !== undefined) updates.avatar_url = patch.avatarUrl;

    const { data, error } = await sb
      .from("profiles")
      .upsert({ id: auth.user.id, ...updates })
      .select("*")
      .single();
    if (error) throw error;
    return rowToProfile(data as ProfileRow);
  },

  /** Upload une image dans le bucket avatars/<uid>/avatar.<ext> et renvoie l'URL publique. */
  async uploadAvatar(file: File): Promise<string> {
    const sb = getSupabaseBrowserClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) throw new Error("Non authentifié");

    // Validation côté client : limite 4 MB et formats image courants
    const MAX_BYTES = 4 * 1024 * 1024;
    if (file.size > MAX_BYTES) throw new Error("Image trop lourde (max 4 Mo).");
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) throw new Error("Format non supporté (JPEG, PNG, WebP ou GIF).");

    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "jpg";
    // On suffixe avec un timestamp pour éviter le cache navigateur sur l'URL publique.
    const path = `${auth.user.id}/avatar-${Date.now()}.${ext}`;

    const { error: upErr } = await sb.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
    if (upErr) throw upErr;

    const { data: pub } = sb.storage.from("avatars").getPublicUrl(path);
    return pub.publicUrl;
  },
};
