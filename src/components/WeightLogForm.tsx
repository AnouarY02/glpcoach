"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, CheckCircle } from "lucide-react";

interface WeightLogFormProps {
  onSaved?: (weight: number) => void;
  compact?: boolean;
}

export function WeightLogForm({ onSaved, compact = false }: WeightLogFormProps) {
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(weight);
    if (!kg || kg <= 0 || kg > 500) return;

    setError(null);
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error: dbError } = await supabase.from("weight_logs").insert({
        user_id: user.id,
        weight_kg: kg,
      });

      if (dbError) throw dbError;

      setWeight("");
      setSaved(true);
      onSaved?.(kg);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er is iets misgegaan.");
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="input-field flex-1"
          placeholder="bijv. 95.4"
          min={30}
          max={500}
        />
        <button
          type="submit"
          disabled={!weight || saving}
          className="btn-secondary px-4 py-3 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label">Gewicht (kg)</label>
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="input-field"
          placeholder="bijv. 95.4"
          min={30}
          max={500}
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Gewicht opgeslagen!
        </div>
      )}

      <button
        type="submit"
        disabled={!weight || saving}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Opslaan...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Gewicht opslaan
          </>
        )}
      </button>
    </form>
  );
}
