import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Onboarding Noxias",
  description: "Co-construire la matrice de prospection et la boîte à outils du commercial avec votre client. IA + intervention humaine.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
    apple: ["/brand/icon.svg"],
  },
  openGraph: {
    title: "Onboarding Noxias",
    description: "Co-construire la matrice de prospection et la boîte à outils du commercial avec votre client.",
    siteName: "Onboarding Noxias",
    images: [{ url: "/brand/icon.svg", width: 64, height: 64, alt: "Noxias" }],
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={ubuntu.variable}>
      <body className="min-h-screen font-sans antialiased noxias-grain">
        {children}
      </body>
    </html>
  );
}
