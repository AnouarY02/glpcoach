"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, differenceInDays, subWeeks } from "date-fns";
import { nl } from "date-fns/locale";
import { Loader2, Printer } from "lucide-react";

interface WeightEntry { logged_at: string; weight_kg: number; }
interface InjectionEntry { injected_at: string; dose_mg: number; site: string; }
interface SymptomEntry { logged_at: string; type: string; severity: number; cycle_day: number | null; }
interface Profile {
  email: string;
  medication_type: string;
  dose_mg: number;
  start_date: string | null;
  start_weight_kg: number | null;
}

export default function ReportPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [injections, setInjections] = useState<InjectionEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const eightWeeksAgo = subWeeks(new Date(), 8).toISOString();

      const [{ data: prof }, { data: wt }, { data: inj }, { data: sym }] = await Promise.all([
        supabase.from("user_profiles").select("email, medication_type, dose_mg, start_date, start_weight_kg").eq("id", user.id).single(),
        supabase.from("weight_logs").select("logged_at, weight_kg").eq("user_id", user.id).gte("logged_at", eightWeeksAgo).order("logged_at", { ascending: true }),
        supabase.from("injections").select("injected_at, dose_mg, site").eq("user_id", user.id).gte("injected_at", eightWeeksAgo).order("injected_at", { ascending: false }),
        supabase.from("symptoms").select("logged_at, type, severity, cycle_day").eq("user_id", user.id).gte("logged_at", eightWeeksAgo).order("logged_at", { ascending: false }),
      ]);

      if (prof) setProfile(prof);
      if (wt) setWeights(wt);
      if (inj) setInjections(inj);
      if (sym) setSymptoms(sym);
      setLoading(false);
    };
    load();
  }, []);

  const currentWeight = weights[weights.length - 1]?.weight_kg;
  const totalLost = profile?.start_weight_kg && currentWeight
    ? (profile.start_weight_kg - currentWeight).toFixed(1)
    : null;
  const weeksSinceStart = profile?.start_date
    ? Math.floor(differenceInDays(new Date(), new Date(profile.start_date)) / 7)
    : null;

  // Symptoms by cycle day
  const symptomByCycleDay: Record<number, { count: number; types: string[] }> = {};
  symptoms.forEach((s) => {
    if (s.cycle_day != null) {
      if (!symptomByCycleDay[s.cycle_day]) symptomByCycleDay[s.cycle_day] = { count: 0, types: [] };
      symptomByCycleDay[s.cycle_day].count++;
      const label = s.type.replace(/_/g, " ");
      if (!symptomByCycleDay[s.cycle_day].types.includes(label)) {
        symptomByCycleDay[s.cycle_day].types.push(label);
      }
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  const reportDate = format(new Date(), "d MMMM yyyy", { locale: nl });
  const medicijnLabel = (profile?.medication_type || "").charAt(0).toUpperCase() + (profile?.medication_type || "").slice(1);

  return (
    <>
      {/* Print button — hidden during print */}
      <div className="no-print mb-6 flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-green-800">Rapport voor arts-afspraak</h1>
          <p className="text-sm text-green-600">Laatste 8 weken — klik op Afdrukken om op te slaan als PDF</p>
        </div>
        <button
          onClick={() => window.print()}
          className="ml-auto btn-secondary flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Afdrukken / PDF
        </button>
      </div>

      {/* Report content */}
      <div className="report-page bg-white max-w-2xl mx-auto p-8 space-y-6 text-sm print:p-0 print:max-w-none">

        {/* Header */}
        <div className="border-b-2 border-green-700 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-green-800">GlpCoach — Voortgangsrapport</h1>
              <p className="text-green-600 text-xs mt-0.5">Persoonlijk tracking-overzicht — geen medisch document</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>{reportDate}</div>
              <div>{profile?.email}</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-xs text-amber-800">
          <strong>Disclaimer:</strong> Dit rapport toont uitsluitend door de gebruiker zelf ingevoerde gegevens. Het is geen medisch document, stelt geen diagnose en vervangt geen advies van een arts of apotheker.
        </div>

        {/* Profile */}
        <div>
          <h2 className="font-bold text-green-800 mb-2 text-sm">Medicatieprofiel</h2>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-gray-500 w-40">Medicijn</td>
                <td className="py-1.5 font-medium">{medicijnLabel}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-gray-500">Dosis</td>
                <td className="py-1.5 font-medium">{profile?.dose_mg} mg</td>
              </tr>
              {profile?.start_date && (
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-500">Gestart op</td>
                  <td className="py-1.5 font-medium">{format(new Date(profile.start_date), "d MMMM yyyy", { locale: nl })}</td>
                </tr>
              )}
              {weeksSinceStart !== null && (
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-500">Weken actief</td>
                  <td className="py-1.5 font-medium">{weeksSinceStart} weken</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Weight summary */}
        <div>
          <h2 className="font-bold text-green-800 mb-2 text-sm">Gewicht (laatste 8 weken)</h2>
          {weights.length === 0 ? (
            <p className="text-gray-400 text-xs italic">Geen gewicht gelogd in deze periode.</p>
          ) : (
            <>
              <div className="flex gap-6 mb-3">
                {profile?.start_weight_kg && (
                  <div>
                    <div className="text-xs text-gray-500">Startgewicht</div>
                    <div className="font-bold text-green-800">{profile.start_weight_kg} kg</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500">Huidig gewicht</div>
                  <div className="font-bold text-green-800">{currentWeight} kg</div>
                </div>
                {totalLost && Number(totalLost) > 0 && (
                  <div>
                    <div className="text-xs text-gray-500">Verloren</div>
                    <div className="font-bold text-green-700">−{totalLost} kg</div>
                  </div>
                )}
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="text-left py-1.5 px-2 font-medium text-gray-600">Datum</th>
                    <th className="text-right py-1.5 px-2 font-medium text-gray-600">Gewicht (kg)</th>
                    <th className="text-right py-1.5 px-2 font-medium text-gray-600">Verschil</th>
                  </tr>
                </thead>
                <tbody>
                  {weights.map((w, i) => {
                    const prev = weights[i - 1]?.weight_kg;
                    const diff = prev ? (w.weight_kg - prev).toFixed(1) : null;
                    return (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-1.5 px-2">{format(new Date(w.logged_at), "d MMM yyyy", { locale: nl })}</td>
                        <td className="py-1.5 px-2 text-right font-medium">{w.weight_kg}</td>
                        <td className={`py-1.5 px-2 text-right ${diff && Number(diff) < 0 ? "text-green-600" : diff && Number(diff) > 0 ? "text-red-500" : "text-gray-400"}`}>
                          {diff ? (Number(diff) > 0 ? `+${diff}` : diff) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Injections */}
        <div>
          <h2 className="font-bold text-green-800 mb-2 text-sm">Injecties (laatste 8 weken)</h2>
          {injections.length === 0 ? (
            <p className="text-gray-400 text-xs italic">Geen injecties gelogd in deze periode.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-green-50">
                  <th className="text-left py-1.5 px-2 font-medium text-gray-600">Datum</th>
                  <th className="text-right py-1.5 px-2 font-medium text-gray-600">Dosis</th>
                  <th className="text-right py-1.5 px-2 font-medium text-gray-600">Locatie</th>
                </tr>
              </thead>
              <tbody>
                {injections.map((inj, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1.5 px-2">{format(new Date(inj.injected_at), "d MMM yyyy", { locale: nl })}</td>
                    <td className="py-1.5 px-2 text-right">{inj.dose_mg} mg</td>
                    <td className="py-1.5 px-2 text-right capitalize">{inj.site}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Symptoms by cycle day */}
        <div>
          <h2 className="font-bold text-green-800 mb-2 text-sm">Bijwerkingen per cyclusdag (patroon)</h2>
          {symptoms.length === 0 ? (
            <p className="text-gray-400 text-xs italic">Geen bijwerkingen gelogd in deze periode.</p>
          ) : Object.keys(symptomByCycleDay).length === 0 ? (
            <p className="text-gray-400 text-xs italic">{symptoms.length} bijwerking(en) gelogd zonder cyclusdag.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-green-50">
                  <th className="text-left py-1.5 px-2 font-medium text-gray-600">Cyclusdag</th>
                  <th className="text-right py-1.5 px-2 font-medium text-gray-600">Meldingen</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-600">Voorkomende klachten</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(symptomByCycleDay)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([day, data]) => (
                    <tr key={day} className="border-b border-gray-100">
                      <td className="py-1.5 px-2">Dag {day}</td>
                      <td className="py-1.5 px-2 text-right">{data.count}×</td>
                      <td className="py-1.5 px-2 text-gray-600">{data.types.slice(0, 3).join(", ")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-xs text-gray-400">
          Gegenereerd op {reportDate} via GlpCoach — persoonlijke tracking app. Alle gegevens zijn door de gebruiker zelf ingevoerd.
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-page { box-shadow: none !important; }
        }
      `}</style>
    </>
  );
}
