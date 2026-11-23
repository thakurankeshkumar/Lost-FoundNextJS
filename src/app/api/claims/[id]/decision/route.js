import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import Claim from "@/models/Claim";
import { requireUser } from "@/lib/permissions";

export async function PATCH(request, context) {
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
      !["accept", "reject"].includes(body.action) ||
      Object.keys(body).some((key) => key !== "action")
    ) {
      return NextResponse.json(
        { success: false, message: "Action must be accept or reject" },
        { status: 400 }
      );
    }

    await connectDB();

    const claim = await Claim.findOne({
      _id: id,
      finderId: auth.user._id,
      status: "pending",
    });

    if (!claim) {
      return NextResponse.json(
        { success: false, message: "Pending claim not found or access denied" },
        { status: 404 }
      );
    }

    if (body.action === "reject") {
      const rejected = await Claim.findOneAndUpdate(
        {
          _id: claim._id,
          finderId: auth.user._id,
          status: "pending",
        },
        { $set: { status: "rejected" } },
        { new: true }
      ).select("_id status");

      if (!rejected) {
        return NextResponse.json(
          { success: false, message: "Claim has already been processed" },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Claim rejected",
        claim: rejected,
      });
    }

    // Atomically reserve the report for this claim.
    const reservedReport = await Report.findOneAndUpdate(
      {
        _id: claim.reportId,
        type: "found",
        status: "active",
        acceptedClaimId: null,
      },
      { $set: { acceptedClaimId: claim._id } },
      { new: true }
    ).select("_id");

    if (!reservedReport) {
      return NextResponse.json(
        { success: false, message: "This item is no longer available for claims" },
        { status: 409 }
      );
    }

    const accepted = await Claim.findOneAndUpdate(
      {
        _id: claim._id,
        finderId: auth.user._id,
        status: "pending",
      },
      { $set: { status: "accepted" } },
      { new: true }
    ).select("_id status reportId");

    if (!accepted) {
      // Release the reservation if the claim could not be accepted.
      await Report.updateOne(
        { _id: claim.reportId, acceptedClaimId: claim._id },
        { $set: { acceptedClaimId: null } }
      );

      return NextResponse.json(
        { success: false, message: "Claim has already been processed" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Claim accepted. The claimant can now generate a handover code.",
      claim: accepted,
    });
  } catch (error) {
    console.error("Claim decision error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to process claim decision" },
      { status: 500 }
    );
  }
}
