import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { SECTION_DEFS } from "@/lib/toolbox-sections";
import { SectionEditorView } from "@/components/toolbox/SectionEditorView";

export default async function ToolboxSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  const def = SECTION_DEFS.find((s) => s.slug === section);
  if (!def) notFound();

  return (
    <>
      <Header
        trail={[
          { label: "Missions", href: "/" },
          { label: "Mission", href: `/missions/${id}` },
          { label: "Boîte à outils", href: `/missions/${id}/boite-a-outils` },
          { label: def.label },
        ]}
      />
      <SectionEditorView missionId={id} sectionKey={def.key} />
    </>
  );
}
