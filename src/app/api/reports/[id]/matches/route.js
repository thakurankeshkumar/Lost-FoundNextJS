import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import { requireUser } from "@/lib/permissions";
import { calculateMatch } from "@/lib/matching";

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

    // Only the report owner can view its potential matches.
    const report = await Report.findOne({
      _id: id,
      userId: auth.user._id,
      status: "active",
    }).lean();

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found or access denied" },
        { status: 404 }
      );
    }

    const oppositeType = report.type === "lost" ? "found" : "lost";

    // Compare against active reports of the opposite type.
    // Limit candidates to keep the matching request manageable.
    const candidates = await Report.find({
      type: oppositeType,
      status: "active",
      userId: { $ne: report.userId },
      _id: { $ne: report._id },
    })
      .select("-privateDetails -images.publicId")
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const matches = candidates
      .map((candidate) => {
        const result = calculateMatch(report, candidate);

        return {
          report: candidate,
          matchScore: result.score,
          matchReasons: result.reasons,
        };
      })
      .filter((item) => item.matchScore >= 35)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      totalMatches: matches.length,
      matches,
    });
  } catch (error) {
    console.error("Matching API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to find matching reports" },
      { status: 500 }
    );
  }
}
