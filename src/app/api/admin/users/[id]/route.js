
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/permissions";

export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.enum(["block", "unblock"]),
});

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
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = actionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid user action" },
        { status: 400 }
      );
    }

    const { action } = validation.data;

    // Prevent an admin from modifying their own account.
    if (
      action === "block" &&
      String(auth.user._id) === String(id)
    ) {
      return NextResponse.json(
        { success: false, message: "You cannot block your own account" },
        { status: 403 }
      );
    }

    await connectDB();

    const transition = {
      block: {
        from: "active",
        to: "blocked",
      },
      unblock: {
        from: "blocked",
        to: "active",
      },
    }[action];

    // Only normal user accounts can be changed.
    const user = await User.findOneAndUpdate(
      {
        _id: id,
        role: "user",
        status: transition.from,
      },
      {
        $set: { status: transition.to },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("name email role status createdAt")
      .lean();

    if (!user) {
      const existingUser = await User.findById(id)
        .select("role status")
        .lean();

      if (!existingUser) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      if (existingUser.role === "admin") {
        return NextResponse.json(
          { success: false, message: "Admin accounts cannot be modified here" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: `User is already ${existingUser.status}`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${transition.to} successfully`,
      user,
    });
  } catch (error) {
    console.error("Admin user update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update user" },
      { status: 500 }
    );
  }
}
