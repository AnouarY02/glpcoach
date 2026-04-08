"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, Scale, Syringe, Flame, Loader2 } from "lucide-react";
import { WeightLogForm } from "@/components/WeightLogForm";

interface WeightEntry {
  logged_at: string;
  weight_kg: number;
}

interface InjectionEntry {
  injected_at: string;
  dose_mg: number;
  site: string;
}

export default function ProgressPage() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [injections, setInjections] = useState<InjectionEntry[]>([]);
  const [startWeight, setStartWeight] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: weightData }, { data: injData }] = await Promise.all([
        supabase.from("user_profiles").select("start_weight_kg, start_date").eq("id", user.id).single(),
        supabase.from("weight_logs").select("logged_at, weight_kg").eq("user_id", user.id)
          .order("logged_at", { ascending: true }),
        supabase.from("injections").select("injected_at, dose_mg, site").eq("user_id", user.id)
          .order("injected_at", { ascending: false }).limit(10),
      ]);

      if (profile) {
        setStartWeight(profile.start_weight_kg);
        setStartDate(profile.start_date);
      }
      if (weightData) setWeights(weightData);
      if (injData) setInjections(injData);
      setLoading(false);
    };
    load();
  }, []);

  const currentWeight = weights[weights.length - 1]?.weight_kg;
  const totalLost = startWeight && currentWeight ? startWeight - currentWeight : null;
  const weeksSinceStart = startDate
    ? Math.floor(differenceInDays(new Date(), new Date(startDate)) / 7)
    : null;

  // Streak: consecutive days that have any weight log entry (going back from today)
  const streak = (() => {
    if (weights.length === 0) return 0;
    const uniqueDays = Array.from(
      new Set(weights.map((w) => w.logged_at.split("T")[0]))
    ).sort().reverse();
    let count = 0;
    let expected = new Date();
    for (const day of uniqueDays) {
      const dayDate = new Date(day);
      const diff = differenceInDays(expected, dayDate);
      if (diff <= 1) {
        count++;
        expected = dayDate;
      } else {
        break;
      }
    }
    return count;
  })();

  // Chart data
  const chartData = weights.map((w) => ({
    date: format(new Date(w.logged_at), "d MMM", { locale: nl }),
    gewicht: w.weight_kg,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-green-800">Jouw voortgang</h1>
        <p className="text-green-600 text-sm mt-0.5">Elke gram telt — en jij bent op de goede weg.</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <TrendingDown className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-800">
            {totalLost !== null ? `-${totalLost.toFixed(1)}` : "—"}
          </div>
          <div className="text-xs text-green-500 mt-0.5">kg verloren</div>
        </div>

        <div className="card text-center">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Scale className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-green-800">
            {currentWeight || "—"}
          </div>
          <div className="text-xs text-green-500 mt-0.5">huidig gewicht (kg)</div>
        </div>

        <div className="card text-center">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Syringe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-green-800">
            {weeksSinceStart ?? "—"}
          </div>
          <div className="text-xs text-green-500 mt-0.5">weken actief</div>
        </div>

        <div className="card text-center">
          <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Flame className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-green-800">{streak}</div>
          <div className="text-xs text-green-500 mt-0.5">dagen streak</div>
        </div>
      </div>

      {/* Quick weight log */}
      <div className="card">
        <h3 className="font-semibold text-green-800 mb-3 text-sm">Gewicht loggen</h3>
        <WeightLogForm
          compact
          onSaved={(kg) => {
            setWeights((prev) => [
              ...prev,
              { logged_at: new Date().toISOString(), weight_kg: kg },
            ]);
          }}
        />
      </div>

      {/* Weight Chart */}
      {chartData.length >= 2 ? (
        <div className="card">
          <h3 className="font-semibold text-green-800 mb-4">Gewichtsverloop</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D4EDE3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#2D6A4F" }}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "#2D6A4F" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #D4EDE3",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value} kg`, "Gewicht"]}
              />
              <Line
                type="monotone"
                dataKey="gewicht"
                stroke="#1B4332"
                strokeWidth={2.5}
                dot={{ fill: "#F97316", r: 4 }}
                activeDot={{ r: 6, fill: "#F97316" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card border-2 border-dashed border-green-200 text-center py-8">
          <Scale className="w-8 h-8 text-green-300 mx-auto mb-2" />
          <p className="text-green-600 text-sm">
            Log 2 of meer wegingen om een grafiek te zien.
          </p>
        </div>
      )}

      {/* Comparison */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <p className="text-sm text-green-800 font-medium mb-1">📊 Vergelijking met klinische studies</p>
        <p className="text-xs text-green-700 leading-relaxed">
          Klinische studies tonen gemiddeld 5–15% gewichtsverlies in 6 maanden met GLP-1 medicatie.
          {weeksSinceStart !== null && weeksSinceStart > 0
            ? ` Jij bent nu ${weeksSinceStart} week${weeksSinceStart !== 1 ? "en" : ""} onderweg.`
            : ""}
          {" "}Elk lichaam is anders — wat telt is de richting, niet de snelheid.
        </p>
      </div>

      {/* Recent injections */}
      {injections.length > 0 && (
        <div>
          <h3 className="font-semibold text-green-800 mb-3">Recente injecties</h3>
          <div className="space-y-2">
            {injections.slice(0, 5).map((inj, i) => (
              <div key={i} className="card flex items-center gap-3 py-3">
                <Syringe className="w-4 h-4 text-green-600 shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-green-800 font-medium">{inj.dose_mg}mg — {inj.site}</span>
                </div>
                <span className="text-xs text-green-500">
                  {format(new Date(inj.injected_at), "d MMM", { locale: nl })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
