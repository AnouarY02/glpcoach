import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GlpCoach — Jouw GLP-1 Dagcoach",
  description:
    "GlpCoach helpt je het meeste uit je GLP-1 medicatie te halen. Log injecties, bijwerkingen en gewicht. Persoonlijke AI-coaching op basis van jouw cyclus.",
  keywords: ["GLP-1", "Ozempic", "Wegovy", "Mounjaro", "Zepbound", "coach", "afvallen"],
  openGraph: {
    title: "GlpCoach — Jouw GLP-1 Dagcoach",
    description: "Persoonlijke begeleiding bij je GLP-1 reis. Warm, praktisch en altijd bij de hand.",
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
