import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { differenceInDays, format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Syringe,
  Scale,
  Activity,
  Brain,
  ChevronRight,
  Droplets,
} from "lucide-react";

function getCycleInfo(cycleDay: number) {
  if (cycleDay <= 2) {
    return {
      label: "Vroege fase",
      emoji: "🟡",
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      tip: "Eerste dagen: bijwerkingen kunnen nu het sterkst zijn.",
    };
  } else if (cycleDay <= 5) {
    return {
      label: "Piekfase",
      emoji: "🟢",
      color: "bg-green-50 border-green-200 text-green-800",
      tip: "Medicatie zit op zijn hoogtepunt. Je eetlust wordt nu het meest onderdrukt.",
    };
  } else {
    return {
      label: "Dalende fase",
      emoji: "🔵",
      color: "bg-blue-50 border-blue-200 text-blue-800",
      tip: "Richting je volgende injectie. Honger kan iets toenemen — dat is heel normaal.",
    };
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile, last injection, weight logs
  const [{ data: profile }, { data: injections }, { data: weights }] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("injections")
        .select("*")
        .eq("user_id", user.id)
        .order("injected_at", { ascending: false })
        .limit(1),
      supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(5),
    ]);

  const lastInjection = injections?.[0];
  const lastWeight = weights?.[0];
  const firstWeight = weights?.[weights.length - 1];

  const cycleDay = lastInjection
    ? differenceInDays(new Date(), new Date(lastInjection.injected_at)) + 1
    : null;

  const nextInjectionDays = lastInjection
    ? 7 - differenceInDays(new Date(), new Date(lastInjection.injected_at))
    : null;

  const cycleInfo = cycleDay ? getCycleInfo(cycleDay) : null;

  const greeting = getGreeting();
  const username = profile?.email?.split("@")[0] || "daar";

  const weightLost =
    profile?.start_weight_kg && lastWeight
      ? (profile.start_weight_kg - lastWeight.weight_kg).toFixed(1)
      : null;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-green-800">
          {greeting}, {username}! 👋
        </h1>
        <p className="text-green-600 text-sm mt-0.5">
          {format(new Date(), "EEEE d MMMM", { locale: nl })}
        </p>
      </div>

      {/* Cycle Day Card */}
      {cycleDay && cycleInfo ? (
        <div className={`rounded-2xl border-2 p-5 ${cycleInfo.color}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{cycleInfo.emoji}</span>
              <span className="font-bold text-lg">Dag {cycleDay} van je cyclus</span>
            </div>
            <span className="text-sm font-medium opacity-75">{cycleInfo.label}</span>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">{cycleInfo.tip}</p>
        </div>
      ) : (
        <div className="card border-2 border-dashed border-green-200 text-center py-6">
          <p className="text-green-600 text-sm">
            Log je eerste injectie om je cyclusdag te zien.
          </p>
          <Link href="/inject" className="btn-primary mt-3 text-sm py-2 px-4">
            Injectie loggen
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-800">
            {lastInjection
              ? differenceInDays(new Date(), new Date(lastInjection.injected_at))
              : "—"}
          </div>
          <div className="text-xs text-green-500 mt-0.5">dagen geleden</div>
          <div className="text-xs font-medium text-green-700 mt-1">Laatste injectie</div>
        </div>

        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-500">
            {nextInjectionDays !== null && nextInjectionDays > 0
              ? nextInjectionDays
              : nextInjectionDays === 0
              ? "vandaag"
              : "—"}
          </div>
          <div className="text-xs text-green-500 mt-0.5">
            {nextInjectionDays === 0 ? "" : "dagen"}
          </div>
          <div className="text-xs font-medium text-green-700 mt-1">Volgende injectie</div>
        </div>

        <div className="card text-center">
          <div className="text-2xl font-bold text-green-800">
            {weightLost ? `${Number(weightLost) > 0 ? "-" : ""}${weightLost}` : "—"}
          </div>
          <div className="text-xs text-green-500 mt-0.5">
            {weightLost ? "kg verloren" : "geen data"}
          </div>
          <div className="text-xs font-medium text-green-700 mt-1">Gewicht</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-green-700 mb-3 uppercase tracking-wide">
          Snel loggen
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/inject", icon: Syringe, label: "Injectie", color: "bg-green-600" },
            { href: "/symptoms", icon: Activity, label: "Symptoom", color: "bg-yellow-500" },
            { href: "/progress", icon: Scale, label: "Gewicht", color: "bg-blue-500" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card flex flex-col items-center gap-2 py-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-green-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Coach teaser */}
      <Link href="/coach" className="card block border-2 border-orange-200 hover:border-orange-400 transition-colors group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="font-semibold text-green-800 text-sm">AI Coach tip voor vandaag</div>
              <div className="text-xs text-green-600 mt-0.5">
                {cycleDay
                  ? `Dag ${cycleDay}: vraag wat het beste past bij jouw cyclus`
                  : "Start een gesprek met je coach"}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-green-400 group-hover:text-orange-500 transition-colors" />
        </div>
      </Link>

      {/* Water reminder */}
      <div className="card flex items-center gap-3 bg-blue-50 border-blue-100">
        <Droplets className="w-8 h-8 text-blue-400 shrink-0" />
        <div>
          <div className="font-medium text-blue-800 text-sm">Vergeet niet genoeg te drinken</div>
          <div className="text-xs text-blue-600">Streef naar 2.5L water per dag.</div>
        </div>
        <Link href="/meals" className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
          Log water
        </Link>
      </div>

      {/* Recent weight */}
      {lastWeight && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-800 text-sm">Laatste weging</h3>
            <Link href="/progress" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
              Alles zien
            </Link>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-green-800">{lastWeight.weight_kg}</span>
            <span className="text-green-600 mb-1">kg</span>
            {weightLost && Number(weightLost) > 0 && (
              <span className="text-sm text-green-500 mb-1 ml-2">
                (-{weightLost} kg totaal)
              </span>
            )}
          </div>
          <p className="text-xs text-green-500 mt-1">
            Gemeten op {format(new Date(lastWeight.logged_at), "d MMM", { locale: nl })}
          </p>
        </div>
      )}
    </div>
  );
}
