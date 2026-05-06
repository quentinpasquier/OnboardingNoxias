import { PrintView } from "@/components/PrintView";
import type { ExportScope } from "@/lib/exporters";

export const metadata = {
  title: "Impression · Onboarding Noxias",
  robots: { index: false, follow: false },
};

export default async function SharedPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { token } = await params;
  const { scope } = await searchParams;
  const validScope: ExportScope = scope === "matrix" || scope === "toolbox" ? scope : "both";
  return <PrintView token={token} scope={validScope} />;
}
