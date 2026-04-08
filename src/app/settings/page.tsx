"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, Crown, AlertTriangle } from "lucide-react";
import type { MedicationType } from "@/lib/types";

const MEDICATIONS: { value: MedicationType; label: string }[] = [
  { value: "ozempic", label: "Ozempic" },
  { value: "wegovy", label: "Wegovy" },
  { value: "mounjaro", label: "Mounjaro" },
  { value: "zepbound", label: "Zepbound" },
];

const DAYS = [
  { value: 0, label: "Zondag" },
  { value: 1, label: "Maandag" },
  { value: 2, label: "Dinsdag" },
  { value: 3, label: "Woensdag" },
  { value: 4, label: "Donderdag" },
  { value: 5, label: "Vrijdag" },
  { value: 6, label: "Zaterdag" },
];

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [medication, setMedication] = useState<MedicationType>("ozempic");
  const [doseMg, setDoseMg] = useState(0.5);
  const [injectionDay, setInjectionDay] = useState(1);
  const [subscriptionTier, setSubscriptionTier] = useState("free");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setEmail(profile.email || user.email || "");
        setMedication(profile.medication_type || "ozempic");
        setDoseMg(profile.dose_mg || 0.5);
        setInjectionDay(profile.injection_day ?? 1);
        setSubscriptionTier(profile.subscription_tier || "free");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase
        .from("user_profiles")
        .update({ medication_type: medication, dose_mg: doseMg, injection_day: injectionDay })
        .eq("id", user.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is iets misgegaan.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) return;
    setSavingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword("");
      setSavedPassword(true);
      setTimeout(() => setSavedPassword(false), 3000);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "VERWIJDER") return;
    setDeleting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete profile (cascade will handle related data)
      await supabase.from("user_profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/");
    } finally {
      setDeleting(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-green-800">Instellingen</h1>
        <p className="text-green-600 text-sm mt-0.5">{email}</p>
      </div>

      {/* Medication settings */}
      <form onSubmit={handleSaveProfile} className="card space-y-5">
        <h2 className="font-semibold text-green-800">Medicatie profiel</h2>

        <div>
          <label className="label">Medicijn</label>
          <div className="grid grid-cols-2 gap-2">
            {MEDICATIONS.map((med) => (
              <button
                key={med.value}
                type="button"
                onClick={() => setMedication(med.value)}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  medication === med.value
                    ? "border-green-600 bg-green-50 text-green-800"
                    : "border-green-100 hover:border-green-300 text-green-600 bg-white"
                }`}
              >
                {med.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Dosis (mg)</label>
          <input
            type="number"
            step="0.25"
            value={doseMg}
            onChange={(e) => setDoseMg(parseFloat(e.target.value))}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">Injectiedag</label>
          <select
            value={injectionDay}
            onChange={(e) => setInjectionDay(parseInt(e.target.value))}
            className="input-field"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Instellingen opgeslagen!
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-secondary w-full disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Opslaan"}
        </button>
      </form>

      {/* Subscription */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Crown className={`w-5 h-5 ${subscriptionTier === "pro" ? "text-yellow-500" : "text-green-400"}`} />
          <div>
            <h2 className="font-semibold text-green-800">
              {subscriptionTier === "pro" ? "Pro abonnement" : "Gratis abonnement"}
            </h2>
            <p className="text-xs text-green-500">
              {subscriptionTier === "pro"
                ? "Je hebt toegang tot alle Pro functies"
                : "Upgrade voor onbeperkte AI coaching"}
            </p>
          </div>
        </div>

        {subscriptionTier === "free" && (
          <a
            href="#"
            className="btn-primary w-full text-center block text-sm"
          >
            <Crown className="w-4 h-4" />
            Upgrade naar Pro — €12,99/maand
          </a>
        )}

        {subscriptionTier === "pro" && (
          <p className="text-sm text-green-600">
            Abonnement beheren via je betalingsprovider.
          </p>
        )}
      </div>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="card space-y-4">
        <h2 className="font-semibold text-green-800">Wachtwoord wijzigen</h2>
        <div>
          <label className="label">Nieuw wachtwoord</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
            placeholder="Minimaal 8 tekens"
            minLength={8}
          />
        </div>

        {savedPassword && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Wachtwoord gewijzigd!
          </div>
        )}

        <button
          type="submit"
          disabled={!newPassword || newPassword.length < 8 || savingPassword}
          className="btn-outline w-full disabled:opacity-50"
        >
          {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Wachtwoord wijzigen"}
        </button>
      </form>

      {/* Danger zone */}
      <div className="card border-2 border-red-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h2 className="font-semibold text-red-700">Account verwijderen</h2>
        </div>
        <p className="text-sm text-red-600 mb-4">
          Dit verwijdert je account en al je gegevens permanent. Dit kan niet worden teruggedraaid.
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          className="input-field mb-3 border-red-200 focus:ring-red-400"
          placeholder='Typ "VERWIJDER" om te bevestigen'
        />
        <button
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== "VERWIJDER" || deleting}
          className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Account definitief verwijderen"
          )}
        </button>
      </div>
    </div>
  );
}
