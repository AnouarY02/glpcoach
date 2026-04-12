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
  AlertCircle,
  TrendingDown,
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

  // Fetch profile, last injection, weight logs (more entries for plateau detection)
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
        .limit(10),
    ]);

  const lastInjection = injections?.[0];
  const lastWeight = weights?.[0];
  const firstWeight = weights?.[weights.length - 1];

  const cycleDay = lastInjection
    ? differenceInDays(new Date(), new Date(lastInjection.injected_at)) + 1
    : null;

  const daysUntilInjection = lastInjection
    ? 7 - differenceInDays(new Date(), new Date(lastInjection.injected_at))
    : null;

  const cycleInfo = cycleDay ? getCycleInfo(Math.min(cycleDay, 7)) : null;

  const greeting = getGreeting();
  const username = profile?.email?.split("@")[0] || "daar";

  const weightDelta =
    profile?.start_weight_kg && lastWeight
      ? profile.start_weight_kg - lastWeight.weight_kg
      : null;

  const weightLost = weightDelta !== null ? weightDelta.toFixed(1) : null;

  // Plateau detection: last 3+ entries with < 0.5kg delta
  let plateauDetected = false;
  if (weights && weights.length >= 3) {
    const recent = weights.slice(0, 3).map((w) => w.weight_kg);
    const delta = Math.abs(recent[0] - recent[recent.length - 1]);
    if (delta < 0.5) plateauDetected = true;
  }

  // Coach tip context
  const coachTip = plateauDetected
    ? "Plateau gedetecteerd — vraag de coach wat je kunt doen"
    : cycleDay
    ? `Dag ${Math.min(cycleDay, 7)}: vraag wat het beste past bij jouw cyclus`
    : "Start een gesprek met je coach";

  return (
    <div className="space-y-5">
      {/* Injection reminder — urgent alert */}
      {daysUntilInjection !== null && daysUntilInjection <= 1 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <div className="font-semibold text-orange-800 text-sm">
                {daysUntilInjection <= 0 ? "Injectie vandaag!" : "Injectie morgen"}
              </div>
              <div className="text-xs text-orange-600">Vergeet hem niet te loggen na het zetten.</div>
            </div>
          </div>
          <Link href="/inject" className="btn-primary text-xs py-1.5 px-3 shrink-0">
            Log nu
          </Link>
        </div>
      )}

      {/* Plateau alert */}
      {plateauDetected && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <div className="font-semibold text-blue-800 text-sm">Plateau gesignaleerd</div>
              <div className="text-xs text-blue-600">Je gewicht is de laatste metingen nauwelijks veranderd.</div>
            </div>
          </div>
          <Link href="/coach" className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0">
            Vraag coach
          </Link>
        </div>
      )}

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
              <span className="font-bold text-lg">Dag {Math.min(cycleDay, 7)} van je cyclus</span>
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
            {daysUntilInjection !== null && daysUntilInjection > 0
              ? daysUntilInjection
              : daysUntilInjection === 0
              ? "vandaag"
              : "—"}
          </div>
          <div className="text-xs text-green-500 mt-0.5">
            {daysUntilInjection === 0 ? "" : "dagen"}
          </div>
          <div className="text-xs font-medium text-green-700 mt-1">Volgende injectie</div>
        </div>

        <div className="card text-center">
          <div className="text-2xl font-bold text-green-800">
            {weightLost
              ? `${Number(weightLost) > 0 ? "-" : "+"}${Math.abs(Number(weightLost))}`
              : "—"}
          </div>
          <div className="text-xs text-green-500 mt-0.5">
            {weightLost ? "kg" : "geen data"}
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
              <div className="font-semibold text-green-800 text-sm">GLP Coach</div>
              <div className="text-xs text-green-600 mt-0.5">{coachTip}</div>
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
            {weightLost && (
              <span className={`text-sm mb-1 ml-2 ${Number(weightLost) > 0 ? "text-green-500" : "text-orange-500"}`}>
                ({Number(weightLost) > 0 ? "-" : "+"}{Math.abs(Number(weightLost))} kg totaal)
              </span>
            )}
          </div>
          <p className="text-xs text-green-500 mt-1">
            Gemeten op {format(new Date(lastWeight.logged_at), "d MMM", { locale: nl })}
          </p>
        </div>
      )}

      {/* First weight reference */}
      {firstWeight && firstWeight !== lastWeight && (
        <p className="text-xs text-green-400 text-center">
          Startgewicht: {firstWeight.weight_kg}kg op {format(new Date(firstWeight.logged_at), "d MMM yyyy", { locale: nl })}
        </p>
      )}
    </div>
  );
}
