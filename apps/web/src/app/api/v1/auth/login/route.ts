import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  INTERNAL_API_BASE_URL,
  SESSION_COOKIE_NAME,
  DEVICE_ID_COOKIE_NAME,
  ANTIFORGERY_COOKIE_NAME,
} from "@/lib/apiServerConfig";
import { encryptSession, generateAntiforgeryToken } from "@/lib/serverCrypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check or generate device ID (matches pure .NET wt_device_id format)
    let deviceId = request.cookies.get(DEVICE_ID_COOKIE_NAME)?.value;
    if (!deviceId || deviceId.length < 16) {
      deviceId = crypto.randomBytes(16).toString("hex");
    }

    const backendRes = await fetch(`${INTERNAL_API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: data.message || "Invalid credentials." },
        { status: backendRes.status }
      );
    }

    const { accessToken, profile } = data;

    // Encrypt session payload into ASP.NET DPAPI style ciphertext (starts with CfDJ8...)
    const encryptedCookie = encryptSession({
      token: accessToken,
      deviceId,
      userId: profile.userId,
      issuedAt: Date.now(),
    });

    // Generate Anti-CSRF Token
    const antiforgeryToken = generateAntiforgeryToken(deviceId);

    const response = NextResponse.json({
      success: true,
      profile,
      antiforgeryToken,
    });

    const isProd = process.env.NODE_ENV === "production";

    // 1. Session Cookie (Encrypted AES-256, HttpOnly)
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encryptedCookie,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // 2. Device Fingerprint Cookie (HttpOnly)
    response.cookies.set({
      name: DEVICE_ID_COOKIE_NAME,
      value: deviceId,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    // 3. Antiforgery Cookie
    response.cookies.set({
      name: ANTIFORGERY_COOKIE_NAME,
      value: antiforgeryToken,
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
