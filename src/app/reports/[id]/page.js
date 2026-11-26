
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SiteNavbar from "@/components/SiteNavbar";

export default function ReportDetailsPage() {
    const { id } = useParams();
    const router = useRouter();

    const [report, setReport] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);

    // General page state
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    // Potential matches
    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(true);
    const [matchesError, setMatchesError] = useState("");

    // Claimant's own claim
    const [currentClaim, setCurrentClaim] = useState(null);
    const [myClaimLoading, setMyClaimLoading] = useState(false);
    const [claimEvidence, setClaimEvidence] = useState("");
    const [submittingClaim, setSubmittingClaim] = useState(false);
    const [claimError, setClaimError] = useState("");
    const [claimMessage, setClaimMessage] = useState("");
    const [showNewClaimForm, setShowNewClaimForm] = useState(false);

    // Finder claim management
    const [claims, setClaims] = useState([]);
    const [claimsLoading, setClaimsLoading] = useState(true);
    const [claimsError, setClaimsError] = useState("");
    const [processingClaim, setProcessingClaim] = useState("");

    // Claimant handover code
    const [generatedCode, setGeneratedCode] = useState("");
    const [codeExpiresAt, setCodeExpiresAt] = useState(null);
    const [generatingCode, setGeneratingCode] = useState(false);
    const [codeError, setCodeError] = useState("");

    // Finder handover verification
    const [verificationCodes, setVerificationCodes] = useState({});
    const [verifyingClaim, setVerifyingClaim] = useState("");
    const [verificationMessage, setVerificationMessage] = useState("");
    const [verificationError, setVerificationError] = useState("");

    // Identify report owner.
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

    // Load report details and logged-in user.
    useEffect(() => {
        let cancelled = false;

        async function loadPage() {
            try {
                const [reportResponse, userResponse] = await Promise.all([
                    fetch(`/api/reports/${id}`),
                    fetch("/api/auth/me"),
                ]);

                const reportData = await reportResponse.json();
                const userData = await userResponse.json();

                if (!reportResponse.ok || !reportData.success) {
                    throw new Error(
                        reportData.message || "Unable to load report"
                    );
                }

                if (!cancelled) {
                    setReport(reportData.report);

                    if (userResponse.ok && userData.success) {
                        setCurrentUser(userData.user);
                    } else {
                        setCurrentUser(null);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Something went wrong");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        if (id) {
            loadPage();
        }

        return () => {
            cancelled = true;
        };
    }, [id]);

    // Fetch the logged-in claimant's own claim.
    // This restores the claim status after refreshing or reopening the page.
    const fetchMyClaim = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/reports/${id}/my-claim`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to retrieve your claim"
                );
            }

            setCurrentClaim(data.claim || null);
            setClaimError("");
        } catch (err) {
            setClaimError(
                err.message || "Unable to check your claim status"
            );
        } finally {
            setMyClaimLoading(false);
        }
    }, [id]);

    // Check claim status after report and user details are loaded.
    useEffect(() => {
        if (
            id &&
            currentUser &&
            report?.type === "found" &&
            !isOwner
        ) {
            fetchMyClaim();
        }
    }, [id, currentUser, report?.type, isOwner, fetchMyClaim]);

    // Fetch potential matches for the report owner.
    const fetchMatches = useCallback(async () => {
        try {
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
            setMatchesError("");
        } catch (err) {
            setMatchesError(
                err.message || "Something went wrong"
            );
        } finally {
            setMatchesLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id && isOwner) {
            fetchMatches();
        }
    }, [id, isOwner, fetchMatches]);

    // Fetch claims submitted for this found report.
    // Only the finder can access this endpoint.
    const fetchClaims = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/reports/${id}/claims`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to retrieve claims"
                );
            }

            setClaims(data.claims || []);
            setClaimsError("");
        } catch (err) {
            setClaimsError(
                err.message || "Something went wrong"
            );
        } finally {
            setClaimsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id && isOwner && report?.type === "found") {
            fetchClaims();
        }
    }, [id, isOwner, report?.type, fetchClaims]);

    // Submit a new ownership claim.
    async function handleClaimSubmit(event) {
        event.preventDefault();

        setClaimError("");
        setClaimMessage("");

        if (claimEvidence.trim().length < 10) {
            setClaimError(
                "Please provide at least 10 characters explaining your ownership."
            );
            return;
        }

        if (claimEvidence.trim().length > 1500) {
            setClaimError(
                "Your explanation cannot exceed 1500 characters."
            );
            return;
        }

        try {
            setSubmittingClaim(true);

            const response = await fetch(
                `/api/reports/${id}/claims`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        evidence: claimEvidence.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to submit ownership claim"
                );
            }

            setCurrentClaim({
                ...data.claim,
                status: data.claim.status || "pending",
            });

            setClaimEvidence("");
            setShowNewClaimForm(false);
            setClaimMessage(
                "Your ownership claim has been submitted successfully."
            );
        } catch (err) {
            setClaimError(
                err.message || "Something went wrong"
            );
        } finally {
            setSubmittingClaim(false);
        }
    }

    // Finder accepts or rejects a claim.
    async function handleClaimDecision(claimId, action) {
        const confirmed = window.confirm(
            action === "accept"
                ? "Are you sure you want to accept this ownership claim?"
                : "Are you sure you want to reject this ownership claim?"
        );

        if (!confirmed) return;

        setProcessingClaim(claimId);
        setClaimsError("");

        try {
            const response = await fetch(
                `/api/claims/${claimId}/decision`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ action }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to process claim"
                );
            }

            await fetchClaims();
        } catch (err) {
            setClaimsError(
                err.message || "Something went wrong"
            );
        } finally {
            setProcessingClaim("");
        }
    }

    // Claimant generates a handover code after acceptance.
    async function handleGenerateCode(claimId) {
        setCodeError("");
        setGeneratedCode("");
        setCodeExpiresAt(null);

        try {
            setGeneratingCode(true);

            const response = await fetch(
                `/api/claims/${claimId}/handover-code`,
                {
                    method: "POST",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                if (
                    response.status === 409 &&
                    data.message?.includes("active handover code")
                ) {
                    throw new Error(
                        "A handover code has already been generated. For security, the existing code cannot be displayed again. If you have lost it, contact the finder and wait for the current code to expire before generating another one."
                    );
                }

                throw new Error(
                    data.message || "Unable to generate handover code"
                );
            }

            setGeneratedCode(data.handoverCode);
            setCodeExpiresAt(data.expiresAt);
        } catch (err) {
            setCodeError(
                err.message || "Something went wrong"
            );
        } finally {
            setGeneratingCode(false);
        }
    }

    // Update the verification input for a claim.
    function handleVerificationInput(claimId, value) {
        setVerificationCodes((previous) => ({
            ...previous,
            [claimId]: value.replace(/\D/g, "").slice(0, 6),
        }));
    }

    // Finder verifies the handover code.
    async function handleVerifyHandover(claimId) {
        const code = verificationCodes[claimId] || "";

        setVerificationMessage("");
        setVerificationError("");

        if (!/^\d{6}$/.test(code)) {
            setVerificationError(
                "Please enter a valid six-digit handover code."
            );
            return;
        }

        const confirmed = window.confirm(
            "Confirm that the item has been physically handed over to the claimant?"
        );

        if (!confirmed) return;

        try {
            setVerifyingClaim(claimId);

            const response = await fetch(
                `/api/claims/${claimId}/verify`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to verify handover"
                );
            }

            setVerificationMessage(
                "Handover verified successfully. The report is now resolved."
            );

            setVerificationCodes((previous) => ({
                ...previous,
                [claimId]: "",
            }));

            setReport((previous) => ({
                ...previous,
                status: "resolved",
            }));

            await fetchClaims();
        } catch (err) {
            setVerificationError(
                err.message || "Something went wrong"
            );
        } finally {
            setVerifyingClaim("");
        }
    }

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
            <main className="min-h-screen bg-slate-50">
                <SiteNavbar />
                <div className="flex min-h-[70vh] items-center justify-center px-5">
                    <p className="text-slate-500" aria-live="polite">
                        Loading report details...
                    </p>
                </div>
            </main>
        );
    }

    // Error screen.
    if (error || !report) {
        return (
            <main className="min-h-screen bg-slate-50">
                <SiteNavbar />
                <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
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
                        Browse reports
                    </Link>
                </div>
            </main>
        );
    }

    const images = report.images || [];

    return (
        <main className="min-h-screen bg-slate-50">
            <SiteNavbar />

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
                        <div className="flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white sm:h-107.5">
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
                                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                                            selectedImage === index
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
                        <div className="flex flex-wrap items-center gap-3">
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                    report.type === "lost"
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

                        <h1 className="mt-5 text-3xl font-bold text-slate-900 sm:text-4xl">
                            {report.title}
                        </h1>

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

                        {/* Claimant Ownership Claim Section */}
                        {report.type === "found" && !isOwner && (
                            <div className="mt-6 rounded-xl border border-blue-200 bg-white p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Is this your missing item?
                                    </h2>

                                    {currentUser && currentClaim && (
                                        <button
                                            onClick={fetchMyClaim}
                                            disabled={myClaimLoading}
                                            className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                                        >
                                            {myClaimLoading
                                                ? "Refreshing..."
                                                : "Refresh status"}
                                        </button>
                                    )}
                                </div>

                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Submit an ownership claim and explain
                                    details that can help the finder verify
                                    that the item belongs to you.
                                </p>

                                {!currentUser ? (
                                    <div className="mt-5 rounded-lg bg-blue-50 p-4">
                                        <p className="text-sm text-blue-800">
                                            Please log in to submit an ownership claim.
                                        </p>

                                        <Link
                                            href="/login"
                                            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            Log In
                                        </Link>
                                    </div>
                                ) : myClaimLoading ? (
                                    <div className="mt-5 rounded-lg bg-slate-50 p-5 text-center">
                                        <p className="text-sm text-slate-500">
                                            Checking your previous claim...
                                        </p>
                                    </div>
                                ) : currentClaim?.status === "pending" ? (
                                    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                                        <p className="font-semibold text-amber-800">
                                            Claim submitted — waiting for approval
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-amber-700">
                                            Your ownership claim has been received.
                                            The finder must review your evidence
                                            before you can generate a handover code.
                                        </p>

                                        <p className="mt-3 text-xs text-amber-700">
                                            Claim ID: {currentClaim._id}
                                        </p>

                                        <button
                                            onClick={fetchMyClaim}
                                            className="mt-4 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                                        >
                                            Check for approval
                                        </button>
                                    </div>
                                ) : currentClaim?.status === "accepted" ? (
                                    <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
                                        <p className="font-semibold text-green-800">
                                            Your claim has been approved!
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-green-700">
                                            The finder has accepted your ownership
                                            claim. Generate a handover code and
                                            share it with the finder when collecting
                                            your item.
                                        </p>

                                        <button
                                            onClick={() =>
                                                handleGenerateCode(currentClaim._id)
                                            }
                                            disabled={generatingCode}
                                            className="mt-4 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {generatingCode
                                                ? "Generating Code..."
                                                : "Generate Handover Code"}
                                        </button>

                                        {codeError && (
                                            <p className="mt-3 whitespace-pre-line text-sm text-red-700">
                                                {codeError}
                                            </p>
                                        )}

                                        {generatedCode && (
                                            <div className="mt-4 rounded-lg border border-green-300 bg-white p-4">
                                                <p className="text-sm font-medium text-slate-700">
                                                    Your handover code
                                                </p>

                                                <p className="mt-2 text-3xl font-bold tracking-[0.3em] text-green-700">
                                                    {generatedCode}
                                                </p>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    Share this code with the finder
                                                    when physically collecting your item.
                                                </p>

                                                {codeExpiresAt && (
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Expires:{" "}
                                                        {new Date(
                                                            codeExpiresAt
                                                        ).toLocaleString()}
                                                    </p>
                                                )}

                                                <button
                                                    onClick={() =>
                                                        navigator.clipboard.writeText(
                                                            generatedCode
                                                        )
                                                    }
                                                    className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Copy Code
                                                </button>
                                            </div>
                                        )}

                                        <p className="mt-3 text-xs text-slate-500">
                                            The code is shown only when it is first
                                            generated. Keep it somewhere safe.
                                        </p>
                                    </div>
                                ) : currentClaim?.status === "completed" ? (
                                    <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
                                        <p className="font-semibold text-green-800">
                                            Handover completed
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-green-700">
                                            The finder has verified the handover.
                                            Your ownership claim is complete.
                                        </p>
                                    </div>
                                ) : currentClaim?.status === "rejected" &&
                                  !showNewClaimForm ? (
                                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                                        <p className="font-semibold text-red-800">
                                            Your previous claim was rejected
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-red-700">
                                            The finder did not approve your previous
                                            ownership claim. If you have additional
                                            evidence, you can submit a new claim.
                                        </p>

                                        <button
                                            onClick={() => {
                                                setShowNewClaimForm(true);
                                                setClaimError("");
                                                setClaimMessage("");
                                            }}
                                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            Submit a New Claim
                                        </button>
                                    </div>
                                ) : currentClaim?.status === "rejected" &&
                                  showNewClaimForm ? (
                                    <form
                                        onSubmit={handleClaimSubmit}
                                        className="mt-5"
                                    >
                                        <p className="mb-4 text-sm text-slate-600">
                                            Submit additional or corrected
                                            ownership evidence.
                                        </p>

                                        <label
                                            htmlFor="claimEvidence"
                                            className="block text-sm font-medium text-slate-700"
                                        >
                                            Explain why this item belongs to you
                                        </label>

                                        <textarea
                                            id="claimEvidence"
                                            value={claimEvidence}
                                            onChange={(event) =>
                                                setClaimEvidence(event.target.value)
                                            }
                                            rows={5}
                                            maxLength={1500}
                                            placeholder="Describe identifying details, unique marks, contents, purchase details, or other information that can help prove ownership."
                                            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            required
                                            minLength={10}
                                        />

                                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                                            <span>
                                                Do not share passwords or other sensitive information.
                                            </span>
                                            <span>
                                                {claimEvidence.length}/1500
                                            </span>
                                        </div>

                                        {claimError && (
                                            <p className="mt-3 text-sm text-red-600">
                                                {claimError}
                                            </p>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <button
                                                type="submit"
                                                disabled={submittingClaim}
                                                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {submittingClaim
                                                    ? "Submitting Claim..."
                                                    : "Submit New Claim"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowNewClaimForm(false)
                                                }
                                                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : !currentClaim ? (
                                    <form
                                        onSubmit={handleClaimSubmit}
                                        className="mt-5"
                                    >
                                        <label
                                            htmlFor="claimEvidence"
                                            className="block text-sm font-medium text-slate-700"
                                        >
                                            Explain why this item belongs to you
                                        </label>

                                        <textarea
                                            id="claimEvidence"
                                            value={claimEvidence}
                                            onChange={(event) =>
                                                setClaimEvidence(event.target.value)
                                            }
                                            rows={5}
                                            maxLength={1500}
                                            placeholder="Describe identifying details, unique marks, contents, purchase details, or other information that can help prove ownership."
                                            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            required
                                            minLength={10}
                                        />

                                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                                            <span>
                                                Do not share passwords or other sensitive information.
                                            </span>
                                            <span>
                                                {claimEvidence.length}/1500
                                            </span>
                                        </div>

                                        {claimError && (
                                            <p className="mt-3 text-sm text-red-600">
                                                {claimError}
                                            </p>
                                        )}

                                        {claimMessage && (
                                            <p className="mt-3 text-sm text-green-700">
                                                {claimMessage}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={submittingClaim}
                                            className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {submittingClaim
                                                ? "Submitting Claim..."
                                                : "Submit Ownership Claim"}
                                        </button>
                                    </form>
                                ) : null}

                                {claimError && !currentClaim && (
                                    <p className="mt-3 text-sm text-red-600">
                                        {claimError}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Finder Claim Management */}
                {isOwner && report.type === "found" && (
                    <section className="mt-12">
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-slate-900">
                                Ownership Claims
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Review ownership claims submitted for your found item.
                                Only you can view the private evidence.
                            </p>
                        </div>

                        {claimsLoading && (
                            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                                <p className="text-sm text-slate-500">
                                    Loading ownership claims...
                                </p>
                            </div>
                        )}

                        {claimsError && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                                <p className="text-sm text-red-700">
                                    {claimsError}
                                </p>
                            </div>
                        )}

                        {!claimsLoading &&
                            claims.length === 0 &&
                            !claimsError && (
                                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                                    <h3 className="font-semibold text-slate-800">
                                        No ownership claims yet
                                    </h3>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Claims submitted by users will appear here.
                                    </p>
                                </div>
                            )}

                        {!claimsLoading && claims.length > 0 && (
                            <div className="space-y-5">
                                {claims.map((claim) => (
                                    <div
                                        key={claim._id}
                                        className="rounded-xl border border-slate-200 bg-white p-5"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {claim.claimantId?.name ||
                                                        "Community Member"}
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Submitted{" "}
                                                    {claim.createdAt
                                                        ? new Date(
                                                            claim.createdAt
                                                        ).toLocaleString()
                                                        : "date unavailable"}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                                    claim.status === "pending"
                                                        ? "bg-amber-50 text-amber-700"
                                                        : claim.status === "accepted"
                                                            ? "bg-blue-50 text-blue-700"
                                                            : claim.status === "completed"
                                                                ? "bg-green-50 text-green-700"
                                                                : "bg-red-50 text-red-700"
                                                }`}
                                            >
                                                {claim.status}
                                            </span>
                                        </div>

                                        <div className="mt-5 rounded-lg bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Ownership Evidence
                                            </p>

                                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                                                {claim.evidence ||
                                                    "Evidence is not available."}
                                            </p>
                                        </div>

                                        {/* Pending claim actions */}
                                        {claim.status === "pending" && (
                                            <div className="mt-5 flex flex-wrap gap-3">
                                                <button
                                                    onClick={() =>
                                                        handleClaimDecision(
                                                            claim._id,
                                                            "accept"
                                                        )
                                                    }
                                                    disabled={
                                                        processingClaim === claim._id
                                                    }
                                                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {processingClaim === claim._id
                                                        ? "Processing..."
                                                        : "Accept Claim"}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleClaimDecision(
                                                            claim._id,
                                                            "reject"
                                                        )
                                                    }
                                                    disabled={
                                                        processingClaim === claim._id
                                                    }
                                                    className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Reject Claim
                                                </button>
                                            </div>
                                        )}

                                        {/* Accepted claim: finder verifies handover */}
                                        {claim.status === "accepted" && (
                                            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                <h4 className="font-semibold text-blue-900">
                                                    Complete Item Handover
                                                </h4>

                                                <p className="mt-2 text-sm leading-6 text-blue-800">
                                                    Ask the claimant to generate
                                                    their handover code. Enter the
                                                    six-digit code here after
                                                    physically handing over the item.
                                                </p>

                                                <label
                                                    htmlFor={`code-${claim._id}`}
                                                    className="mt-4 block text-sm font-medium text-slate-700"
                                                >
                                                    Six-digit handover code
                                                </label>

                                                <input
                                                    id={`code-${claim._id}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="off"
                                                    maxLength={6}
                                                    value={
                                                        verificationCodes[claim._id] || ""
                                                    }
                                                    onChange={(event) =>
                                                        handleVerificationInput(
                                                            claim._id,
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Enter 6-digit code"
                                                    className="mt-2 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />

                                                <button
                                                    onClick={() =>
                                                        handleVerifyHandover(claim._id)
                                                    }
                                                    disabled={
                                                        verifyingClaim === claim._id
                                                    }
                                                    className="mt-4 block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {verifyingClaim === claim._id
                                                        ? "Verifying..."
                                                        : "Verify Handover"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {verificationError && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                                <p className="text-sm text-red-700">
                                    {verificationError}
                                </p>
                            </div>
                        )}

                        {verificationMessage && (
                            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                                <p className="text-sm text-green-700">
                                    {verificationMessage}
                                </p>
                            </div>
                        )}
                    </section>
                )}

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

                        {matchesLoading && (
                            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                                <p className="text-sm text-slate-500">
                                    Finding potential matches...
                                </p>
                            </div>
                        )}

                        {!matchesLoading && matchesError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                                <p className="text-sm text-red-700">
                                    {matchesError}
                                </p>
                            </div>
                        )}

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
                                                {match.report.images?.[0]?.url && (
                                                    <img
                                                        src={match.report.images[0].url}
                                                        alt={match.report.title}
                                                        className="h-36 w-full rounded-lg object-cover sm:w-36"
                                                    />
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                                match.report.type === "lost"
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
