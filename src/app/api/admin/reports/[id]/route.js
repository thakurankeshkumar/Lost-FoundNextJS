
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import { requireAdmin } from "@/lib/permissions";

export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.enum(["review", "remove", "restore"]),
});

// PATCH: Moderate a report.
export async function PATCH(request, context) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const params = await context.params;
    const id = params.id;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid report ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = actionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Invalid moderation action" },
        { status: 400 }
      );
    }

    const transitions = {
      review: {
        from: ["active"],
        to: "under_review",
      },
      remove: {
        from: ["active", "under_review"],
        to: "removed",
      },
      restore: {
        from: ["removed", "under_review"],
        to: "active",
      },
    };

    const transition = transitions[result.data.action];

    await connectDB();

    const report = await Report.findOneAndUpdate(
      {
        _id: id,
        status: { $in: transition.from },
        acceptedClaimId: null,
      },
      {
        $set: { status: transition.to },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-privateDetails -images.publicId")
      .lean();

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Report not found or cannot be moderated. Resolved reports and reports with an accepted ownership claim cannot be changed.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Report status changed to ${transition.to.replace("_", " ")}`,
      report,
    });
  } catch (error) {
    console.error("Admin report moderation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to moderate report" },
      { status: 500 }
    );
  }
}
