
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value ?? 0}
      </p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    resolved: "bg-blue-100 text-blue-700",
    removed: "bg-red-100 text-red-700",
    under_review: "bg-yellow-100 text-yellow-700",
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status?.replace("_", " ") || "Unknown"}
    </span>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const authResponse = await fetch("/api/auth/me");

        if (authResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const authData = await authResponse.json();

        if (!authResponse.ok || !authData.success) {
          throw new Error("Unable to verify your account");
        }

        if (authData.user?.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        const response = await fetch("/api/admin/overview");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load dashboard");
        }

        setData(result);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-5">
        <div className="rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="font-semibold text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.statistics;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-sm font-semibold text-blue-600">FindBack</p>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and monitor the platform
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            User Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        {/* User statistics */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Users
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              description="All registered accounts"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              description="Accounts currently active"
            />
            <StatCard
              title="Blocked Users"
              value={stats.blockedUsers}
              description="Accounts currently blocked"
            />
          </div>
        </section>

        {/* Report statistics */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Reports
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Reports"
              value={stats.totalReports}
              description="All submitted reports"
            />
            <StatCard
              title="Active Reports"
              value={stats.activeReports}
              description="Currently available reports"
            />
            <StatCard
              title="Lost Reports"
              value={stats.lostReports}
              description="Items reported as lost"
            />
            <StatCard
              title="Found Reports"
              value={stats.foundReports}
              description="Items reported as found"
            />
          </div>

          <div className="mt-4">
            <StatCard
              title="Reports Under Review"
              value={stats.underReviewReports}
              description="Reports awaiting moderation"
            />
          </div>
        </section>

        {/* Claim statistics */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Ownership Claims
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Pending Claims"
              value={stats.pendingClaims}
              description="Awaiting finder decision"
            />
            <StatCard
              title="Accepted Claims"
              value={stats.acceptedClaims}
              description="Accepted, awaiting completion"
            />
            <StatCard
              title="Completed Claims"
              value={stats.completedClaims}
              description="Successfully completed handovers"
            />
          </div>
        </section>

        {/* Recent reports */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Recent Reports
          </h2>

          {data.recentReports.length === 0 ? (
            <p className="text-sm text-gray-500">No reports found.</p>
          ) : (
            <div className="space-y-4">
              {data.recentReports.map((report) => (
                <div
                  key={report._id}
                  className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {report.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {report.type} · {report.category} · {report.city},{" "}
                      {report.state}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      By {report.userId?.name || "Unknown user"} ·{" "}
                      {formatDate(report.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={report.status} />
                    <Link
                      href={`/reports/${report._id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent claims */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Recent Claims
          </h2>

          {data.recentClaims.length === 0 ? (
            <p className="text-sm text-gray-500">No claims found.</p>
          ) : (
            <div className="space-y-4">
              {data.recentClaims.map((claim) => (
                <div
                  key={claim._id}
                  className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {claim.reportId?.title || "Report unavailable"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Claimant: {claim.claimantId?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Finder: {claim.finderId?.name || "Unknown"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(claim.createdAt)}
                    </p>
                  </div>

                  <StatusBadge status={claim.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-center text-xs text-gray-400">
          FindBack Admin Panel
        </p>
      </div>
    </main>
  );
}
