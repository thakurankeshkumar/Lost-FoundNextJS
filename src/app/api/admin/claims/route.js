
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Claim from "@/models/Claim";
import User from "@/models/User";
import Report from "@/models/Report";
import { requireAdmin } from "@/lib/permissions";

export const runtime = "nodejs";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    const search = searchParams.get("search")?.trim().slice(0, 80) || "";

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = 10;

    const filter = {};

    if (status !== "all") {
      const allowedStatuses = [
        "pending",
        "accepted",
        "rejected",
        "completed",
      ];

      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid claim status" },
          { status: 400 }
        );
      }

      filter.status = status;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      const [matchingUsers, matchingReports] = await Promise.all([
        User.find({
          $or: [
            { name: { $regex: safeSearch, $options: "i" } },
            { email: { $regex: safeSearch, $options: "i" } },
          ],
        }).select("_id").lean(),

        Report.find({
          $or: [
            { title: { $regex: safeSearch, $options: "i" } },
            { city: { $regex: safeSearch, $options: "i" } },
            { state: { $regex: safeSearch, $options: "i" } },
          ],
        }).select("_id").lean(),
      ]);

      const userIds = matchingUsers.map((user) => user._id);
      const reportIds = matchingReports.map((report) => report._id);

      if (userIds.length === 0 && reportIds.length === 0) {
        return NextResponse.json({
          success: true,
          claims: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      filter.$or = [
        { claimantId: { $in: userIds } },
        { finderId: { $in: userIds } },
        { reportId: { $in: reportIds } },
      ];
    }

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .select(
          "reportId claimantId finderId status verifiedAt createdAt updatedAt"
        )
        .populate("reportId", "title type category city state status")
        .populate("claimantId", "name email")
        .populate("finderId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Claim.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin claims fetch error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch claims" },
      { status: 500 }
    );
  }
}
