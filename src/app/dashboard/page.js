"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    lost: 0,
    found: 0,
  });
  const [community, setCommunity] = useState({
    lost: 0,
    found: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const userResponse = await fetch("/api/auth/me");
        const userData = await userResponse.json();

        if (!userResponse.ok) {
          router.replace("/login");
          return;
        }

        setUser(userData.user);

        const [myResponse, lostResponse, foundResponse] =
          await Promise.all([
            fetch("/api/reports/mine"),
            fetch("/api/reports?type=lost&limit=1"),
            fetch("/api/reports?type=found&limit=1"),
          ]);

        const myData = await myResponse.json();
        const lostData = await lostResponse.json();
        const foundData = await foundResponse.json();

        if (!myResponse.ok) {
          throw new Error(myData.message || "Unable to load your reports");
        }

        if (!lostResponse.ok || !foundResponse.ok) {
          throw new Error("Unable to load community statistics");
        }

        setReports(myData.reports || []);
        setStatistics(myData.statistics || {
          total: 0,
          lost: 0,
          found: 0,
        });

        setCommunity({
          lost: lostData.pagination?.total || 0,
          found: foundData.pagination?.total || 0,
        });
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError("Unable to log out. Please try again.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">
          Loading your dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              ⌖
            </span>
            <span className="text-lg font-bold text-slate-900">
              FindBack
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/my-reports"
              className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:block"
            >
              My Reports
            </Link>

            <Link
              href="/profile"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Profile
            </Link>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {user?.role || "User"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              YOUR DASHBOARD
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {user?.name?.split(" ")[0] || "User"}!
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage your reports and help belongings find their owners.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Back to home
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-9">
          <h2 className="text-lg font-bold text-slate-900">
            Your activity
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Total reports</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {statistics.total}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Reports submitted by you
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Lost reports</p>
              <p className="mt-3 text-3xl font-bold text-amber-600">
                {statistics.lost}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Items you are looking for
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Found reports</p>
              <p className="mt-3 text-3xl font-bold text-green-600">
                {statistics.found}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Items you have found
              </p>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <h2 className="text-lg font-bold text-slate-900">
            Community activity
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">
                Community lost reports
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-900">
                {community.lost}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-medium text-green-700">
                Community found reports
              </p>
              <p className="mt-2 text-2xl font-bold text-green-900">
                {community.found}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-9">
          <h2 className="text-lg font-bold text-slate-900">
            Quick actions
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/reports"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md"
            >
              <span className="text-2xl">🔎</span>
              <h3 className="mt-4 font-bold text-slate-900">
                Browse reports
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Explore lost and found items reported by others.
              </p>
              <p className="mt-4 text-sm font-semibold text-blue-600">
                Explore reports →
              </p>
            </Link>

            <Link
              href="/report/new"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md"
            >
              <span className="text-2xl">＋</span>
              <h3 className="mt-4 font-bold text-slate-900">
                Create a report
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Tell the community about something lost or found.
              </p>
              <p className="mt-4 text-sm font-semibold text-blue-600">
                Create report →
              </p>
            </Link>

            <Link
              href="/my-reports"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md"
            >
              <span className="text-2xl">📋</span>
              <h3 className="mt-4 font-bold text-slate-900">
                My reports
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                View, edit and manage all your submitted reports.
              </p>
              <p className="mt-4 text-sm font-semibold text-blue-600">
                Manage reports →
              </p>
            </Link>

            <Link
              href="/profile"
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md"
            >
              <span className="text-2xl">👤</span>
              <h3 className="mt-4 font-bold text-slate-900">
                My profile
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                View your account information and role.
              </p>
              <p className="mt-4 text-sm font-semibold text-blue-600">
                View profile →
              </p>
            </Link>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Your recent reports
            </h2>

            <Link
              href="/my-reports"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {reports.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-3xl">📋</p>
                <p className="mt-3 font-semibold text-slate-800">
                  No reports yet
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Your submitted reports will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {report.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {report.category} · {report.city}, {report.state}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${report.type === "lost"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-green-50 text-green-700"
                          }`}
                      >
                        {report.type}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                        {report.status}
                      </span>

                      {report.status === "active" && (
                        <Link
                          href={`/reports/${report._id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}