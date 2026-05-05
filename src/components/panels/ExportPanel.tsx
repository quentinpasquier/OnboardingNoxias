"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, FileText, FileType, Printer, ExternalLink, Loader2 } from "lucide-react";
import type { Mission } from "@/types/mission";
import { missionToMarkdown, downloadFile } from "@/lib/exporters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

export function ExportPanel({ mission }: { mission: Mission }) {
  const [busy, setBusy] = useState<string | null>(null);
  const slug = slugify(mission.clientName);

  function exportMd() {
    const md = missionToMarkdown(mission);
    downloadFile(`${slug}-prospection.md`, md, "text/markdown;charset=utf-8");
  }

  async function exportDocx() {
    setBusy("docx");
    try {
      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-prospection.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur export DOCX");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
      <Card>
        <CardHeader>
          <FileType className="h-6 w-6 text-accent mb-2" />
          <CardTitle className="text-base">Markdown</CardTitle>
          <CardDescription>Texte structuré, idéal pour Notion, GitHub, ou re-traitement.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportMd} variant="outline" className="w-full"><Download /> Télécharger .md</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <FileText className="h-6 w-6 text-accent mb-2" />
          <CardTitle className="text-base">Word (.docx)</CardTitle>
          <CardDescription>Document éditable, à partager avec le client en l'état.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportDocx} variant="accent" className="w-full" disabled={busy === "docx"}>
            {busy === "docx" ? <><Loader2 className="animate-spin" /> Génération…</> : <><Download /> Télécharger .docx</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Printer className="h-6 w-6 text-accent mb-2" />
          <CardTitle className="text-base">PDF (impression)</CardTitle>
          <CardDescription>Vue imprimable, utilise « Enregistrer en PDF » de ton navigateur.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/missions/${mission.id}/print`} target="_blank">
            <Button variant="outline" className="w-full"><ExternalLink /> Ouvrir la vue imprimable</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
