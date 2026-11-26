
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

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

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("all");
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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteNavbar />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <PageHeading
          eyebrow="Admin workspace"
          title="Claim management"
          description="Follow ownership requests from submission through handover."
        />

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Find a claim</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search for an item or participant, or filter by where the claim is in its process.
            </p>
          </div>
          <form onSubmit={handleSearch}>
            <label
              htmlFor="admin-claim-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="admin-claim-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Item, claimant, email, or city"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Search claims
              </button>
            </div>
          </form>
          <div className="mt-4 max-w-sm">
            <label
              htmlFor="admin-claim-status"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Claim status
            </label>
            <select
              id="admin-claim-status"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
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

        <section aria-labelledby="admin-claims-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="admin-claims-heading" className="text-lg font-bold text-slate-900">
                Claim requests
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Each card shows the item, both participants, and the latest handover details.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              {pagination.total.toLocaleString("en-IN")} total
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <h3 className="font-semibold text-slate-900">No claims found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another search or clear the selected status.
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
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {claims.map((claim) => {
                const report = claim.reportId;

                return (
                  <article
                    key={claim._id}
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Ownership request
                        </p>
                        <h3 className="mt-1 break-words text-lg font-bold text-slate-900">
                          {report?.title || "Report unavailable"}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                          claim.status
                        )}`}
                      >
                        {claim.status || "Unknown"}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
                          {report?.type || "Item"}
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {report?.category || "Category unavailable"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {[report?.city, report?.state].filter(Boolean).join(", ") || "Location unavailable"}
                      </p>
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        Report status: {report?.status?.replace("_", " ") || "Unavailable"}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Claimant
                        </p>
                        <p className="mt-2 break-words font-semibold text-slate-900">
                          {claim.claimantId?.name || "Unknown claimant"}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {claim.claimantId?.email || "Email unavailable"}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Finder / owner
                        </p>
                        <p className="mt-2 break-words font-semibold text-slate-900">
                          {claim.finderId?.name || "Unknown owner"}
                        </p>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {claim.finderId?.email || "Email unavailable"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                      <p>
                        <span className="text-slate-500">Submitted </span>
                        <span className="font-medium text-slate-700">{formatDate(claim.createdAt)}</span>
                      </p>
                      {claim.verifiedAt && (
                        <p>
                          <span className="text-slate-500">Handover verified </span>
                          <span className="font-medium text-slate-700">{formatDate(claim.verifiedAt)}</span>
                        </p>
                      )}
                    </div>

                    {report?._id && (
                      <div className="mt-auto pt-4">
                        <Link
                          href={`/reports/${report._id}`}
                          className="inline-flex rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          View item report
                        </Link>
                      </div>
                    )}
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
