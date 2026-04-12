"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import type { MedicationType } from "@/lib/types";

const MEDICATIONS: { value: MedicationType; label: string; description: string }[] = [
  { value: "ozempic", label: "Ozempic", description: "Semaglutide 0.25–1mg" },
  { value: "wegovy", label: "Wegovy", description: "Semaglutide 0.25–2.4mg" },
  { value: "mounjaro", label: "Mounjaro", description: "Tirzepatide 2.5–15mg" },
  { value: "zepbound", label: "Zepbound", description: "Tirzepatide 2.5–15mg" },
];

const DOSES = [0.25, 0.5, 1.0, 2.0, 2.5];

const DAYS = [
  { value: 0, label: "Zondag" },
  { value: 1, label: "Maandag" },
  { value: 2, label: "Dinsdag" },
  { value: 3, label: "Woensdag" },
  { value: 4, label: "Donderdag" },
  { value: 5, label: "Vrijdag" },
  { value: 6, label: "Zaterdag" },
];

const GOALS = [
  { value: "afvallen", label: "Afvallen", emoji: "⚖️", desc: "Gewicht verliezen en bijhouden" },
  { value: "bijwerkingen", label: "Bijwerkingen", emoji: "💊", desc: "Misselijkheid en klachten managen" },
  { value: "arts", label: "Arts rapport", emoji: "👨‍⚕️", desc: "Alles bijhouden voor mijn arts" },
  { value: "alles", label: "Alles", emoji: "📊", desc: "Complete GLP-1 begeleiding" },
];

// Steps: 1 = medicatie, 2 = doel, 3 = disclaimer, 4 = gewicht, 5 = injectiedag
const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [medication, setMedication] = useState<MedicationType | null>(null);
  const [dose, setDose] = useState<number | null>(null);

  // Step 2
  const [goal, setGoal] = useState<string | null>(null);

  // Step 4
  const [startWeight, setStartWeight] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Step 5
  const [injectionDay, setInjectionDay] = useState<number | null>(null);
  const [firstInjectionDate, setFirstInjectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const canNext = () => {
    if (step === 1) return medication && dose;
    if (step === 2) return goal !== null;
    if (step === 3) return true; // disclaimer always passable
    if (step === 4) return startWeight && parseFloat(startWeight) > 0;
    if (step === 5) return injectionDay !== null;
    return false;
  };

  const handleFinish = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase.from("user_profiles").upsert({
        id: user.id,
        email: user.email!,
        medication_type: medication,
        dose_mg: dose,
        start_weight_kg: parseFloat(startWeight),
        start_date: startDate,
        injection_day: injectionDay,
        goal: goal,
        onboarding_completed: true,
      });

      if (error) throw error;

      // Log first injection if date provided
      if (firstInjectionDate) {
        await supabase.from("injections").insert({
          user_id: user.id,
          injected_at: new Date(firstInjectionDate).toISOString(),
          dose_mg: dose,
          site: "buik",
          notes: "Eerste injectie",
        });
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is iets misgegaan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  s < step
                    ? "bg-green-600 text-white"
                    : s === step
                    ? "bg-orange-500 text-white"
                    : "bg-green-100 text-green-500"
                }`}
              >
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 5 && (
                <div
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s < step ? "bg-green-600" : "bg-green-100"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="card shadow-md">
          {/* Step 1 — Medicatie */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-1">
                Jouw medicatie
              </h2>
              <p className="text-green-600 text-sm mb-6">
                Welk GLP-1 medicijn gebruik je?
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {MEDICATIONS.map((med) => (
                  <button
                    key={med.value}
                    onClick={() => setMedication(med.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      medication === med.value
                        ? "border-green-600 bg-green-50"
                        : "border-green-100 hover:border-green-300 bg-white"
                    }`}
                  >
                    <div className="font-semibold text-green-800">{med.label}</div>
                    <div className="text-xs text-green-500 mt-0.5">{med.description}</div>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="label">Huidige dosis (mg)</label>
                <div className="flex flex-wrap gap-2">
                  {DOSES.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDose(d)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
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
            </div>
          )}

          {/* Step 2 — Doel */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-1">
                Wat is jouw doel?
              </h2>
              <p className="text-green-600 text-sm mb-6">
                De coach past zijn aanpak aan op wat voor jou belangrijk is.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      goal === g.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-green-100 hover:border-green-300 bg-white"
                    }`}
                  >
                    <div className="text-2xl mb-1">{g.emoji}</div>
                    <div className="font-semibold text-green-800 text-sm">{g.label}</div>
                    <div className="text-xs text-green-500 mt-0.5">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Disclaimer */}
          {step === 3 && (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-4">
                <h2 className="text-xl font-bold text-green-800 mb-3">
                  Even belangrijk 📋
                </h2>
                <p className="text-green-700 font-semibold mb-3">
                  GlpCoach helpt je bijhouden en begrijpen — niet bijsturen.
                </p>
                <p className="text-green-600 text-sm leading-relaxed">
                  De AI Coach geeft informatie over GLP-1, geen medisch advies. Blijf altijd in contact met je arts over dosering en behandeling.
                </p>
              </div>
            </div>
          )}

          {/* Step 4 — Startgewicht */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-1">
                Je startpunt
              </h2>
              <p className="text-green-600 text-sm mb-6">
                Dit gebruiken we om je voortgang bij te houden.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="label">Startgewicht (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={startWeight}
                    onChange={(e) => setStartWeight(e.target.value)}
                    className="input-field"
                    placeholder="bijv. 98.5"
                  />
                </div>

                <div>
                  <label className="label">Wanneer ben je begonnen?</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5 — Injectiedag */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-1">
                Je injectiedag
              </h2>
              <p className="text-green-600 text-sm mb-6">
                Op welke dag zet je je injectie? Dan sturen we je altijd de juiste reminders.
              </p>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => setInjectionDay(day.value)}
                    className={`p-3 rounded-xl border-2 text-center text-sm transition-all ${
                      injectionDay === day.value
                        ? "border-green-600 bg-green-50 text-green-800 font-semibold"
                        : "border-green-100 hover:border-green-300 text-green-600 bg-white"
                    }`}
                  >
                    {day.label.slice(0, 2)}
                  </button>
                ))}
              </div>

              <div>
                <label className="label">Datum laatste/eerste injectie</label>
                <input
                  type="date"
                  value={firstInjectionDate}
                  onChange={(e) => setFirstInjectionDate(e.target.value)}
                  className="input-field"
                />
                <p className="text-xs text-green-500 mt-1.5">
                  We gebruiken dit om je cyclusdag te berekenen.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mt-4">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-outline flex-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Terug
              </button>
            )}

            {step === 3 ? (
              // Disclaimer step: special CTA button
              <button
                onClick={() => setStep(4)}
                className="btn-primary flex-1"
              >
                Ik begrijp het — verder
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volgende
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canNext() || loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    Start met GlpCoach
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-green-500 mt-4">
          Stap {step} van {TOTAL_STEPS} — Je kunt dit later altijd aanpassen in je instellingen.
        </p>
      </div>
    </div>
  );
}
