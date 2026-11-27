import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set("session", "", getSessionCookieOptions(0));

    return response;
  } catch (err) {
    console.error("Unable to logout", err);
    return NextResponse.json({
      success: false,
      message: "Unable to logout"
    }, { status: 500 })
  }
}
