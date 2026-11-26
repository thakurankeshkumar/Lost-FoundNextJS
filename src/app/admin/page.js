
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

function formatDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ title, value, description, tone = "blue" }) {
  const tones = {
    blue: "border-l-blue-600",
    green: "border-l-green-600",
    amber: "border-l-amber-500",
    slate: "border-l-slate-400",
  };
  const displayValue =
    typeof value === "number" ? value.toLocaleString("en-IN") : value ?? 0;

  return (
    <div className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm shadow-slate-900/[0.02] ${tones[tone]}`}>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        {displayValue}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
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
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"
        }`}
    >
      {status?.replace("_", " ") || "Unknown"}
    </span>
  );
}

function AdminLinkCard({ title, description, href }) {
  return (
    <Link
      href={href}
      className="group flex min-h-44 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-700">
          →
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <p className="mt-5 text-sm font-semibold text-blue-700">
        Open {title.toLowerCase()} <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const [data, setData] = useState(null);
  const [admin, setAdmin] = useState(null);
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

        setAdmin(authData.user);

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
      <main className="min-h-screen bg-gray-50">
        <SiteNavbar />
        <div className="flex min-h-[70vh] items-center justify-center px-5">
          <p className="text-gray-600" aria-live="polite">
            Loading admin dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <SiteNavbar />
        <div className="flex min-h-[70vh] items-center justify-center p-5">
          <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center">
            <p className="font-semibold text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const stats = data.statistics || {};
  const recentReports = data.recentReports || [];
  const recentClaims = data.recentClaims || [];
  const attentionItems = [
    {
      label: "Reports to review",
      count: stats.underReviewReports || 0,
      href: "/admin/reports",
      description: "Check reports flagged for moderation.",
      tone: "amber",
    },
    {
      label: "Pending claims",
      count: stats.pendingClaims || 0,
      href: "/admin/claims",
      description: "Follow up on ownership requests.",
      tone: "blue",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <SiteNavbar />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <PageHeading
          eyebrow="Admin workspace"
          title={`Welcome back, ${admin?.name?.split(" ")[0] || "Admin"}`}
          description="A clear view of reports, members, and ownership claims that need attention."
        />

        <section aria-label="Platform overview">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total reports"
              value={stats.totalReports}
              description="All reports submitted"
              tone="slate"
            />
            <StatCard
              title="Active reports"
              value={stats.activeReports}
              description="Visible to the community"
              tone="green"
            />
            <StatCard
              title="Registered users"
              value={stats.totalUsers}
              description={`${stats.activeUsers ?? 0} active accounts`}
              tone="blue"
            />
            <StatCard
              title="Pending claims"
              value={stats.pendingClaims}
              description="Waiting for a decision"
              tone="amber"
            />
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Needs your attention
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Work through these queues to keep the community moving.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </p>
                  <span className="mt-3 inline-flex text-sm font-semibold text-blue-700">
                    Open queue <span className="ml-1" aria-hidden="true">→</span>
                  </span>
                </div>
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                    item.tone === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Platform management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Go directly to the area you need to manage.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminLinkCard
              title="Reports"
              description="Review submissions, moderate reports, and restore items when needed."
              href="/admin/reports"
            />

            <AdminLinkCard
              title="Users"
              description="Find member accounts and manage access when an account needs attention."
              href="/admin/users"
            />

            <AdminLinkCard
              title="Claims"
              description="Track ownership requests and completed handovers."
              href="/admin/claims"
            />
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The latest reports and ownership claims across FindBack.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Latest reports</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Recently submitted by members
                  </p>
                </div>
                <Link
                  href="/admin/reports"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  View all
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-medium text-slate-800">
                    No reports to show yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    New community reports will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentReports.map((report) => (
                    <div
                      key={report._id}
                      className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {report.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {report.type} · {report.category} · {report.city},{" "}
                          {report.state}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {report.userId?.name || "Unknown member"} ·{" "}
                          {formatDate(report.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={report.status} />
                        <Link
                          href={`/reports/${report._id}`}
                          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Latest claims</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Ownership claim activity
                  </p>
                </div>
                <Link
                  href="/admin/claims"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  View all
                </Link>
              </div>

              {recentClaims.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-medium text-slate-800">
                    No claims to show yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted ownership claims will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentClaims.map((claim) => (
                    <div
                      key={claim._id}
                      className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {claim.reportId?.title || "Report unavailable"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {claim.claimantId?.name || "Unknown claimant"}{" "}
                          <span aria-hidden="true">·</span>{" "}
                          {formatDate(claim.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
