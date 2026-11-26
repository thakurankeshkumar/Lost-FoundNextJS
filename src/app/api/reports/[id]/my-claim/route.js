import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Claim from "@/models/Claim";
import { requireUser } from "@/lib/permissions";

export async function GET(request, context) {
    try {
        const auth = await requireUser();

        if (auth.error) {
            return NextResponse.json(
                {
                    success: false,
                    message: auth.error,
                },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid report ID",
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Find only the claim submitted by the logged-in user.
        // Private evidence and handover-code fields are never returned.
        const claim = await Claim.findOne({
            reportId: id,
            claimantId: auth.user._id,
        })
            .select("_id status createdAt updatedAt")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            claim: claim
                ? {
                    _id: claim._id.toString(),
                    status: claim.status,
                    createdAt: claim.createdAt,
                    updatedAt: claim.updatedAt,
                }
                : null,
        });
    } catch (error) {
        console.error("Fetch my claim error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to retrieve your ownership claim",
            },
            { status: 500 }
        );
    }
}