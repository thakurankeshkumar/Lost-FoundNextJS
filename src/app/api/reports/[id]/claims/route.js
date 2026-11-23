import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import Claim from "@/models/Claim";
import { requireUser } from "@/lib/permissions";

const claimSchema = z.object({
  evidence: z.string().trim().min(10).max(1500),
}).strict();

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
        { success: false, message: "Invalid report ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = claimSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid claim details",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const report = await Report.findOne({
      _id: id,
      type: "found",
      status: "active",
      acceptedClaimId: null,
    }).select("userId");

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Found report is unavailable for claims" },
        { status: 404 }
      );
    }

    if (report.userId.toString() === auth.user._id.toString()) {
      return NextResponse.json(
        { success: false, message: "You cannot claim your own found report" },
        { status: 403 }
      );
    }

    const existingClaim = await Claim.findOne({
      reportId: report._id,
      claimantId: auth.user._id,
      status: { $in: ["pending", "accepted", "completed"] },
    });

    if (existingClaim) {
      return NextResponse.json(
        { success: false, message: "You already have a claim for this report" },
        { status: 409 }
      );
    }

    const claim = await Claim.create({
      reportId: report._id,
      claimantId: auth.user._id,
      finderId: report.userId,
      evidence: validation.data.evidence,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Claim submitted successfully",
        claim: {
          _id: claim._id,
          reportId: claim.reportId,
          status: claim.status,
          createdAt: claim.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "A pending claim already exists" },
        { status: 409 }
      );
    }

    console.error("Claim creation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to submit claim" },
      { status: 500 }
    );
  }
}

// Only the finder can view claims submitted for their found report.
export async function GET(request, context) {
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
        { success: false, message: "Invalid report ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const report = await Report.findOne({
      _id: id,
      type: "found",
      userId: auth.user._id,
    }).select("_id");

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found or access denied" },
        { status: 404 }
      );
    }

    const claims = await Claim.find({ reportId: report._id })
      .select("+evidence")
      .populate("claimantId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      claims,
    });
  } catch (error) {
    console.error("Claim retrieval error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve claims" },
      { status: 500 }
    );
  }
}
