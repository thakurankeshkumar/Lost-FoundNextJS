
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Admin Dashboard
          </Link>

          <div className="mt-5">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Report Management
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Review, manage, and moderate user-submitted reports.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <form onSubmit={handleSearch}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search reports
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title, city, or state..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Report status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="removed">Removed</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Report type
              </label>

              <select
                value={type}
                onChange={(event) =>
                  handleTypeChange(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All types</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>
          </div>
        </section>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Report List */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Reports
            </h2>

            <span className="text-sm text-gray-500">
              {pagination.total} total reports
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                No reports found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.map((report) => {
                const isLocked = Boolean(report.acceptedClaimId);
                const isBusy = actionLoading === report._id;

                return (
                  <article
                    key={report._id}
                    className="p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {report.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(
                              report.status
                            )}`}
                          >
                            {formatStatus(report.status)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                          {report.type} · {report.category}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {report.city}, {report.state}
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                          Submitted by:{" "}
                          <span className="font-medium text-gray-800">
                            {report.userId?.name || "Unknown"}
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Report ID: {report._id}
                        </p>

                        {isLocked && (
                          <p className="mt-2 text-xs font-medium text-amber-700">
                            This report has an accepted claim and is locked
                            from moderation.
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-start gap-2">
                        {report.status === "active" && (
                          <>
                            <button
                              onClick={() =>
                                handleModeration(report._id, "review")
                              }
                              disabled={isBusy || isLocked}
                              className="rounded-lg border border-yellow-300 px-3 py-2 text-xs font-medium text-yellow-700 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Review
                            </button>

                            <button
                              onClick={() =>
                                handleModeration(report._id, "remove")
                              }
                              disabled={isBusy || isLocked}
                              className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </>
                        )}

                        {report.status === "under_review" && (
                          <>
                            <button
                              onClick={() =>
                                handleModeration(report._id, "restore")
                              }
                              disabled={isBusy || isLocked}
                              className="rounded-lg border border-green-300 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Restore
                            </button>

                            <button
                              onClick={() =>
                                handleModeration(report._id, "remove")
                              }
                              disabled={isBusy || isLocked}
                              className="rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </>
                        )}

                        {report.status === "removed" && (
                          <button
                            onClick={() =>
                              handleModeration(report._id, "restore")
                            }
                            disabled={isBusy || isLocked}
                            className="rounded-lg border border-green-300 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Restore
                          </button>
                        )}

                        {report.status === "active" && (
                          <Link
                            href={`/reports/${report._id}`}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View
                          </Link>
                        )}

                        {isBusy && (
                          <span className="self-center text-xs text-gray-500">
                            Updating...
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
