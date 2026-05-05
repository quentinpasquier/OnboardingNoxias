import { Header } from "@/components/Header";
import { AtelierToolbox } from "@/components/AtelierToolbox";

export default async function AtelierToolboxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header trail={[{ label: "Missions", href: "/" }, { label: "Mission", href: `/missions/${id}` }, { label: "Boîte à outils" }]} />
      <AtelierToolbox missionId={id} />
    </>
  );
}
