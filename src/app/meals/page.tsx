"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Loader2, CheckCircle, Apple, Droplets, Plus, Sparkles, Camera, X } from "lucide-react";

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

  // Photo state
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      // Strip the data URL prefix to get pure base64
      setPhotoBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoBase64(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyzeWithAI = async () => {
    if (!description.trim() && !photoBase64) return;
    setAiError(null);
    setAiTip(null);
    setAnalyzing(true);

    try {
      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() || "zie foto", photoBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyse mislukt");

      if (data.protein_estimate_g > 0) {
        setProteinEstimate(String(data.protein_estimate_g));
      }
      if (data.tips?.length > 0) {
        setAiTip(data.tips.join(" "));
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "AI analyse mislukt.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !photoBase64) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        description: description.trim() || "Maaltijd via foto",
        protein_estimate_g: parseInt(proteinEstimate) || 0,
      });

      if (error) throw error;

      setSuccess(true);
      setDescription("");
      setProteinEstimate("");
      clearPhoto();
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

        {/* Photo upload */}
        <div>
          <label className="label">Foto (optioneel)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
          {photoPreview ? (
            <div className="relative w-full rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Maaltijdfoto" className="w-full max-h-48 object-cover rounded-xl" />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-green-200 hover:border-green-400 rounded-xl text-green-500 hover:text-green-700 flex flex-col items-center gap-1.5 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm">Foto maken of kiezen</span>
            </button>
          )}
        </div>

        <div>
          <label className="label">Wat heb je gegeten?</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setAiTip(null);
              }}
              className="input-field flex-1"
              placeholder="bijv. Griekse yoghurt met bessen"
            />
            <button
              type="button"
              onClick={handleAnalyzeWithAI}
              disabled={(!description.trim() && !photoBase64) || analyzing}
              title="Analyseer eiwitgehalte met AI"
              className="shrink-0 px-3 py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-green-500 mt-1.5">
            Maak een foto of typ een omschrijving — klik ✨ voor AI analyse.
          </p>
        </div>

        {/* AI Tip callout */}
        {aiTip && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            <span className="font-medium">AI tip: </span>{aiTip}
          </div>
        )}

        {aiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {aiError}
          </div>
        )}

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
          disabled={(!description.trim() && !photoBase64) || loading}
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
