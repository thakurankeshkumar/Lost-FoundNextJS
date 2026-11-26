"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

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
      <main className="min-h-screen bg-slate-50">
        <SiteNavbar />
        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <p className="text-sm font-medium text-slate-500" aria-live="polite">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteNavbar />

      <div className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
        <PageHeading
          eyebrow="Account"
          title="Your profile"
          description="Your FindBack account details and account type."
        />

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {user && (
          <>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
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

              <dl className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Full name
                  </dt>
                  <dd className="mt-2 font-medium text-slate-800">
                    {user.name}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email address
                  </dt>
                  <dd className="mt-2 break-all font-medium text-slate-800">
                    {user.email}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account role
                  </dt>
                  <dd className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold capitalize text-blue-700">
                    {user.role || "user"}
                  </dd>
                </div>

                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Account ID
                  </dt>
                  <dd className="mt-2 break-all font-mono text-sm text-slate-600">
                    {user.id || "Not available"}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                Go to your workspace
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Continue managing your FindBack activity.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {user.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Open admin workspace
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/my-reports"
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Manage my reports
                    </Link>
                    <Link
                      href="/reports"
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Browse reports
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}