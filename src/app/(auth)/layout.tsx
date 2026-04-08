import Link from "next/link";
import { Syringe } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Simple header */}
      <header className="py-5 px-4">
        <Link href="/" className="flex items-center gap-2 w-fit mx-auto">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Syringe className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-green-800">GlpCoach</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-4 text-center text-sm text-green-500">
        GlpCoach is geen medisch advies. Raadpleeg altijd je arts.
      </footer>
    </div>
  );
}
