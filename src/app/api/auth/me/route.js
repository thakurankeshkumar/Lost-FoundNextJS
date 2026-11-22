import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("session")?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Not authenticated" },
                { status: 401 }
            );
        }

        const payload = await verifySessionToken(token);

        if (!payload?.sub) {
            return NextResponse.json(
                { success: false, message: "Invalid session" },
                { status: 401 }
            );
        }

        await connectDB();

        const user = await User.findById(payload.sub).select(
            "name email role status"
        );

        if (!user || user.status !== "active") {
            return NextResponse.json(
                { success: false, message: "Account unavailable" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Current user error:", error);
        return NextResponse.json(
            { success: false, message: "Unable to verify session" },
            { status: 500 }
        );
    }
}
