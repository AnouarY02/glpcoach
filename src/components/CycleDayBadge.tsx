"use client";
import { getCyclePhase } from "@/lib/utils";

export function CycleDayBadge({ day }: { day: number }) {
  const phase = getCyclePhase(day);
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${phase.bgColor} ${phase.borderColor} ${phase.color}`}
    >
      <span>Dag {day} van 7</span>
      <span>·</span>
      <span>{phase.label}</span>
    </div>
  );
}
