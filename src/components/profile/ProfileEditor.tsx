"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Loader2, Upload, Check, Trash2, ArrowLeft } from "lucide-react";
import { profileStore } from "@/lib/supabase/profile-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/profile/Avatar";

export function ProfileEditor() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState<"save" | "upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    profileStore.me().then((p) => {
      setProfile(p);
      setDisplayName(p?.displayName ?? "");
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Impossible de charger le profil");
      setProfile(null);
    });
  }, []);

  async function saveName() {
    setBusy("save");
    setError(null);
    try {
      const updated = await profileStore.update({ displayName: displayName.trim() || null });
      setProfile(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("upload");
    setError(null);
    try {
      const url = await profileStore.uploadAvatar(file);
      const updated = await profileStore.update({ avatarUrl: url });
      setProfile(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeAvatar() {
    if (!confirm("Retirer ta photo de profil ?")) return;
    setBusy("remove");
    setError(null);
    try {
      const updated = await profileStore.update({ avatarUrl: null });
      setProfile(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  if (profile === undefined) {
    return <main className="container max-w-2xl py-12"><p className="text-muted-foreground">Chargement…</p></main>;
  }

  return (
    <main className="container max-w-2xl py-12">
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-3.5 w-3.5" /> Retour aux missions
      </Link>

      <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Mon profil</h1>
      <p className="text-muted-foreground mb-8">Ton nom et ta photo apparaissent à côté des missions que tu crées et dans le header.</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photo</CardTitle>
          <CardDescription>JPEG, PNG, WebP ou GIF jusqu'à 4 Mo. Carrée idéalement.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar src={profile?.avatarUrl} displayName={profile?.displayName} email={email} size={88} />
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={onPickFile}
                disabled={busy === "upload"}
              />
              <Button
                variant="accent"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy === "upload"}
              >
                {busy === "upload" ? <><Loader2 className="animate-spin" /> Upload…</> : <><Upload /> {profile?.avatarUrl ? "Changer la photo" : "Importer une photo"}</>}
              </Button>
              {profile?.avatarUrl && (
                <Button variant="outline" size="sm" onClick={removeAvatar} disabled={busy === "remove"}>
                  {busy === "remove" ? <Loader2 className="animate-spin" /> : <Trash2 />} Retirer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Identité</CardTitle>
          <CardDescription>Ton email Noxias est immuable. Le nom affiché sert d'étiquette à côté des missions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email ?? ""} disabled readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">Nom affiché</Label>
            <div className="flex gap-2">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Quentin Pasquier"
                maxLength={80}
              />
              <Button onClick={saveName} variant="accent" disabled={busy === "save"}>
                {busy === "save" ? <><Loader2 className="animate-spin" /> Sauvegarde…</> : <><Check /> Sauvegarder</>}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {savedAt && Date.now() - savedAt < 4000 && (
            <p className="text-xs text-emerald-700 inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Profil mis à jour</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
