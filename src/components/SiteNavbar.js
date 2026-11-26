"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const userLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Browse reports", href: "/reports" },
  { label: "My reports", href: "/my-reports" },
  { label: "Profile", href: "/profile" },
];

const adminLinks = [
  { label: "Overview", href: "/admin" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Users", href: "/admin/users" },
  { label: "Claims", href: "/admin/claims" },
  { label: "Profile", href: "/profile" },
];

export default function SiteNavbar({ landing = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (response.status === 401) {
          if (!cancelled) {
            setUser(null);
            setStatus("guest");
            setError("");
          }
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to check your account.");
        }

        if (!cancelled) {
          setUser(data.user);
          setStatus("signed-in");
          setError("");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Account navigation is temporarily unavailable.");
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [attempt, pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error("Unable to log out. Please try again.");
      }

      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      setError(logoutError.message || "Unable to log out. Please try again.");
      setLoggingOut(false);
    }
  }

  const links =
    status === "signed-in"
      ? user?.role === "admin"
        ? adminLinks
        : userLinks
      : landing
        ? [
          { label: "How it works", href: "#how-it-works" },
          { label: "Categories", href: "#categories" },
          { label: "Browse reports", href: "/reports" },
        ]
        : [{ label: "Browse reports", href: "/reports" }];

  function isActive(href) {
    if (href.startsWith("#")) return false;
    if (href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderLinks(mobile = false) {
    return links.map(({ label, href }) => {
      const active = isActive(href);
      const className = mobile
        ? `block rounded-lg px-3 py-2.5 text-sm font-medium ${active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
        }`
        : `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-blue-700"
        }`;

      return (
        <Link
          key={href}
          href={href}
          className={className}
          aria-current={active ? "page" : undefined}
          onClick={() => setMenuOpen(false)}
        >
          {label}
        </Link>
      );
    });
  }

  function renderAccountActions(mobile = false) {
    if (status === "checking") {
      return (
        <span className="px-3 py-2 text-sm text-slate-400" aria-live="polite">
          Checking account...
        </span>
      );
    }

    if (status === "error") {
      return (
        <button
          type="button"
          onClick={() => setAttempt((current) => current + 1)}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Retry account check
        </button>
      );
    }

    if (status === "signed-in") {
      return (
        <>
          {user?.role !== "admin" && (
            <Link
              href="/reports/new"
              className={`rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 ${mobile ? "w-full text-left" : ""
                }`}
              onClick={() => setMenuOpen(false)}
            >
              Create report
            </Link>
          )}
          <span className="hidden max-w-36 truncate text-sm font-medium text-slate-600 lg:block">
            {user?.name}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${mobile ? "w-full text-left" : ""
              }`}
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </>
      );
    }

    if (pathname === "/login") {
      return (
        <Link
          href="/register"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          onClick={() => setMenuOpen(false)}
        >
          Create account
        </Link>
      );
    }

    if (pathname === "/register") {
      return (
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={() => setMenuOpen(false)}
        >
          Log in
        </Link>
      );
    }

    return (
      <>
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={() => setMenuOpen(false)}
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          onClick={() => setMenuOpen(false)}
        >
          Create account
        </Link>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-5 lg:px-8">
        <Link
          href={status === "signed-in" ? (user?.role === "admin" ? "/admin" : "/dashboard") : "/"}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="FindBack home"
        >
          <Image
            src="/favicon.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl object-cover"
            priority
          />
          <span>
            <span className="block text-lg font-bold leading-tight text-slate-900">
              FindBack
            </span>
            <span className="hidden text-[9px] font-medium tracking-widest text-slate-500 sm:block">
              LOST &amp; FOUND PLATFORM
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {renderLinks()}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {renderAccountActions()}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-100 bg-white px-4 py-3 md:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Mobile navigation">
            {renderLinks(true)}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {renderAccountActions(true)}
            </div>
          </nav>
        </div>
      )}

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}
