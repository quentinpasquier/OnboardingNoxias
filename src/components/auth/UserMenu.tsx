"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { profileStore } from "@/lib/supabase/profile-store";
import type { Profile } from "@/types/profile";
import { Avatar } from "@/components/profile/Avatar";

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    profileStore.me().then(setProfile).catch(() => setProfile(null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user) profileStore.me().then(setProfile).catch(() => {});
      else setProfile(null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  // Ferme le menu si on clique ailleurs
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [open]);

  if (!email) return null;

  const displayName = profile?.displayName?.trim() || email.split("@")[0];

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-sm hover:bg-secondary transition-colors"
        aria-label="Menu utilisateur"
      >
        <Avatar src={profile?.avatarUrl} displayName={displayName} email={email} size={28} />
        <span className="hidden sm:inline text-foreground font-medium max-w-32 truncate">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-md border bg-card shadow-lg z-40 py-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 border-b border-border mb-1.5">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <Link
            href="/profil"
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
            onClick={() => setOpen(false)}
          >
            <UserIcon className="h-3.5 w-3.5" /> Mon profil
          </Link>
          <form action="/auth/signout" method="post" className="px-3">
            <button
              type="submit"
              className="w-full text-left flex items-center gap-2 py-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Déconnexion
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
