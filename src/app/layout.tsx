import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Noxias — Prospection Builder",
  description: "Co-construire la matrice de prospection et la boîte à outils du commercial avec votre client. IA + intervention humaine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased noxias-grain">
        {children}
      </body>
    </html>
  );
}
