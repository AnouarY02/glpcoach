"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, isToday } from "date-fns";
import { nl } from "date-fns/locale";
import { Loader2, CheckCircle, Apple, Droplets, Plus } from "lucide-react";

interface MealRecord {
  id: string;
  logged_at: string;
  description: string;
  protein_estimate_g: number;
}

interface CheckinRecord {
  water_ml: number;
  date: string;
}

const PROTEIN_GOAL = 80;
const WATER_GOAL = 2500;
const WATER_STEPS = [250, 500, 750];

export default function MealsPage() {
  const [description, setDescription] = useState("");
  const [proteinEstimate, setProteinEstimate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todaysMeals, setTodaysMeals] = useState<MealRecord[]>([]);
  const [checkin, setCheckin] = useState<CheckinRecord | null>(null);
  const [updatingWater, setUpdatingWater] = useState(false);

  const totalProtein = todaysMeals.reduce((sum, m) => sum + m.protein_estimate_g, 0);
  const waterMl = checkin?.water_ml || 0;
  const today = new Date().toISOString().split("T")[0];

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startOfDay = `${today}T00:00:00`;
    const endOfDay = `${today}T23:59:59`;

    const [{ data: meals }, { data: checkinData }] = await Promise.all([
      supabase.from("meals").select("*").eq("user_id", user.id)
        .gte("logged_at", startOfDay).lte("logged_at", endOfDay)
        .order("logged_at", { ascending: false }),
      supabase.from("daily_checkins").select("water_ml, date").eq("user_id", user.id).eq("date", today).single(),
    ]);

    if (meals) setTodaysMeals(meals);
    if (checkinData) setCheckin(checkinData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        description: description.trim(),
        protein_estimate_g: parseInt(proteinEstimate) || 0,
      });

      if (error) throw error;

      setSuccess(true);
      setDescription("");
      setProteinEstimate("");
      await loadData();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is iets misgegaan.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWater = async (ml: number) => {
    setUpdatingWater(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newTotal = waterMl + ml;

      await supabase.from("daily_checkins").upsert(
        { user_id: user.id, date: today, water_ml: newTotal },
        { onConflict: "user_id,date" }
      );

      setCheckin((prev) => ({ ...prev!, water_ml: newTotal, date: today }));
    } finally {
      setUpdatingWater(false);
    }
  };

  const proteinPct = Math.min((totalProtein / PROTEIN_GOAL) * 100, 100);
  const waterPct = Math.min((waterMl / WATER_GOAL) * 100, 100);

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-green-800">Voeding & Water</h1>
        <p className="text-green-600 text-sm mt-0.5">Vandaag — geen calorieën tellen, wel voldoende eiwit.</p>
      </div>

      {/* Protein tracker */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <Apple className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="font-semibold text-green-800 text-sm">Eiwitdoel vandaag</div>
            <div className="text-xs text-green-500">Streef naar minimaal {PROTEIN_GOAL}g eiwit</div>
          </div>
          <div className="ml-auto text-right">
            <span className="text-xl font-bold text-green-800">{totalProtein}</span>
            <span className="text-sm text-green-500">/{PROTEIN_GOAL}g</span>
          </div>
        </div>
        <div className="w-full bg-green-100 rounded-full h-3">
          <div
            className="bg-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${proteinPct}%` }}
          />
        </div>
        {totalProtein >= PROTEIN_GOAL && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            Geweldig! Je hebt je eiwitdoel gehaald vandaag.
          </p>
        )}
      </div>

      {/* Water tracker */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="font-semibold text-green-800 text-sm">Water vandaag</div>
            <div className="text-xs text-green-500">Doel: {WATER_GOAL}ml</div>
          </div>
          <div className="ml-auto text-right">
            <span className="text-xl font-bold text-green-800">{waterMl}</span>
            <span className="text-sm text-green-500">/{WATER_GOAL}ml</span>
          </div>
        </div>
        <div className="w-full bg-blue-100 rounded-full h-3 mb-3">
          <div
            className="bg-blue-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${waterPct}%` }}
          />
        </div>
        <div className="flex gap-2">
          {WATER_STEPS.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAddWater(ml)}
              disabled={updatingWater}
              className="flex-1 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      {/* Log meal */}
      <form onSubmit={handleLogMeal} className="card space-y-4">
        <h2 className="font-semibold text-green-800">Maaltijd loggen</h2>

        <div>
          <label className="label">Wat heb je gegeten?</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            placeholder="bijv. Griekse yoghurt met bessen"
            required
          />
        </div>

        <div>
          <label className="label">Geschat eiwit (g)</label>
          <input
            type="number"
            value={proteinEstimate}
            onChange={(e) => setProteinEstimate(e.target.value)}
            className="input-field"
            placeholder="bijv. 20"
            min={0}
            max={200}
          />
          <p className="text-xs text-green-500 mt-1.5">
            Niet zeker? Schat gerust — het gaat om bewustzijn, niet om perfectie.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Maaltijd opgeslagen!
          </div>
        )}

        <button
          type="submit"
          disabled={!description.trim() || loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Maaltijd opslaan
            </>
          )}
        </button>
      </form>

      {/* Today's meals */}
      {todaysMeals.length > 0 && (
        <div>
          <h2 className="font-semibold text-green-800 mb-3">Vandaag gegeten</h2>
          <div className="space-y-2">
            {todaysMeals.map((meal) => (
              <div key={meal.id} className="card flex items-center gap-3 py-3">
                <span className="text-xl shrink-0">🍽️</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-green-800 text-sm truncate">
                    {meal.description}
                  </div>
                  <div className="text-xs text-green-500">
                    {format(new Date(meal.logged_at), "HH:mm", { locale: nl })}
                  </div>
                </div>
                {meal.protein_estimate_g > 0 && (
                  <div className="shrink-0 bg-orange-50 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full">
                    {meal.protein_estimate_g}g eiwit
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protein tips */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <p className="text-sm text-green-800 font-medium mb-2">💡 Eiwitrijke keuzes</p>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• Griekse yoghurt (vol) — ~15g per 150g</li>
          <li>• Kipfilet — ~30g per 100g</li>
          <li>• Kwark — ~12g per 100g</li>
          <li>• Eieren — ~6g per ei</li>
          <li>• Cottage cheese — ~11g per 100g</li>
        </ul>
      </div>
    </div>
  );
}
