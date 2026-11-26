"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionRedirect() {
  const router = useRouter();
  const [status, setStatus] = useState("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      setStatus("checking");

      try {
        const response = await fetch("/api/auth/me");

        if (response.status === 401) {
          if (!cancelled) setStatus("guest");
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to verify your account.");
        }

        if (cancelled) return;
        router.replace(data.user?.role === "admin" ? "/admin" : "/dashboard");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [attempt, router]);

  if (status === "guest") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 px-5">
      {status === "checking" ? (
        <p className="text-sm font-medium text-slate-600" aria-live="polite">
          Checking your account...
        </p>
      ) : (
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            We couldn&apos;t verify your account
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Please try again before continuing.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((current) => current + 1)}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
