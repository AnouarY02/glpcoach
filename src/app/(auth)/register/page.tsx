"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    if (password.length < 8) {
      setError("Wachtwoord moet minimaal 8 tekens lang zijn.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setError("Dit e-mailadres is al in gebruik. Probeer in te loggen.");
        } else {
          setError(error.message);
        }
        return;
      }

      // If email confirmation is disabled, redirect directly
      if (data.session) {
        router.push("/onboarding");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Er is iets misgegaan. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card shadow-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-800 mb-2">Check je e-mail!</h2>
        <p className="text-green-600 text-sm leading-relaxed">
          We hebben een bevestigingslink gestuurd naar <strong>{email}</strong>.
          Klik op de link om je account te activeren en te beginnen.
        </p>
        <Link href="/login" className="btn-outline mt-6 w-full text-center block">
          Terug naar inloggen
        </Link>
      </div>
    );
  }

  return (
    <div className="card shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-green-800 mb-1">Account aanmaken</h1>
        <p className="text-green-600 text-sm">7 dagen Pro gratis — geen creditcard nodig</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label htmlFor="email" className="label">
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="jouw@email.nl"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Wachtwoord
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-11"
              placeholder="Minimaal 8 tekens"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 hover:text-green-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Wachtwoord bevestigen
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            placeholder="Herhaal wachtwoord"
            required
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Account aanmaken...
            </>
          ) : (
            "Account aanmaken"
          )}
        </button>

        <p className="text-center text-xs text-green-500">
          Door een account aan te maken ga je akkoord met onze{" "}
          <span className="underline cursor-pointer">gebruiksvoorwaarden</span>.
        </p>
      </form>

      <p className="text-center text-sm text-green-600 mt-6">
        Al een account?{" "}
        <Link href="/login" className="text-orange-500 hover:text-orange-600 font-semibold">
          Inloggen
        </Link>
      </p>
    </div>
  );
}
