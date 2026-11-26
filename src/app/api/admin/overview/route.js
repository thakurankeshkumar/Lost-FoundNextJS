
import { NextResponse } from "next/server";
import User from "@/models/User";
import Report from "@/models/Report";
import Claim from "@/models/Claim";
import { requireAdmin } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalReports,
      activeReports,
      lostReports,
      foundReports,
      underReviewReports,
      pendingClaims,
      acceptedClaims,
      completedClaims,
      recentReports,
      recentClaims,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "blocked" }),

      Report.countDocuments(),
      Report.countDocuments({ status: "active" }),
      Report.countDocuments({ type: "lost" }),
      Report.countDocuments({ type: "found" }),
      Report.countDocuments({ status: "under_review" }),

      Claim.countDocuments({ status: "pending" }),
      Claim.countDocuments({ status: "accepted" }),
      Claim.countDocuments({ status: "completed" }),

      Report.find()
        .select("-privateDetails -images.publicId")
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Claim.find()
        .select("-evidence -handoverCodeHash -handoverCodeExpiresAt")
        .populate("reportId", "title type city state status")
        .populate("claimantId", "name email")
        .populate("finderId", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      statistics: {
        totalUsers,
        activeUsers,
        blockedUsers,
        totalReports,
        activeReports,
        lostReports,
        foundReports,
        underReviewReports,
        pendingClaims,
        acceptedClaims,
        completedClaims,
      },
      recentReports,
      recentClaims,
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load admin dashboard",
      },
      { status: 500 }
    );
  }
}
