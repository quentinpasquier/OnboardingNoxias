import { Header } from "@/components/Header";
import { AtelierContexte } from "@/components/AtelierContexte";

export default async function ContextePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header trail={[{ label: "Missions", href: "/" }, { label: "Mission", href: `/missions/${id}` }, { label: "Contexte" }]} />
      <AtelierContexte missionId={id} />
    </>
  );
}
