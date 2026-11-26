
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import { requireUser } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireUser();

    if (auth.error) {
      return NextResponse.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    await connectDB();

    const userId = auth.user._id;

    const [reports, total, lost, found] = await Promise.all([
      Report.find({ userId })
        .select("-privateDetails -images.publicId")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Report.countDocuments({ userId }),

      Report.countDocuments({ userId, type: "lost" }),

      Report.countDocuments({ userId, type: "found" }),
    ]);

    return NextResponse.json({
      success: true,
      reports,
      statistics: {
        total,
        lost,
        found,
      },
    });
  } catch (error) {
    console.error("My reports error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch your reports" },
      { status: 500 }
    );
  }
}
