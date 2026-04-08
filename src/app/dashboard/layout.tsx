import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Syringe,
  LayoutDashboard,
  Brain,
  Apple,
  TrendingDown,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/inject", icon: Syringe, label: "Injectie" },
  { href: "/coach", icon: Brain, label: "Coach" },
  { href: "/meals", icon: Apple, label: "Voeding" },
  { href: "/progress", icon: TrendingDown, label: "Voortgang" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("email, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const displayEmail = profile?.email || user.email || "";
  const shortEmail = displayEmail.split("@")[0];

  return (
    <div className="min-h-screen bg-cream">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-green-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <Syringe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-green-800 text-base">GlpCoach</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-green-600 hidden sm:block">
              👋 {shortEmail}
            </span>
            <form action="/api/auth/signout" method="post">
              <Link
                href="/api/auth/signout"
                className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Uitloggen</span>
              </Link>
            </form>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar + Content */}
      <div className="max-w-5xl mx-auto flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 pt-6 pr-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-green-700 hover:bg-green-50 hover:text-green-900 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-green-100 mt-2">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
              >
                Instellingen
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 pb-24 md:pb-6 min-w-0">
          {children}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-green-100 md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 text-green-600 hover:text-green-900 transition-colors py-2 px-3"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
