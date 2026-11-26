import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomInt, createHash } from "crypto";
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

        await connectDB();

        const claim = await Claim.findOne({
            _id: id,
            claimantId: auth.user._id,
            status: "accepted",
        }).select("+handoverCodeHash +handoverCodeExpiresAt");

        if (!claim) {
            return NextResponse.json(
                { success: false, message: "Accepted claim not found or access denied" },
                { status: 404 }
            );
        }

        const report = await Report.findOne({
            _id: claim.reportId,
            acceptedClaimId: claim._id,
            status: "active",
        }).select("_id");

        if (!report) {
            return NextResponse.json(
                { success: false, message: "This handover is no longer active" },
                { status: 409 }
            );
        }

        if (
            claim.handoverCodeHash &&
            claim.handoverCodeExpiresAt &&
            claim.handoverCodeExpiresAt.getTime() > Date.now()
        ) {
            return NextResponse.json(
                { success: false, message: "An active handover code already exists" },
                { status: 409 }
            );
        }

        const code = String(randomInt(100000, 1000000));
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const updatedClaim = await Claim.findOneAndUpdate(
            {
                _id: claim._id,
                claimantId: auth.user._id,
                status: "accepted",
                $or: [
                    { handoverCodeHash: null },
                    { handoverCodeExpiresAt: { $lte: new Date() } }
                ]
            },
            {
                $set: {
                    handoverCodeHash: hashCode(code),
                    handoverCodeExpiresAt: expiresAt,
                },
            },
            { new: true }
        ).select("_id");

        if (!updatedClaim) {
            return NextResponse.json(
                { success: false, message: "A handover code already exists" },
                { status: 409 }
            );
        }

        // This is the only response that reveals the plaintext code.
        // TheCodeDoesNotExist = undefined;

        return NextResponse.json({
            success: true,
            message: "Handover code generated. Share it with the finder at the handover.",
            handoverCode: code,
            expiresAt,
        });
    } catch (error) {
        console.error("Handover code error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to generate handover code" },
            { status: 500 }
        );
    }
}
