"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Loader2, CheckCircle, Syringe, Calendar } from "lucide-react";
import type { InjectionSite } from "@/lib/types";

const SITES: { value: InjectionSite; label: string; emoji: string; description: string }[] = [
  { value: "buik", label: "Buik", emoji: "🫃", description: "Rond de navel, minstens 2cm ervan af" },
  { value: "dij", label: "Dij", emoji: "🦵", description: "Buitenkant bovenste deel van je dij" },
  { value: "arm", label: "Arm", emoji: "💪", description: "Buitenkant van je bovenarm" },
];

const DOSES = [0.25, 0.5, 1.0, 1.7, 2.0, 2.4, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0];

interface InjectionRecord {
  id: string;
  injected_at: string;
  dose_mg: number;
  site: InjectionSite;
  notes?: string;
}

export default function InjectPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [dose, setDose] = useState<number | null>(null);
  const [site, setSite] = useState<InjectionSite | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentInjections, setRecentInjections] = useState<InjectionRecord[]>([]);
  const [profile, setProfile] = useState<{ dose_mg: number; injection_day: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { data: injectionsData }] = await Promise.all([
        supabase.from("user_profiles").select("dose_mg, injection_day").eq("id", user.id).single(),
        supabase.from("injections").select("*").eq("user_id", user.id)
          .order("injected_at", { ascending: false }).limit(5),
      ]);

      if (profileData) {
        setProfile(profileData);
        setDose(profileData.dose_mg);
      }
      if (injectionsData) setRecentInjections(injectionsData);
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dose || !site) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase.from("injections").insert({
        user_id: user.id,
        injected_at: new Date(date).toISOString(),
        dose_mg: dose,
        site,
        notes: notes || null,
      });

      if (error) throw error;

      setSuccess(true);

      // Refresh list
      const { data: updated } = await supabase.from("injections").select("*")
        .eq("user_id", user.id).order("injected_at", { ascending: false }).limit(5);
      if (updated) setRecentInjections(updated);

      // Reset form
      setNotes("");
      setSite(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is iets misgegaan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-green-800">Injectie loggen</h1>
        <p className="text-green-600 text-sm mt-0.5">Bijhouden is de eerste stap naar inzicht.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Date/time */}
        <div>
          <label className="label flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Datum en tijdstip
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Dose */}
        <div>
          <label className="label">Dosis (mg)</label>
          <div className="flex flex-wrap gap-2">
            {DOSES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDose(d)}
                className={`px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  dose === d
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-green-100 hover:border-green-300 text-green-700 bg-white"
                }`}
              >
                {d}mg
              </button>
            ))}
          </div>
        </div>

        {/* Site */}
        <div>
          <label className="label">Injectielocatie</label>
          <div className="grid grid-cols-3 gap-3">
            {SITES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSite(s.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  site === s.value
                    ? "border-green-600 bg-green-50"
                    : "border-green-100 hover:border-green-300 bg-white"
                }`}
              >
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-sm font-semibold text-green-800">{s.label}</div>
                <div className="text-xs text-green-500 mt-0.5 leading-tight">{s.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notities (optioneel)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field resize-none"
            rows={2}
            placeholder="Hoe voelde de injectie? Bijzonderheden?"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Injectie opgeslagen!
          </div>
        )}

        <button
          type="submit"
          disabled={!dose || !site || loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Syringe className="w-4 h-4" />
              Injectie opslaan
            </>
          )}
        </button>
      </form>

      {/* Recent Injections */}
      {recentInjections.length > 0 && (
        <div>
          <h2 className="font-semibold text-green-800 mb-3">Recente injecties</h2>
          <div className="space-y-2">
            {recentInjections.map((inj) => (
              <div key={inj.id} className="card flex items-center gap-4 py-3">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Syringe className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-green-800 text-sm">
                    {inj.dose_mg}mg — {SITES.find((s) => s.value === inj.site)?.label || inj.site}
                  </div>
                  <div className="text-xs text-green-500">
                    {format(new Date(inj.injected_at), "d MMM yyyy 'om' HH:mm", { locale: nl })}
                  </div>
                </div>
                <div className="text-xs text-green-400 shrink-0">
                  {formatDistanceToNow(new Date(inj.injected_at), { locale: nl, addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rotation tip */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <p className="text-sm text-orange-800 font-medium mb-1">💡 Roteer je injectielocaties</p>
        <p className="text-xs text-orange-700 leading-relaxed">
          Gebruik elke week een andere plek om littekenweefsel te voorkomen.
          Houd ook binnen één locatie steeds een paar centimeter afstand.
        </p>
      </div>
    </div>
  );
}
