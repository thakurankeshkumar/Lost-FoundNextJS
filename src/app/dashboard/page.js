"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    lost: 0,
    found: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const userResponse = await fetch("/api/auth/me");

        if (userResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const userData = await userResponse.json();

        if (!userResponse.ok || !userData.success) {
          throw new Error(userData.message || "Unable to verify your account.");
        }

        if (userData.user?.role === "admin") {
          router.replace("/admin");
          return;
        }

        setUser(userData.user);

        const myResponse = await fetch("/api/reports/mine");
        const myData = await myResponse.json();

        if (myResponse.status === 401) {
          router.replace("/login");
          return;
        }

        if (!myResponse.ok || !myData.success) {
          throw new Error(myData.message || "Unable to load your reports");
        }

        setReports(myData.reports || []);
        setStatistics(myData.statistics || {
          total: 0,
          lost: 0,
          found: 0,
        });
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <SiteNavbar />
        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <p className="text-sm font-medium text-slate-500" aria-live="polite">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteNavbar />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <PageHeading
          eyebrow="Your dashboard"
          title={`Welcome, ${user?.name?.split(" ")[0] || "User"}`}
          description="A quick overview of the reports you have shared."
        />

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <section aria-labelledby="dashboard-stats-title">
          <div className="mb-3">
            <h2 id="dashboard-stats-title" className="text-base font-semibold text-slate-900">
              My reports
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Total", value: statistics.total, tone: "text-slate-900" },
              { label: "Lost", value: statistics.lost, tone: "text-amber-700" },
              { label: "Found", value: statistics.found, tone: "text-emerald-700" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4"
              >
                <span className="text-sm font-medium text-slate-600">
                  {stat.label}
                </span>
                <span className={`text-2xl font-bold tabular-nums ${stat.tone}`}>
                  {Number(stat.value || 0).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="recent-reports-title">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 id="recent-reports-title" className="text-base font-semibold text-slate-900">
                Recent reports
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest submissions and their current status.
              </p>
            </div>
            <Link
              href="/my-reports"
              className="shrink-0 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {reports.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <h3 className="font-semibold text-slate-900">No reports yet</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create a report to get started.
                </p>
                <Link
                  href="/reports/new"
                  className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Create your first report
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-semibold text-slate-900">
                          {report.title || "Untitled report"}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            report.type === "lost"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {report.type || "Report"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {[report.category, report.city, report.state]
                          .filter(Boolean)
                          .join(" · ") || "Details unavailable"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                        {report.status?.replace("_", " ") || "Unknown"}
                      </span>
                      <Link
                        href={`/reports/${report._id}`}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                      >
                        Details
                      </Link>
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