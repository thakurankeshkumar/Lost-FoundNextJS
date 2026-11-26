
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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET: View and filter all reports for admin moderation.
export async function GET(request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "all";
    const search = searchParams.get("search")?.trim().slice(0, 80) || "";

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = 10;

    const filter = {};

    if (status !== "all") {
      const allowedStatuses = [
        "active",
        "resolved",
        "removed",
        "under_review",
      ];

      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid report status" },
          { status: 400 }
        );
      }

      filter.status = status;
    }

    if (type !== "all") {
      if (!["lost", "found"].includes(type)) {
        return NextResponse.json(
          { success: false, message: "Invalid report type" },
          { status: 400 }
        );
      }

      filter.type = type;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { city: { $regex: safeSearch, $options: "i" } },
        { state: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .select("-privateDetails -images.publicId")
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Report.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin reports fetch error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch reports" },
      { status: 500 }
    );
  }
}

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

    const { action } = result.data;

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

    const transition = transitions[action];

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
