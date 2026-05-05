"use client";
import { useState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const sb = getSupabaseBrowserClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (next) callbackUrl.searchParams.set("next", next);
      const { error: err } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: callbackUrl.toString(),
          shouldCreateUser: false,
        },
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'envoi du lien");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
          <CheckCircle2 className="h-6 w-6 text-accent" />
        </div>
        <p className="font-medium">Lien envoyé</p>
        <p className="text-sm text-muted-foreground">
          Clique sur le lien dans l'email pour te connecter.
          Vérifie tes spams si tu ne le vois pas.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="text-xs text-accent hover:underline"
        >
          Renvoyer à une autre adresse
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Noxias</Label>
        <Input
          id="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom@noxias.com"
          disabled={busy}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="accent" size="lg" disabled={busy || !email.trim()} className="w-full">
        {busy ? <><Loader2 className="animate-spin" /> Envoi…</> : <><Mail /> Recevoir le lien magique</>}
      </Button>
    </form>
  );
}
