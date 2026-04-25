"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

type Mode = "signin" | "signup";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const router = useRouter();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setInfo("Check your email to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }

    setLoading(false);
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "https://www.googleapis.com/auth/calendar.events.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="px-6 py-5 max-w-6xl mx-auto w-full">
        <Link href="/" className="font-semibold text-lg">
          Described
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-serif text-3xl tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-white/50">
              {mode === "signin"
                ? "Sign in to access your meetings."
                : "Start recording meetings in under a minute."}
            </p>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-black hover:bg-white/90 rounded-full h-11"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-white/40 uppercase tracking-wider">
            <div className="flex-1 border-t border-white/10" />
            <span>or</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="text-xs text-white/60 mb-1.5 block"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-xs text-white/60 mb-1.5 block"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11"
              />
              {mode === "signup" && (
                <p className="text-[11px] text-white/40 mt-1.5">
                  At least 6 characters.
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 px-1">{error}</p>
            )}
            {info && (
              <p className="text-sm text-green-400 px-1">{info}</p>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-full h-11 bg-[#0D7FFF] hover:bg-[#0D7FFF]/90 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="text-sm text-white/60 text-center">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setInfo("");
                  }}
                  className="text-white hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setInfo("");
                  }}
                  className="text-white hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
