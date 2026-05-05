"use client";
import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  if (!email) return null;

  return (
    <form action="/auth/signout" method="post" className="flex items-center gap-2">
      <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5" /> {email}
      </span>
      <button
        type="submit"
        className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary"
        aria-label="Se déconnecter"
      >
        <LogOut className="h-3.5 w-3.5" /> Déconnexion
      </button>
    </form>
  );
}
