import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GlpCoach — GLP-1 werkt alleen als je weet wat je doet",
  description:
    "AI coach voor Ozempic, Wegovy en Mounjaro gebruikers. Begrijp food noise, bijwerkingen en plateaus. Log injecties en gewicht. Altijd klaar voor je arts.",
  keywords: ["GLP-1", "Ozempic", "Wegovy", "Mounjaro", "Zepbound", "coach", "afvallen", "food noise", "bijwerkingen"],
  openGraph: {
    title: "GlpCoach — GLP-1 werkt alleen als je weet wat je doet",
    description: "AI coach die jouw GLP-1 gebruik begrijpt. Bijwerkingen bijhouden, plateaus begrijpen, altijd klaar voor je arts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={inter.variable}>
      <body className="bg-cream font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
