import { Header } from "@/components/Header";
import { MissionWorkspace } from "@/components/MissionWorkspace";

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header trail={[{ label: "Missions", href: "/" }, { label: "Mission" }]} />
      <MissionWorkspace missionId={id} />
    </>
  );
}
