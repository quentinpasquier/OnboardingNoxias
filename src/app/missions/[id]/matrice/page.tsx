import { Header } from "@/components/Header";
import { AtelierMatrice } from "@/components/AtelierMatrice";

export default async function AtelierMatricePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header trail={[{ label: "Missions", href: "/" }, { label: "Mission", href: `/missions/${id}` }, { label: "Matrice" }]} />
      <AtelierMatrice missionId={id} />
    </>
  );
}
