
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
            User Management
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            View registered users and manage their account access.
          </p>
        </div>

        {/* Search and Filters */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <form onSubmit={handleSearch}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search users
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by name or email..."
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
                Account status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Account role
              </label>

              <select
                value={role}
                onChange={(event) =>
                  handleRoleChange(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
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

        {/* Users */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Registered Accounts
            </h2>

            <span className="text-sm text-gray-500">
              {pagination.total} total accounts
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No users found. Try changing your search or filters.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => {
                const isAdmin = user.role === "admin";
                const isBusy = actionLoading === user._id;

                return (
                  <article
                    key={user._id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {user.name}
                      </h3>

                      <p className="mt-1 break-all text-sm text-gray-500">
                        {user.email}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                          {user.role}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-400">
                        Joined:{" "}
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <span className="text-xs font-medium text-gray-500">
                          Protected admin account
                        </span>
                      ) : user.status === "active" ? (
                        <button
                          onClick={() =>
                            handleUserAction(user, "block")
                          }
                          disabled={isBusy}
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {isBusy ? "Updating..." : "Block User"}
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleUserAction(user, "unblock")
                          }
                          disabled={isBusy}
                          className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                        >
                          {isBusy ? "Updating..." : "Unblock User"}
                        </button>
                      )}
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
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
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
