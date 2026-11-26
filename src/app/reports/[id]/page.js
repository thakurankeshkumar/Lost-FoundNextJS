
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ReportDetailsPage() {
    const { id } = useParams();
    const router = useRouter();

    const [report, setReport] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);

    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesError, setMatchesError] = useState("");

    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    // Identify the report owner.
    const reportOwnerId =
        typeof report?.userId === "object"
            ? report.userId?._id?.toString()
            : report?.userId?.toString();

    const currentUserId = currentUser?.id?.toString();

    const isOwner = Boolean(
        currentUserId &&
        reportOwnerId &&
        currentUserId === reportOwnerId
    );

    // Fetch report details and logged-in user.
    useEffect(() => {
        async function fetchReport() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`/api/reports/${id}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Unable to load report");
                }

                setReport(data.report);

                // Check the currently logged-in user.
                const userResponse = await fetch("/api/auth/me");
                const userData = await userResponse.json();

                if (userResponse.ok && userData.success) {
                    setCurrentUser(userData.user);
                } else {
                    setCurrentUser(null);
                }
            } catch (err) {
                setError(err.message || "Something went wrong");
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchReport();
        }
    }, [id]);

    // Fetch potential matches for the report owner.
    useEffect(() => {
        async function fetchMatches() {
            try {
                setMatchesLoading(true);
                setMatchesError("");

                const response = await fetch(
                    `/api/reports/${id}/matches`
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to find potential matches"
                    );
                }

                setMatches(data.matches || []);
            } catch (err) {
                setMatchesError(
                    err.message || "Something went wrong"
                );
            } finally {
                setMatchesLoading(false);
            }
        }

        if (id && isOwner) {
            fetchMatches();
        }
    }, [id, isOwner]);

    // Delete report.
    async function handleDelete() {
        const confirmed = window.confirm(
            "Are you sure you want to delete this report? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setDeleting(true);

            const response = await fetch(`/api/reports/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to delete report"
                );
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            alert(err.message || "Something went wrong");
            setDeleting(false);
        }
    }

    // Loading screen.
    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-slate-500">
                    Loading report details...
                </p>
            </main>
        );
    }

    // Error screen.
    if (error || !report) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center">
                <h1 className="text-2xl font-bold text-slate-900">
                    Report not found
                </h1>

                <p className="mt-2 text-slate-500">
                    {error ||
                        "This report may have been removed or resolved."}
                </p>

                <Link
                    href="/reports"
                    className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white"
                >
                    Back to Reports
                </Link>
            </main>
        );
    }

    const images = report.images || [];

    return (
        <main className="min-h-screen bg-slate-50">

            {/* Navigation */}
            <nav className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
                    <Link
                        href="/"
                        className="text-2xl font-bold text-slate-900"
                    >
                        FindBack
                    </Link>

                    <div className="flex items-center gap-5 text-sm font-medium">
                        <Link
                            href="/reports"
                            className="text-slate-600 hover:text-blue-600"
                        >
                            Browse Reports
                        </Link>

                        <Link
                            href="/dashboard"
                            className="text-slate-600 hover:text-blue-600"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <section className="mx-auto max-w-6xl px-5 py-10">

                <Link
                    href="/reports"
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    ← Back to Reports
                </Link>

                <div className="mt-6 grid gap-8 lg:grid-cols-2">

                    {/* Images */}
                    <div>
                        <div className="flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white sm:h-[430px]">
                            {images.length > 0 ? (
                                <img
                                    src={images[selectedImage]?.url}
                                    alt={report.title}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <p className="text-slate-400">
                                    No images available
                                </p>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="mt-4 flex gap-3 overflow-x-auto">
                                {images.map((image, index) => (
                                    <button
                                        key={image.publicId || image.url || index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${selectedImage === index
                                            ? "border-blue-600"
                                            : "border-slate-200"
                                            }`}
                                    >
                                        <img
                                            src={image.url}
                                            alt={`${report.title} ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Report Information */}
                    <div>

                        {/* Report Type and Category */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${report.type === "lost"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-green-50 text-green-600"
                                    }`}
                            >
                                {report.type === "lost"
                                    ? "Lost Item"
                                    : "Found Item"}
                            </span>

                            <span className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-700">
                                {report.category}
                            </span>

                            {report.status && (
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-700">
                                    {report.status.replace("_", " ")}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="mt-5 text-3xl font-bold text-slate-900 sm:text-4xl">
                            {report.title}
                        </h1>

                        {/* Description */}
                        <p className="mt-5 whitespace-pre-line leading-7 text-slate-600">
                            {report.description}
                        </p>

                        {/* Owner Management Actions */}
                        {isOwner && (
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={`/reports/${id}/edit`}
                                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Edit Report
                                </Link>

                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deleting
                                        ? "Deleting..."
                                        : "Delete Report"}
                                </button>
                            </div>
                        )}

                        {/* Report Information Card */}
                        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Report Information
                            </h2>

                            <div className="mt-5 space-y-4 text-sm">

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">
                                        Location
                                    </span>

                                    <span className="text-right font-medium text-slate-800">
                                        {report.city}, {report.state},{" "}
                                        {report.country}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">
                                        Incident Date
                                    </span>

                                    <span className="text-right font-medium text-slate-800">
                                        {new Date(
                                            report.incidentDate
                                        ).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">
                                        Reported By
                                    </span>

                                    <span className="text-right font-medium text-slate-800">
                                        {report.userId?.name ||
                                            "Community Member"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">
                                        Posted On
                                    </span>

                                    <span className="text-right font-medium text-slate-800">
                                        {report.createdAt
                                            ? new Date(
                                                report.createdAt
                                            ).toLocaleDateString()
                                            : "Not available"}
                                    </span>
                                </div>

                            </div>
                        </div>

                        {/* Ownership Claim Information */}
                        {report.type === "found" && (
                            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
                                <h2 className="font-semibold text-blue-900">
                                    Is this your missing item?
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-blue-800">
                                    If you believe this item belongs to you,
                                    you can submit an ownership claim. You will
                                    need to provide details that help verify
                                    your ownership.
                                </p>

                                <p className="mt-3 text-xs text-blue-700">
                                    Ownership claim submission will be
                                    available in the next phase.
                                </p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Potential Matches - Report Owner Only */}
                {isOwner && (
                    <section className="mt-12">

                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-slate-900">
                                Potential Matches
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Similar{" "}
                                {report.type === "lost" ? "found" : "lost"}{" "}
                                reports that might be related to your report.
                            </p>
                        </div>

                        {/* Loading */}
                        {matchesLoading && (
                            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                                <p className="text-sm text-slate-500">
                                    Finding potential matches...
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {!matchesLoading && matchesError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                                <p className="text-sm text-red-700">
                                    {matchesError}
                                </p>
                            </div>
                        )}

                        {/* No Matches */}
                        {!matchesLoading &&
                            !matchesError &&
                            matches.length === 0 && (
                                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                                    <h3 className="font-semibold text-slate-800">
                                        No potential matches found yet.
                                    </h3>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Similar reports will appear here when
                                        they become available.
                                    </p>
                                </div>
                            )}

                        {/* Matching Reports */}
                        {!matchesLoading &&
                            !matchesError &&
                            matches.length > 0 && (
                                <div className="space-y-4">

                                    {matches.map((match) => (
                                        <div
                                            key={match.report._id}
                                            className="rounded-xl border border-slate-200 bg-white p-5"
                                        >
                                            <div className="flex flex-col gap-5 sm:flex-row">

                                                {/* Matching Report Image */}
                                                {match.report.images?.[0]?.url && (
                                                    <img
                                                        src={match.report.images[0].url}
                                                        alt={match.report.title}
                                                        className="h-36 w-full rounded-lg object-cover sm:w-36"
                                                    />
                                                )}

                                                {/* Matching Report Details */}
                                                <div className="min-w-0 flex-1">

                                                    <div className="flex flex-wrap items-center justify-between gap-3">

                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${match.report.type === "lost"
                                                                ? "bg-red-50 text-red-600"
                                                                : "bg-green-50 text-green-600"
                                                                }`}
                                                        >
                                                            {match.report.type === "lost"
                                                                ? "Lost Item"
                                                                : "Found Item"}
                                                        </span>

                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                                                            {match.matchScore}% Match
                                                        </span>

                                                    </div>

                                                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                                                        {match.report.title}
                                                    </h3>

                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {match.report.category} ·{" "}
                                                        {match.report.city},{" "}
                                                        {match.report.state}
                                                    </p>

                                                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                                                        {match.report.description}
                                                    </p>

                                                    {/* Matching Reasons */}
                                                    {match.matchReasons?.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {match.matchReasons.map(
                                                                (reason, index) => (
                                                                    <span
                                                                        key={`${reason}-${index}`}
                                                                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                                                                    >
                                                                        {reason}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* View Matching Report */}
                                                    <Link
                                                        href={`/reports/${match.report._id}`}
                                                        className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
                                                    >
                                                        View Report →
                                                    </Link>

                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            )}

                    </section>
                )}

            </section>
        </main>
    );
}
