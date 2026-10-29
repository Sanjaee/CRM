export const INTERNAL_API_BASE_URL =
  process.env.INTERNAL_API_URL || "http://localhost:8080";

// Exact enterprise cookie names matching WahanaTravel ASP.NET Core stack
export const SESSION_COOKIE_NAME = ".WahanaTravelB2CApps.WahanaTravel.WebAdmin";
export const DEVICE_ID_COOKIE_NAME = "wt_device_id";
export const ANTIFORGERY_COOKIE_NAME = ".AspNetCore.Antiforgery.0dewW3BTxX0";
export const ANTIFORGERY_HEADER_NAME = "RequestVerificationToken";
export const ANTIFORGERY_QUERY_NAME = "__RequestVerificationToken";
