import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  DEVICE_ID_COOKIE_NAME,
} from "@/lib/apiServerConfig";
import { decryptSession } from "@/lib/serverCrypto";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const deviceId = request.cookies.get(DEVICE_ID_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = decryptSession(sessionCookie);
  if (!session) {
    return NextResponse.json({ authenticated: false, message: "Invalid session." }, { status: 401 });
  }

  // Verify device fingerprint binding
  if (session.deviceId && deviceId && session.deviceId !== deviceId) {
    return NextResponse.json({ authenticated: false, message: "Device mismatch." }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, userId: session.userId });
}
