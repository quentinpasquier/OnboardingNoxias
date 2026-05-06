import { LoginForm } from "@/components/auth/LoginForm";
import { NoxiasLogo } from "@/components/branding/Logo";

export const metadata = { title: "Noxias, Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center p-6 noxias-grain">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><NoxiasLogo className="text-2xl" /></div>
        <div className="bg-card border rounded-xl shadow-sm p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Connexion</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Reçois un lien magique par email pour accéder à l'Onboarding Noxias.
          </p>
          <LoginForm next={sp.next} initialError={sp.error} />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-6">
          Réservé à l'équipe Noxias. Contacte un admin pour être invité.
        </p>
      </div>
    </main>
  );
}
