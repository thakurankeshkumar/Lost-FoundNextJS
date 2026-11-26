
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

const categories = [
  "Electronics",
  "Documents",
  "Accessories",
  "Bags",
  "Clothing",
  "Jewelry",
  "Pets",
  "Other",
];

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: "9",
      });

      if (appliedSearch) params.set("search", appliedSearch);
      if (type) params.set("type", type);
      if (category) params.set("category", category);
      if (appliedCity) params.set("city", appliedCity);

      const response = await fetch(`/api/reports?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load reports");
      }

      setReports(data.reports || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, type, category, appliedCity]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
    setAppliedCity(city.trim());
  }

  function resetFilters() {
    setSearch("");
    setType("");
    setCategory("");
    setCity("");
    setAppliedSearch("");
    setAppliedCity("");
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteNavbar />

      <section className="mx-auto max-w-7xl px-5 py-12">
        <PageHeading
          eyebrow="Community lost & found"
          title="Browse reports"
          description="Search for lost belongings or help someone find their missing item."
        />

        <form
          onSubmit={handleSearch}
          className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="sr-only" htmlFor="report-search">
              Search items
            </label>
            <input
              id="report-search"
              type="search"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

            <label className="sr-only" htmlFor="report-type">
              Report type
            </label>
            <select
              id="report-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">All report types</option>
              <option value="lost">Lost Items</option>
              <option value="found">Found Items</option>
            </select>

            <label className="sr-only" htmlFor="report-category">
              Category
            </label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="report-city">
              City
            </label>
            <input
              id="report-city"
              type="text"
              placeholder="Filter by city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              Search Reports
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-slate-300 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </form>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Available Reports
          </h2>
          <p className="text-sm text-slate-500">
            {pagination.total} reports found
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-12 text-center text-slate-500">
            Loading reports...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            {error}
            <button
              onClick={fetchReports}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No reports found
            </h3>
            <p className="mt-2 text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <article
                key={report._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-44 items-center justify-center bg-slate-100">
                  {report.images?.[0]?.url ? (
                    <img
                      src={report.images[0].url}
                      alt={report.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-slate-400">
                      No image available
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        report.type === "lost"
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {report.type === "lost" ? "Lost Item" : "Found Item"}
                    </span>

                    <span className="text-xs text-slate-500">
                      {report.category}
                    </span>
                  </div>

                  <h3 className="truncate text-lg font-semibold text-slate-900">
                    {report.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-600">
                    {report.description}
                  </p>

                  <div className="mt-4 text-sm text-slate-500">
                    <p>{report.city}, {report.state}</p>
                    <p className="mt-1">
                      {report.incidentDate
                        ? new Date(report.incidentDate).toLocaleDateString()
                        : "Date not available"}
                    </p>
                  </div>

                  <Link
                    href={`/reports/${report._id}`}
                    className="mt-5 block rounded-lg border border-blue-600 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-slate-600">
              Page {page} of {pagination.totalPages}
            </span>

            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
