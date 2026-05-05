import { Header } from "@/components/Header";
import { MissionHub } from "@/components/MissionHub";

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header trail={[{ label: "Missions", href: "/" }, { label: "Mission" }]} />
      <MissionHub missionId={id} />
    </>
  );
}
