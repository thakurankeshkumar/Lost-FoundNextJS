
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminClaimsPage() {
  const router = useRouter();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        status,
        search,
      });

      const response = await fetch(
        `/api/admin/claims?${params.toString()}`
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
        throw new Error(result.message || "Unable to load claims");
      }

      setClaims(result.claims || []);

      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, status, search, router]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  function handleSearch(event) {
    event.preventDefault();

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));

    setSearch(searchInput.trim());
  }

  function handleStatusChange(value) {
    setStatus(value);

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
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

  function getStatusStyle(claimStatus) {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      accepted: "bg-blue-100 text-blue-700",
      rejected: "bg-red-100 text-red-700",
      completed: "bg-green-100 text-green-700",
    };

    return styles[claimStatus] || "bg-gray-100 text-gray-700";
  }

  function formatDate(value) {
    if (!value) return "Not available";

    return new Date(value).toLocaleString();
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

          <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
            Claim Management
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Monitor ownership claims and their handover progress.
          </p>
        </div>

        {/* Search and Filter */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <form onSubmit={handleSearch}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search claims
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search report, user name, email, or city..."
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

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Claim status
            </label>

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm sm:max-w-xs"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Claims List */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Submitted Claims
            </h2>

            <span className="text-sm text-gray-500">
              {pagination.total} total claims
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading claims...
            </div>
          ) : claims.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-gray-700">
                No claims found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {claims.map((claim) => (
                <article key={claim._id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {claim.reportId?.title || "Report unavailable"}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusStyle(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Report details
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {claim.reportId?.type || "Unknown"} ·{" "}
                        {claim.reportId?.category || "Unknown"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {claim.reportId?.city || "Unknown"},{" "}
                        {claim.reportId?.state || ""}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Report status:{" "}
                        {claim.reportId?.status || "Unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Claimant
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {claim.claimantId?.name || "Unknown"}
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-500">
                        {claim.claimantId?.email || "Unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Finder / Report owner
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {claim.finderId?.name || "Unknown"}
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-500">
                        {claim.finderId?.email || "Unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Claim timeline
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Submitted: {formatDate(claim.createdAt)}
                      </p>

                      {claim.verifiedAt && (
                        <p className="mt-1 text-sm text-gray-600">
                          Handover verified: {formatDate(claim.verifiedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
                    Claim ID: {claim._id}
                  </p>
                </article>
              ))}
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
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
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
