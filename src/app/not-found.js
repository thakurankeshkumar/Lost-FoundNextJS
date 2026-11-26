import Link from "next/link";

export const metadata = {
  title: "Page Not Found",
  description: "The page you are looking for could not be found on FindBack.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="text-center">
        <p className="text-sm font-semibold text-blue-700">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This page may have moved or is no longer available.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
