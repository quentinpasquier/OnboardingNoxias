"use client";
import { useState } from "react";
import { Upload, Globe, FileText, Trash2, Loader2, StickyNote } from "lucide-react";
import type { Mission, MissionFile } from "@/types/mission";
import type { MissionUpdater } from "@/hooks/use-mission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function ContextPanel({ mission, update }: { mission: Mission; update: (u: MissionUpdater) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteName, setPasteName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [scrapeUrl, setScrapeUrl] = useState(mission.clientWebsite ?? "");
  const [notes, setNotes] = useState(mission.notes ?? "");

  function addFile(name: string, excerpt: string) {
    const f: MissionFile = { id: crypto.randomUUID(), name, excerpt, addedAt: new Date().toISOString() };
    update((prev) => ({ ...prev, files: [...prev.files, f] }));
  }

  async function onPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("pdf");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Erreur extraction (${res.status})`);
      const { text } = await res.json();
      addFile(file.name, text || "(PDF vide ou non extractible)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function onScrape() {
    if (!scrapeUrl.trim()) return;
    setError(null);
    setBusy("scrape");
    try {
      const res = await fetch("/api/scrape-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });
      if (!res.ok) throw new Error(`Erreur scrape (${res.status})`);
      const { text, title } = await res.json();
      addFile(`Site web, ${title || scrapeUrl}`, text);
      update((prev) => prev.clientWebsite ? prev : { ...prev, clientWebsite: scrapeUrl.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  function onPaste(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteName.trim() || !pasteText.trim()) return;
    addFile(pasteName.trim(), pasteText.trim());
    setPasteName("");
    setPasteText("");
  }

  function removeFile(id: string) {
    update((prev) => ({ ...prev, files: prev.files.filter((f) => f.id !== id) }));
  }

  function saveNotes() {
    update((prev) => ({ ...prev, notes }));
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Documents & contexte</CardTitle>
            <CardDescription>Importe les sources sur lesquelles l'IA peut s'appuyer pour pré-remplir la matrice. PDF, URL du site client, ou texte collé.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Label className="border border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
                {busy === "pdf" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-accent" />}
                <span className="text-sm font-medium">Importer un PDF</span>
                <span className="text-xs text-muted-foreground text-center">Brief, plaquette, deck commercial…</span>
                <input type="file" accept="application/pdf" className="sr-only" onChange={onPdfUpload} disabled={busy === "pdf"} />
              </Label>
              <div className="border border-dashed border-border rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-accent" /><span className="text-sm font-medium">Site web client</span></div>
                <Input placeholder="https://…" value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} />
                <Button onClick={onScrape} disabled={busy === "scrape" || !scrapeUrl.trim()} size="sm" variant="outline">
                  {busy === "scrape" ? <><Loader2 className="animate-spin" /> Scrape…</> : "Récupérer le contenu"}
                </Button>
              </div>
            </div>

            <form onSubmit={onPaste} className="space-y-3 border-t pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Coller du texte (transcription, mail, brief…)</span>
              </div>
              <Input placeholder="Titre du document" value={pasteName} onChange={(e) => setPasteName(e.target.value)} />
              <Textarea placeholder="Coller ici le contenu…" rows={4} value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
              <Button type="submit" variant="outline" size="sm" disabled={!pasteName.trim() || !pasteText.trim()}>Ajouter</Button>
            </form>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5 text-accent" /> Notes d'atelier</CardTitle>
            <CardDescription>Tes remarques personnelles sur la mission. Pas envoyées à l'IA par défaut.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Ex. Le client préfère un ton premium, ne pas mentionner X, RDV signé pour le 12…" />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit sticky top-20">
        <CardHeader>
          <CardTitle className="text-base">Sources ({mission.files.length})</CardTitle>
          <CardDescription>Utilisées comme contexte par l'IA</CardDescription>
        </CardHeader>
        <CardContent>
          {mission.files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune source pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {mission.files.map((f) => (
                <li key={f.id} className="flex items-start gap-2 group">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{Math.round(f.excerpt.length / 1000)} k chars</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(f.addedAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFile(f.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
