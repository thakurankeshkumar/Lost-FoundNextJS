
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
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

    const search = searchParams.get("search")?.trim().slice(0, 80) || "";
    const status = searchParams.get("status") || "all";
    const role = searchParams.get("role") || "all";

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = 10;

    const filter = {};

    if (status !== "all") {
      if (!["active", "blocked"].includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid user status" },
          { status: 400 }
        );
      }

      filter.status = status;
    }

    if (role !== "all") {
      if (!["user", "admin"].includes(role)) {
        return NextResponse.json(
          { success: false, message: "Invalid user role" },
          { status: 400 }
        );
      }

      filter.role = role;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email role status createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch users" },
      { status: 500 }
    );
  }
}
