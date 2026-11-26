
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditReportPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    city: "",
    state: "",
    country: "India",
    incidentDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        const [reportResponse, userResponse] = await Promise.all([
          fetch(`/api/reports/${id}`),
          fetch("/api/auth/me"),
        ]);

        const reportData = await reportResponse.json();
        const userData = await userResponse.json();

        if (!reportResponse.ok || !reportData.success) {
          throw new Error(reportData.message || "Unable to load report");
        }

        if (!userResponse.ok || !userData.success) {
          throw new Error("Please log in to edit this report.");
        }

        const report = reportData.report;

        const ownerId =
          typeof report.userId === "object"
            ? report.userId?._id?.toString()
            : report.userId?.toString();

        if (ownerId !== userData.user.id?.toString()) {
          router.replace(`/reports/${id}`);
          return;
        }

        if (report.status !== "active") {
          throw new Error("Only active reports can be edited.");
        }

        setForm({
          title: report.title || "",
          description: report.description || "",
          category: report.category || "",
          city: report.city || "",
          state: report.state || "",
          country: report.country || "India",
          incidentDate: report.incidentDate
            ? new Date(report.incidentDate).toISOString().slice(0, 10)
            : "",
        });
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadReport();
    }
  }, [id, router]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update report");
      }

      setSuccess("Report updated successfully!");

      router.push(`/reports/${id}`);
      router.refresh();
    } catch (err) {
      setError(err.message || "Something went wrong");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <SiteNavbar />
        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <p className="text-slate-500" aria-live="polite">Loading report...</p>
        </div>
      </main>
    );
  }

  if (error && !form.title) {
    return (
      <main className="min-h-screen bg-slate-50">
        <SiteNavbar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Unable to edit report
          </h1>

          <p className="mt-3 text-slate-500">{error}</p>

          <Link
            href="/my-reports"
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-white"
          >
            Back to my reports
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteNavbar />

      <section className="mx-auto max-w-3xl px-5 py-10">
        <Link
          href={`/reports/${id}`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Report
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <PageHeading
            eyebrow="Your report"
            title="Edit report"
            description="Update the information about your lost or found item."
          />

          {error && (
            <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Report Title
              </label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                minLength={3}
                maxLength={100}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                minLength={10}
                maxLength={1000}
                rows={5}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  City
                </label>

                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={80}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  State
                </label>

                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={80}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Country
              </label>

              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                minLength={2}
                maxLength={80}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Incident Date
              </label>

              <input
                type="date"
                name="incidentDate"
                value={form.incidentDate}
                onChange={handleChange}
                max={new Date().toLocaleDateString("en-CA")}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>

              <Link
                href={`/reports/${id}`}
                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
