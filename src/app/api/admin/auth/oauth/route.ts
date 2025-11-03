import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, setAdminSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required for admin OAuth." },
        { status: 400 }
      );
    }

    const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!configuredAdminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin email is not configured. Contact support." },
        { status: 500 }
      );
    }

    if (email !== configuredAdminEmail) {
      return NextResponse.json(
        { success: false, error: "This Google account is not authorised for admin access." },
        { status: 403 }
      );
    }

    const token = createAdminSession(email);
    const response = NextResponse.json({ success: true });
    setAdminSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Admin OAuth session creation failed", error);
    return NextResponse.json(
      { success: false, error: "Failed to establish admin session." },
      { status: 500 }
    );
  }
}
