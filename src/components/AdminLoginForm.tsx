"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);

  const oauthRedirectTarget = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/admin/oauth/callback`;
    }

    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    if (configured) {
      return `${configured.replace(/\/$/, "")}/admin/oauth/callback`;
    }

    return "";
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Invalid credentials.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!oauthRedirectTarget) {
      setError("Missing OAuth redirect configuration. Please set NEXT_PUBLIC_SITE_URL.");
      return;
    }

    setError(null);
    setIsOAuthRedirecting(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthRedirectTarget,
          scopes: "openid profile email",
        },
      });

      if (error) {
        throw error;
      }

      // Supabase will redirect away; keep button disabled until navigation occurs.
    } catch (oauthError) {
      console.error("Google sign-in failed", oauthError);
      setError(
        oauthError instanceof Error
          ? oauthError.message
          : "Google sign-in failed. Please try again."
      );
      setIsOAuthRedirecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isOAuthRedirecting}
        className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.8v3.84h5.46c-.24 1.26-1.47 3.72-5.46 3.72-3.3 0-6-2.73-6-6.06s2.7-6.06 6-6.06c1.89 0 3.15.81 3.87 1.5l2.64-2.55C16.77 3.9 14.64 3 12 3 6.96 3 2.82 7.2 2.82 12s4.14 9 9.18 9c5.292 0 8.82-3.72 8.82-8.97 0-.6-.06-1.05-.15-1.53H12z"
          />
        </svg>
        {isOAuthRedirecting ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm font-medium text-gray-500">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Admin Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="admin@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isOAuthRedirecting}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
