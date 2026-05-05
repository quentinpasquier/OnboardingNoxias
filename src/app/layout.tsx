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
  title: "Noxias — Prospection Builder",
  description: "Co-construire la matrice de prospection et la boîte à outils du commercial avec votre client. IA + intervention humaine.",
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
