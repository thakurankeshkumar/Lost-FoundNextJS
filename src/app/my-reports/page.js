"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

export default function MyReportsPage() {
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reports/mine?all=true");
      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load your reports");
      }

      setReports(data.reports || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleDelete(reportId) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this report?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(reportId);
      setError("");
      setMessage("");

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove report");
      }

      setReports((previousReports) =>
        previousReports.map((report) =>
          report._id === reportId
            ? { ...report, status: "removed" }
            : report
        )
      );

      setMessage("Report removed successfully.");
    } catch (err) {
      setError(err.message || "Unable to remove report.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredReports = reports.filter((report) => {
    if (filter === "all") return true;
    return report.type === filter;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <SiteNavbar />
        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <p className="text-sm font-medium text-slate-500" aria-live="polite">
            Loading your reports...
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
          eyebrow="Your activity"
          title="My reports"
          description="View and manage all the lost and found reports you have submitted."
        />

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">
              Submitted reports ({reports.length})
            </h2>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "All reports", value: "all" },
                { label: "Lost", value: "lost" },
                { label: "Found", value: "found" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    filter === option.value
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {filteredReports.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-4xl">📋</p>
                <h3 className="mt-4 font-semibold text-slate-800">
                  {reports.length === 0
                    ? "You haven't submitted any reports"
                    : "No reports in this category"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Your submitted reports will appear here.
                </p>

                {reports.length === 0 && (
                  <Link
                    href="/reports/new"
                    className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create your first report
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <div
                    key={report._id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {report.title}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            report.type === "lost"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {report.type}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        {report.category} · {report.city}, {report.state}
                      </p>

                      <p className="mt-1 text-xs capitalize text-slate-400">
                        Status: {report.status}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/reports/${report._id}`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        View
                      </Link>

                      {report.status === "active" && (
                        <>
                          <Link
                            href={`/reports/${report._id}/edit`}
                            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => handleDelete(report._id)}
                            disabled={deletingId === report._id}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === report._id
                              ? "Removing..."
                              : "Remove"}
                          </button>
                        </>
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