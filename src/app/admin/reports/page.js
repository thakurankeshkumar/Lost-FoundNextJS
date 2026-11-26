
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

export default function AdminReportsPage() {
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        status,
        type,
        search,
      });

      const response = await fetch(
        `/api/admin/reports?${params.toString()}`
      );

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/dashboard");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load reports");
      }

      setReports(result.reports || []);

      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, status, type, search, router]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Apply search
  function handleSearch(event) {
    event.preventDefault();
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
    setSearch(searchInput.trim());
  }

  // Change filters
  function handleStatusChange(value) {
    setStatus(value);
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  }

  function handleTypeChange(value) {
    setType(value);
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setType("all");
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  }

  // Admin moderation action
  async function handleModeration(reportId, action) {
    const actionLabels = {
      review: "put this report under review",
      remove: "remove this report",
      restore: "restore this report",
    };

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabels[action]}?`
    );

    if (!confirmed) return;

    setActionLoading(reportId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/reports/${reportId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/dashboard");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Action failed");
      }

      setSuccess("Report updated successfully.");
      await loadReports();
    } catch (err) {
      setError(err.message || "Unable to update report");
    } finally {
      setActionLoading("");
    }
  }

  function changePage(newPage) {
    if (
      newPage < 1 ||
      newPage > pagination.totalPages ||
      newPage === pagination.page
    ) {
      return;
    }

    setPagination((previous) => ({
      ...previous,
      page: newPage,
    }));
  }

  function getStatusStyle(reportStatus) {
    const styles = {
      active: "bg-green-100 text-green-700",
      under_review: "bg-yellow-100 text-yellow-700",
      resolved: "bg-blue-100 text-blue-700",
      removed: "bg-red-100 text-red-700",
    };

    return styles[reportStatus] || "bg-gray-100 text-gray-700";
  }

  function formatStatus(value) {
    return value?.replace("_", " ") || "Unknown";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteNavbar />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <PageHeading
          eyebrow="Admin workspace"
          title="Report management"
          description="Review item reports, check their details, and take moderation action."
        />

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Find a report</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by item or location, then narrow the results by status or type.
            </p>
          </div>

          <form onSubmit={handleSearch}>
            <label
              htmlFor="admin-report-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="admin-report-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Item title, city, or state"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Search reports
              </button>
            </div>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="admin-report-status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="admin-report-status"
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="under_review">Under review</option>
                <option value="resolved">Resolved</option>
                <option value="removed">Removed</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="admin-report-type"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Report type
              </label>
              <select
                id="admin-report-type"
                value={type}
                onChange={(event) => handleTypeChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">Lost and found</option>
                <option value="lost">Lost items</option>
                <option value="found">Found items</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Clear search and filters
          </button>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700" role="status">
            {success}
          </div>
        )}

        <section aria-labelledby="admin-reports-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="admin-reports-heading"
                className="text-lg font-bold text-slate-900"
              >
                Report results
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review each item and choose an action from its card.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              {pagination.total.toLocaleString("en-IN")} total
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <h3 className="font-semibold text-slate-900">No reports found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another search or clear the selected filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => {
                const isLocked = Boolean(report.acceptedClaimId);
                const isBusy = actionLoading === report._id;
                const typeClass =
                  report.type === "lost"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-emerald-50 text-emerald-800";

                return (
                  <article
                    key={report._id}
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${typeClass}`}>
                        {report.type || "Report"} item
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                          report.status
                        )}`}
                      >
                        {formatStatus(report.status)}
                      </span>
                    </div>

                    <h3 className="mt-4 break-words text-lg font-bold text-slate-900">
                      {report.title || "Untitled report"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {report.category || "Uncategorized"}
                    </p>

                    <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Location
                        </dt>
                        <dd className="mt-1 font-medium text-slate-700">
                          {[report.city, report.state].filter(Boolean).join(", ") || "Not provided"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Reported by
                        </dt>
                        <dd className="mt-1 font-medium text-slate-700">
                          {report.userId?.name || "Unknown member"}
                        </dd>
                      </div>
                    </dl>

                    {isLocked && (
                      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                        An accepted claim is attached. Moderation actions are disabled.
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      <Link
                        href={`/reports/${report._id}`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View details
                      </Link>

                      {report.status === "active" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleModeration(report._id, "review")}
                            disabled={isBusy || isLocked}
                            className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Mark for review
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModeration(report._id, "remove")}
                            disabled={isBusy || isLocked}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </>
                      )}

                      {(report.status === "under_review" || report.status === "removed") && (
                        <button
                          type="button"
                          onClick={() => handleModeration(report._id, "restore")}
                          disabled={isBusy || isLocked}
                          className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Restore report
                        </button>
                      )}
                      {report.status === "under_review" && (
                        <button
                          type="button"
                          onClick={() => handleModeration(report._id, "remove")}
                          disabled={isBusy || isLocked}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                      {isBusy && (
                        <span className="self-center text-xs text-slate-500" aria-live="polite">
                          Updating report...
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
              <p className="text-sm text-slate-600">
                Page <span className="font-semibold text-slate-900">{pagination.page}</span> of{" "}
                <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
