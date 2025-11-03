"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { autoSubscribeUser } from "@/lib/auto-subscribe";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackClient />
    </Suspense>
  );
}

function CallbackFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Signing you in</h1>
        <p className="text-sm text-gray-600">Authorising with Google…</p>
      </div>
    </div>
  );
}

function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [message, setMessage] = useState<string>("Authorising with Google…");

  const code = useMemo(() => searchParams.get("code"), [searchParams]);
  const errorDescription = useMemo(() => searchParams.get("error_description"), [searchParams]);

  useEffect(() => {
    const finishOAuth = async () => {
      if (errorDescription) {
        setStatus("error");
        setMessage(errorDescription);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("Missing authorisation code. Please try signing in again.");
        return;
      }

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Supabase session exchange failed", error);
          setStatus("error");
          setMessage(error.message || "Could not complete Google sign-in.");
          return;
        }

        if (!data.session) {
          setStatus("error");
          setMessage("No active session was returned. Please try again.");
          return;
        }

        // Auto-subscribe user to email notifications
        if (data.session.user?.email) {
          console.log('[AuthCallback] Auto-subscribing user:', data.session.user.email)
          const subscribeResult = await autoSubscribeUser(data.session.user.email)
          
          if (subscribeResult.success) {
            if (!subscribeResult.alreadySubscribed) {
              console.log('[AuthCallback] User successfully auto-subscribed to notifications')
            }
          } else {
            console.warn('[AuthCallback] Auto-subscribe failed:', subscribeResult.error)
          }
        }

        router.replace("/dashboard");
        router.refresh();
      } catch (callbackError) {
        console.error("OAuth callback error", callbackError);
        setStatus("error");
        setMessage(
          callbackError instanceof Error
            ? callbackError.message
            : "Unexpected error during Google sign-in."
        );
        await supabase.auth.signOut().catch(() => undefined);
      }
    };

    void finishOAuth();
  }, [code, errorDescription, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          {status === "processing" ? (
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          ) : (
            <svg className="h-12 w-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12V16.5zm9-4.5a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {status === "processing" ? "Signing you in" : "Unable to sign in"}
        </h1>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        {status === "error" && (
          <button
            type="button"
            onClick={() => router.replace("/auth/login")}
            className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}
