import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { createSessionToken, getSessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(72),
});

export async function POST(request) {
    try {
        const body = await request.json();

        const result = schema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, message: "Invalid email or password" },
                { status: 400 }
            );
        }

        const { email, password } = result.data;

        await connectDB();
        const user = await User.findOne({
            email: email.toLowerCase(),
        }).select("+passwordHash");

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return NextResponse.json(
                { success: false, message: "Invalid email or password" },
                { status: 401 }
            );
        }

        if (user.status !== "active") {
            return NextResponse.json(
                { success: false, message: "Account is unavailable" },
                { status: 403 }
            );
        }

        const token = await createSessionToken(user._id);
        const response = NextResponse.json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        response.cookies.set("session", token, getSessionCookieOptions(60 * 60 * 24 * 7));

        return response;
    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            { success: false, message: "Login failed" },
            { status: 500 }
        );
    }
}
