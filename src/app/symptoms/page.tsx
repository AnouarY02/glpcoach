"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { differenceInDays, format } from "date-fns";
import { nl } from "date-fns/locale";
import { Loader2, CheckCircle, Activity } from "lucide-react";
import type { SymptomType } from "@/lib/types";

const SYMPTOMS: { value: SymptomType; label: string; emoji: string }[] = [
  { value: "misselijkheid", label: "Misselijkheid", emoji: "🤢" },
  { value: "vermoeidheid", label: "Vermoeidheid", emoji: "😴" },
  { value: "constipatie", label: "Constipatie", emoji: "😣" },
  { value: "hoofdpijn", label: "Hoofdpijn", emoji: "🤕" },
  { value: "sulfur_burps", label: "Sulfur boeren", emoji: "💨" },
  { value: "overig", label: "Overig", emoji: "📝" },
];

const CYCLE_TIPS: Record<number, string> = {
  1: "Dag 1–2: Bijwerkingen zijn nu het meest gebruikelijk. Misselijkheid en vermoeidheid komen veel voor. Dit is tijdelijk!",
  2: "Dag 1–2: Bijwerkingen zijn nu het meest gebruikelijk. Misselijkheid en vermoeidheid komen veel voor. Dit is tijdelijk!",
  3: "Dag 3–5: Je zit in de piekfase. Eetlustremming is nu het sterkst. Goed moment voor structuur in maaltijden.",
  4: "Dag 3–5: Je zit in de piekfase. Eetlustremming is nu het sterkst. Goed moment voor structuur in maaltijden.",
  5: "Dag 3–5: Je zit in de piekfase. Eetlustremming is nu het sterkst. Goed moment voor structuur in maaltijden.",
  6: "Dag 6–7: Dalende fase. Hongergevoel kan iets toenemen — dat is normaal. Je volgende injectie komt eraan.",
  7: "Dag 6–7: Dalende fase. Hongergevoel kan iets toenemen — dat is normaal. Je volgende injectie komt eraan.",
};

interface SymptomRecord {
  id: string;
  logged_at: string;
  type: SymptomType;
  severity: number;
  notes?: string;
  cycle_day?: number;
}

export default function SymptomsPage() {
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomRecord[]>([]);
  const [cycleDay, setCycleDay] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: injections }, { data: symptoms }] = await Promise.all([
        supabase.from("injections").select("injected_at").eq("user_id", user.id)
          .order("injected_at", { ascending: false }).limit(1),
        supabase.from("symptoms").select("*").eq("user_id", user.id)
          .order("logged_at", { ascending: false }).limit(10),
      ]);

      if (injections?.[0]) {
        const day = differenceInDays(new Date(), new Date(injections[0].injected_at)) + 1;
        setCycleDay(Math.min(day, 7));
      }
      if (symptoms) setRecentSymptoms(symptoms);
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!selectedSymptom) return;
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase.from("symptoms").insert({
        user_id: user.id,
        type: selectedSymptom,
        severity,
        notes: notes || null,
        cycle_day: cycleDay,
      });

      if (error) throw error;

      setSuccess(true);
      setSelectedSymptom(null);
      setNotes("");
      setSeverity(3);

      const { data: updated } = await supabase.from("symptoms").select("*")
        .eq("user_id", user.id).order("logged_at", { ascending: false }).limit(10);
      if (updated) setRecentSymptoms(updated);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is iets misgegaan.");
    } finally {
      setLoading(false);
    }
  };

  const cycleTip = cycleDay ? CYCLE_TIPS[Math.min(cycleDay, 7)] : null;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-green-800">Bijwerkingen</h1>
        <p className="text-green-600 text-sm mt-0.5">Patronen herkennen begint met bijhouden.</p>
      </div>

      {/* Cycle Context */}
      {cycleDay && cycleTip && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-800">Dag {cycleDay} context</span>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">{cycleTip}</p>
        </div>
      )}

      {/* Symptom Quick Tap */}
      <div className="card space-y-5">
        <div>
          <label className="label">Welk symptoom heb je?</label>
          <div className="grid grid-cols-3 gap-2">
            {SYMPTOMS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSelectedSymptom(s.value)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedSymptom === s.value
                    ? "border-green-600 bg-green-50"
                    : "border-green-100 hover:border-green-300 bg-white"
                }`}
              >
                <div className="text-xl mb-1">{s.emoji}</div>
                <div className="text-xs font-medium text-green-800">{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedSymptom && (
          <>
            {/* Severity */}
            <div>
              <label className="label">Hoe erg is het? ({severity}/5)</label>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-green-500">Mild</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-xs text-green-500">Ernstig</span>
              </div>
              <div className="flex justify-between mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeverity(n)}
                    className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                      severity === n
                        ? "bg-orange-500 text-white"
                        : "bg-green-100 text-green-600 hover:bg-green-200"
                    }`}
                  >
                    {n}
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
                placeholder="Wat merkte je nog meer?"
              />
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Symptoom opgeslagen!
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedSymptom || loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            "Symptoom opslaan"
          )}
        </button>
      </div>

      {/* Recent Symptoms */}
      {recentSymptoms.length > 0 && (
        <div>
          <h2 className="font-semibold text-green-800 mb-3">Recente bijwerkingen</h2>
          <div className="space-y-2">
            {recentSymptoms.map((sym) => {
              const symptomInfo = SYMPTOMS.find((s) => s.value === sym.type);
              return (
                <div key={sym.id} className="card flex items-center gap-3 py-3">
                  <span className="text-xl shrink-0">{symptomInfo?.emoji || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-green-800 text-sm">
                      {symptomInfo?.label || sym.type}
                    </div>
                    <div className="text-xs text-green-500">
                      {format(new Date(sym.logged_at), "d MMM 'om' HH:mm", { locale: nl })}
                      {sym.cycle_day && ` · Dag ${sym.cycle_day}`}
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`w-2 h-2 rounded-full ${
                          n <= sym.severity ? "bg-orange-400" : "bg-green-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
