import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { createHash, timingSafeEqual } from "crypto";
import connectDB from "@/lib/mongodb";
import Claim from "@/models/Claim";
import Report from "@/models/Report";
import { requireUser } from "@/lib/permissions";

function hashCode(code) {
    return createHash("sha256")
        .update(`${code}:${process.env.SESSION_SECRET}`)
        .digest("hex");
}

export async function POST(request, context) {
    try {
        const auth = await requireUser();

        if (auth.error) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid claim ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        if (
            !body ||
            typeof body.code !== "string" ||
            !/^\d{6}$/.test(body.code) ||
            Object.keys(body).some((key) => key !== "code")
        ) {
            return NextResponse.json(
                { success: false, message: "Enter a valid 6-digit handover code" },
                { status: 400 }
            );
        }

        await connectDB();

        const claim = await Claim.findOne({
            _id: id,
            finderId: auth.user._id,
            status: "accepted",
        }).select("+handoverCodeHash +handoverCodeExpiresAt");

        if (!claim) {
            return NextResponse.json(
                { success: false, message: "Accepted claim not found or access denied" },
                { status: 404 }
            );
        }

        if (
            !claim.handoverCodeHash ||
            !claim.handoverCodeExpiresAt ||
            claim.handoverCodeExpiresAt.getTime() < Date.now()
        ) {
            return NextResponse.json(
                { success: false, message: "Handover code is missing or expired" },
                { status: 400 }
            );
        }

        const storedHash = Buffer.from(claim.handoverCodeHash, "hex");
        const submittedHash = Buffer.from(hashCode(body.code), "hex");

        if (
            storedHash.length !== submittedHash.length ||
            !timingSafeEqual(storedHash, submittedHash)
        ) {
            return NextResponse.json(
                { success: false, message: "Incorrect handover code" },
                { status: 400 }
            );
        }

        // Resolve the report only if this claim still owns its reservation.
        const resolvedReport = await Report.findOneAndUpdate(
            {
                _id: claim.reportId,
                status: "active",
                acceptedClaimId: claim._id,
            },
            { $set: { status: "resolved" } },
            { new: true }
        ).select("_id status");

        if (!resolvedReport) {
            return NextResponse.json(
                { success: false, message: "Report is no longer available for handover" },
                { status: 409 }
            );
        }

        const completedClaim = await Claim.findOneAndUpdate(
            {
                _id: claim._id,
                finderId: auth.user._id,
                status: "accepted",
                handoverCodeHash: claim.handoverCodeHash,
            },
            {
                $set: {
                    status: "completed",
                    verifiedAt: new Date(),
                },
                $unset: {
                    handoverCodeHash: 1,
                    handoverCodeExpiresAt: 1,
                },
            },
            { new: true }
        ).select("_id status verifiedAt");

        if (!completedClaim) {
            // Roll back report status if claim completion did not succeed.
            await Report.updateOne(
                { _id: claim.reportId, acceptedClaimId: claim._id, status: "resolved" },
                { $set: { status: "active" } }
            );

            return NextResponse.json(
                { success: false, message: "Unable to complete handover" },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Handover verified. Report marked as resolved.",
            claim: completedClaim,
            report: resolvedReport,
        });
    } catch (error) {
        console.error("Handover verification error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to verify handover" },
            { status: 500 }
        );
    }
}
