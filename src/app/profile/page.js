"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile");
        }

        setUser(data.user);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Loading your profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              ⌖
            </span>
            <span className="text-lg font-bold text-slate-900">
              FindBack
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
        <div>
          <p className="text-sm font-medium text-blue-600">
            ACCOUNT SETTINGS
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            View your account information.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {user && (
          <>
            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold uppercase text-blue-700">
                    {user.name?.charAt(0) || "U"}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {user.name}
                    </h2>
                    <p className="mt-1 text-sm capitalize text-slate-500">
                      {user.role || "User"} account
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Full name
                  </p>
                  <p className="mt-2 font-medium text-slate-800">
                    {user.name}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email address
                  </p>
                  <p className="mt-2 break-all font-medium text-slate-800">
                    {user.email}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account role
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold capitalize text-blue-700">
                    {user.role || "user"}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account ID
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-slate-600">
                    {user.id}
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="font-semibold text-blue-900">
                Profile information
              </h3>
              <p className="mt-2 text-sm leading-6 text-blue-800">
                Your account information is currently displayed in read-only
                mode. Profile editing can be added later with a secure
                profile-update API.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}