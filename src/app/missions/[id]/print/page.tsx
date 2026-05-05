import { PrintView } from "@/components/PrintView";
import type { ExportScope } from "@/lib/exporters";

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { id } = await params;
  const { scope: rawScope } = await searchParams;
  const scope: ExportScope = rawScope === "matrix" || rawScope === "toolbox" ? rawScope : "both";
  return <PrintView missionId={id} scope={scope} />;
}
