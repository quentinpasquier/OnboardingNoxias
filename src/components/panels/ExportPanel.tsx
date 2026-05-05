"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, FileText, FileSpreadsheet, FileType, Printer, ExternalLink, Loader2 } from "lucide-react";
import type { Mission } from "@/types/mission";
import { missionToMarkdown, downloadFile, type ExportScope } from "@/lib/exporters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

export function ExportPanel({ mission, scope = "both" }: { mission: Mission; scope?: ExportScope }) {
  const [busy, setBusy] = useState<string | null>(null);
  const slug = slugify(mission.clientName);
  const suffix = scope === "matrix" ? "matrice" : scope === "toolbox" ? "boite-a-outils" : "prospection";

  function exportMd() {
    const md = missionToMarkdown(mission, { scope });
    downloadFile(`${slug}-${suffix}.md`, md, "text/markdown;charset=utf-8");
  }

  async function exportDocx() {
    setBusy("docx");
    try {
      const res = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, scope }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-${suffix}.docx`;
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

  async function exportXlsx() {
    setBusy("xlsx");
    try {
      const res = await fetch("/api/export/xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-matrice.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur export XLSX");
    } finally {
      setBusy(null);
    }
  }

  const showXlsx = scope === "matrix" || scope === "both";
  const showPrint = scope === "toolbox" || scope === "both";
  const printHref = `/missions/${mission.id}/print?scope=${scope}`;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <FileType className="h-6 w-6 text-accent mb-2" />
          <CardTitle className="text-base">Markdown</CardTitle>
          <CardDescription>Texte structuré, idéal pour Notion, GitHub ou re-traitement.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportMd} variant="outline" className="w-full"><Download /> .md</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <FileText className="h-6 w-6 text-accent mb-2" />
          <CardTitle className="text-base">Word (.docx)</CardTitle>
          <CardDescription>Document Noxias formaté, à partager au client en l'état.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportDocx} variant="accent" className="w-full" disabled={busy === "docx"}>
            {busy === "docx" ? <><Loader2 className="animate-spin" /> Génération…</> : <><Download /> .docx</>}
          </Button>
        </CardContent>
      </Card>

      {showXlsx && (
        <Card>
          <CardHeader>
            <FileSpreadsheet className="h-6 w-6 text-accent mb-2" />
            <CardTitle className="text-base">Excel matrice (.xlsx)</CardTitle>
            <CardDescription>Tableau matrice 30 questions aux couleurs Noxias.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportXlsx} variant="outline" className="w-full" disabled={busy === "xlsx"}>
              {busy === "xlsx" ? <><Loader2 className="animate-spin" /> Génération…</> : <><Download /> .xlsx</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {showPrint && (
        <Card>
          <CardHeader>
            <Printer className="h-6 w-6 text-accent mb-2" />
            <CardTitle className="text-base">PDF (impression)</CardTitle>
            <CardDescription>Vue imprimable. Utilise « Enregistrer en PDF » du navigateur.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={printHref} target="_blank">
              <Button variant="outline" className="w-full"><ExternalLink /> Vue imprimable</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
