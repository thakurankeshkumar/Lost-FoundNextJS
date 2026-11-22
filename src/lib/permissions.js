import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { verifySessionToken } from "@/lib/auth";

export async function requireUser() {
    const cookieStore = await cookies();

    const token = cookieStore.get("session")?.value;
    if (!token) {
        return { error: "Unauthorized", status: 401 };
    }

    const payload = await verifySessionToken(token);
    if (!payload?.sub) {
        return { error: "Invalid session", status: 401 };
    }

    await connectDB();
    const user = await User.findById(payload.sub).select("name email role status");

    if (!user || user.status !== "active") {
        return { error: "Account unavailable", status: 401 };
    }
    return { user };
}

export async function requireAdmin() {
    const result = await requireUser();

    if (result.error) return result;

    if (result.user.role !== "admin") {
        return { error: "Forbidden", status: 403 };
    }

    return result;
}
