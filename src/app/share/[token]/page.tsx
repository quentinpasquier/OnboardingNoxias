import { SharedMissionView } from "@/components/SharedMissionView";

export const metadata = {
  title: "Onboarding partagé · Noxias",
  robots: { index: false, follow: false },
};

export default async function SharedMissionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedMissionView token={token} />;
}
