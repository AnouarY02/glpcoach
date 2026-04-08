export type MedicationType = "ozempic" | "wegovy" | "mounjaro" | "zepbound";
export type SubscriptionTier = "free" | "pro";
export type InjectionSite = "buik" | "dij" | "arm";
export type SymptomType =
  | "misselijkheid"
  | "vermoeidheid"
  | "constipatie"
  | "hoofdpijn"
  | "sulfur_burps"
  | "overig";

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  medication_type: MedicationType;
  dose_mg: number;
  injection_day: number; // 0=zondag t/m 6=zaterdag
  start_date: string;
  start_weight_kg: number;
  subscription_tier: SubscriptionTier;
  onboarding_completed: boolean;
}

export interface Injection {
  id: string;
  user_id: string;
  injected_at: string;
  dose_mg: number;
  site: InjectionSite;
  notes?: string;
}

export interface Symptom {
  id: string;
  user_id: string;
  logged_at: string;
  type: SymptomType;
  severity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  cycle_day: number;
}

export interface Meal {
  id: string;
  user_id: string;
  logged_at: string;
  description: string;
  protein_estimate_g: number;
  photo_url?: string;
  ai_analysis?: Record<string, unknown>;
}

export interface WeightLog {
  id: string;
  user_id: string;
  logged_at: string;
  weight_kg: number;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string;
  water_ml: number;
  notes?: string;
  ai_coaching_response?: string;
}
