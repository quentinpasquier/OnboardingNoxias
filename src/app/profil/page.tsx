import { Header } from "@/components/Header";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export const metadata = { title: "Mon profil — Noxias" };

export default function ProfilPage() {
  return (
    <>
      <Header trail={[{ label: "Profil" }]} />
      <ProfileEditor />
    </>
  );
}
