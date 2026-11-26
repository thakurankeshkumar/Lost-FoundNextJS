
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        search,
        status,
        role,
      });

      const response = await fetch(
        `/api/admin/users?${params.toString()}`
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
        throw new Error(result.message || "Unable to load users");
      }

      setUsers(result.users || []);

      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, status, role, router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  function handleRoleChange(value) {
    setRole(value);

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setRole("all");
    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  }

  async function handleUserAction(user, action) {
    const actionText = action === "block" ? "block" : "unblock";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${user.name}?`
    );

    if (!confirmed) return;

    setActionLoading(user._id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/users/${user._id}`,
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
        throw new Error(result.message || "Unable to update user");
      }

      setSuccess(result.message || "User updated successfully");

      await loadUsers();
    } catch (err) {
      setError(err.message || "Unable to update user");
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

  function getStatusStyle(userStatus) {
    return userStatus === "active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteNavbar />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <PageHeading
          eyebrow="Admin workspace"
          title="User management"
          description="Review member accounts and manage access when needed."
        />

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Find an account</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by member name or email, then filter by account status or role.
            </p>
          </div>

          <form onSubmit={handleSearch}>
            <label
              htmlFor="admin-user-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="admin-user-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Member name or email address"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Search accounts
              </button>
            </div>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="admin-user-status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Account status
              </label>
              <select
                id="admin-user-status"
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="admin-user-role"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Account role
              </label>
              <select
                id="admin-user-role"
                value={role}
                onChange={(event) => handleRoleChange(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All roles</option>
                <option value="user">Members</option>
                <option value="admin">Administrators</option>
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

        <section aria-labelledby="admin-users-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="admin-users-heading" className="text-lg font-bold text-slate-900">
                Member accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Account details and access controls are shown on each card.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              {pagination.total.toLocaleString("en-IN")} total
            </span>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <h3 className="font-semibold text-slate-900">No accounts found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different name, email, or account filter.
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
            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {users.map((user) => {
                const isAdmin = user.role === "admin";
                const isBusy = actionLoading === user._id;
                const initial = user.name?.trim()?.charAt(0)?.toUpperCase() || "?";

                return (
                  <article
                    key={user._id}
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-700">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-bold text-slate-900">
                          {user.name || "Unnamed member"}
                        </h3>
                        <p className="mt-1 break-all text-sm text-slate-500">
                          {user.email || "No email available"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        isAdmin
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {isAdmin ? "Administrator" : user.role || "Member"}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(user.status)}`}>
                        {user.status || "Unknown status"}
                      </span>
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Joined
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Date unavailable"}
                      </p>
                    </div>

                    <div className="mt-auto pt-5">
                      {isAdmin ? (
                        <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-sm text-slate-500">
                          Administrator accounts are protected.
                        </p>
                      ) : user.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => handleUserAction(user, "block")}
                          disabled={isBusy}
                          className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Updating account..." : "Block account"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUserAction(user, "unblock")}
                          disabled={isBusy}
                          className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Updating account..." : "Restore account"}
                        </button>
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
