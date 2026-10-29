import { NextRequest, NextResponse } from "next/server";
import {
  INTERNAL_API_BASE_URL,
  SESSION_COOKIE_NAME,
  DEVICE_ID_COOKIE_NAME,
  ANTIFORGERY_COOKIE_NAME,
  ANTIFORGERY_HEADER_NAME,
  ANTIFORGERY_QUERY_NAME,
} from "@/lib/apiServerConfig";
import { decryptSession, validateAntiforgeryToken } from "@/lib/serverCrypto";

async function proxyHandler(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    const slug = params.slug || [];
    const url = new URL(request.url);
    const method = request.method;

    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const deviceId = request.cookies.get(DEVICE_ID_COOKIE_NAME)?.value;

    let bearerToken: string | null = null;

    if (sessionCookie) {
      const session = decryptSession(sessionCookie);

      if (!session) {
        return NextResponse.json(
          { message: "Invalid or tampered session cookie." },
          { status: 401 }
        );
      }

      // Verify device fingerprint binding (anti session hijacking)
      if (session.deviceId && deviceId && session.deviceId !== deviceId) {
        return NextResponse.json(
          { message: "Device session mismatch detected." },
          { status: 401 }
        );
      }

      // CSRF Protection for state mutation methods
      if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
        const csrfFromHeader = request.headers.get(ANTIFORGERY_HEADER_NAME);
        const csrfFromQuery = url.searchParams.get(ANTIFORGERY_QUERY_NAME);
        const csrfCookie = request.cookies.get(ANTIFORGERY_COOKIE_NAME)?.value;
        const incomingCsrf = csrfFromHeader || csrfFromQuery || csrfCookie;

        if (incomingCsrf && deviceId) {
          const isValidCsrf = validateAntiforgeryToken(incomingCsrf, deviceId);
          if (!isValidCsrf) {
            return NextResponse.json(
              { message: "Anti-forgery token validation failed." },
              { status: 403 }
            );
          }
        }
      }

      bearerToken = session.token;
    }

    const targetUrl = `${INTERNAL_API_BASE_URL}/api/v1/${slug.join("/")}${url.search}`;

    const headers = new Headers();
    const incomingContentType = request.headers.get("content-type");
    if (incomingContentType) {
      headers.set("content-type", incomingContentType);
    } else {
      headers.set("content-type", "application/json");
    }

    // Attach raw Bearer JWT internally server-to-server
    if (bearerToken) {
      headers.set("Authorization", `Bearer ${bearerToken}`);
    }

    let body: BodyInit | null = null;
    if (method !== "GET" && method !== "HEAD") {
      try {
        body = await request.text();
      } catch {
        body = null;
      }
    }

    const backendRes = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const responseBody = await backendRes.text();
    const responseHeaders = new Headers();
    const contentType = backendRes.headers.get("content-type");
    if (contentType) {
      responseHeaders.set("content-type", contentType);
    }

    return new NextResponse(responseBody, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "BFF Proxy Error: Failed to reach backend API.", detail: error?.message },
      { status: 502 }
    );
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
