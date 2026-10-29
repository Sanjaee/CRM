import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  ANTIFORGERY_COOKIE_NAME,
} from "@/lib/apiServerConfig";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(ANTIFORGERY_COOKIE_NAME);
  // Note: we can keep wt_device_id so future sessions retain device fingerprint
  return response;
}
