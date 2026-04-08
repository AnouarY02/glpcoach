"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { WeightLogForm } from "@/components/WeightLogForm";
import { formatWeight } from "@/lib/utils";

interface WeightLogWidgetProps {
  lastWeight?: number | null;
  onSaved?: (weight: number) => void;
}

export function WeightLogWidget({ lastWeight, onSaved }: WeightLogWidgetProps) {
  const [currentWeight, setCurrentWeight] = useState<number | null>(
    lastWeight ?? null
  );

  const handleSaved = (kg: number) => {
    setCurrentWeight(kg);
    onSaved?.(kg);
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
          <Scale className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <div className="font-semibold text-green-800 text-sm">Gewicht loggen</div>
          {currentWeight && (
            <div className="text-xs text-green-500">
              Laatste: {formatWeight(currentWeight)}
            </div>
          )}
        </div>
      </div>
      <WeightLogForm compact onSaved={handleSaved} />
    </div>
  );
}
