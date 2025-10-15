import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, setAdminSessionCookie, verifyAdminCredentials } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
    }

    if (!verifyAdminCredentials(email, password)) {
      return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
    }

    const token = createAdminSession(email.trim().toLowerCase());
    const response = NextResponse.json({ success: true });
    setAdminSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ success: false, error: "Login failed." }, { status: 500 });
  }
}
