import { differenceInDays, addDays } from "date-fns";

// Calculate cycle day from last injection date (1-7, capped at 7)
export function getCycleDay(lastInjectionDate: Date | string | null): number | null {
  if (!lastInjectionDate) return null;
  const last = new Date(lastInjectionDate);
  const days = differenceInDays(new Date(), last) + 1;
  return Math.min(Math.max(days, 1), 7);
}

// Get next injection date
export function getNextInjectionDate(lastInjectionDate: Date | string): Date {
  const last = new Date(lastInjectionDate);
  return addDays(last, 7);
}

// Cycle phase description
export function getCyclePhase(cycleDay: number): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  tip: string;
} {
  if (cycleDay <= 2)
    return {
      label: "Opbouwfase",
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      tip: "Medicatie bouwt op. Bijwerkingen zoals misselijkheid zijn normaal — eet kleine maaltijden.",
    };
  if (cycleDay <= 5)
    return {
      label: "Piekfase",
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      tip: "Medicatie zit op het hoogtepunt. Eetlust is maximaal onderdrukt.",
    };
  return {
    label: "Dalende fase",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    tip: "Richting volgende injectie. Meer honger is normaal — focus op eiwitten en vezels.",
  };
}

// Format weight nicely
export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

// cn utility (like clsx)
export function cn(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(" ");
}
