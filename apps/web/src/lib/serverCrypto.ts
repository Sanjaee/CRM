import crypto from "crypto";

const SECRET_SEED =
  process.env.SESSION_SECRET ||
  process.env.JWT_KEY ||
  "WahanaTravelSuperSecureEnterpriseJwtSecretKey2026!!";

// Derive 32-byte key for AES-256
const ENCRYPTION_KEY = crypto.createHash("sha256").update(SECRET_SEED).digest();

// ASP.NET Core Data Protection magic header (produces "CfDJ8..." in Base64)
const DPAPI_HEADER = Buffer.from([0x09, 0xf0, 0xc9, 0xf0]);

export interface SessionPayload {
  token: string;
  deviceId: string;
  userId?: string;
  issuedAt: number;
}

/**
 * Encrypts a session payload using AES-256-GCM.
 * Packed with ASP.NET Data Protection magic bytes so it outputs a secure "CfDJ8..." ciphertext.
 */
export function encryptSession(payload: SessionPayload): string {
  const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

  const jsonString = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(jsonString, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  // Format: [DPAPI_HEADER (4B)] + [IV (12B)] + [AUTH_TAG (16B)] + [ENCRYPTED DATA]
  const packed = Buffer.concat([DPAPI_HEADER, iv, authTag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypts and verifies the ciphertext.
 * Returns null if the data has been tampered with or is invalid.
 */
export function decryptSession(cookieValue: string): SessionPayload | null {
  try {
    if (!cookieValue) return null;

    const buffer = Buffer.from(cookieValue, "base64");
    if (buffer.length < 36) return null; // 4 + 12 + 16 + at least 4 bytes payload

    // Verify magic header
    if (
      buffer[0] !== 0x09 ||
      buffer[1] !== 0xf0 ||
      buffer[2] !== 0xc9 ||
      buffer[3] !== 0xf0
    ) {
      return null;
    }

    const iv = buffer.subarray(4, 16);
    const authTag = buffer.subarray(16, 32);
    const encryptedData = buffer.subarray(32);

    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Generates an Anti-CSRF verification token with timestamp and signature.
 */
export function generateAntiforgeryToken(sessionId: string): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", ENCRYPTION_KEY)
    .update(`${sessionId}:${timestamp}`)
    .digest("hex");
  const raw = Buffer.from(`${timestamp}:${signature}:${sessionId}`).toString("base64");
  // Pack with magic header so it also looks like ASP.NET Core Antiforgery
  return Buffer.concat([DPAPI_HEADER, Buffer.from(raw)]).toString("base64");
}

/**
 * Validates the Anti-CSRF verification token.
 */
export function validateAntiforgeryToken(token: string, expectedSessionId: string): boolean {
  try {
    if (!token) return false;
    const buffer = Buffer.from(token, "base64");
    if (buffer.length <= 4) return false;

    // Slicing magic header
    const rawPayload = buffer.subarray(4).toString("utf8");
    const [timestamp, signature, sessionId] = Buffer.from(rawPayload, "base64")
      .toString("utf8")
      .split(":");

    if (!timestamp || !signature || !sessionId) return false;
    if (sessionId !== expectedSessionId) return false;

    // Reject tokens older than 24 hours
    const age = Date.now() - parseInt(timestamp, 10);
    if (isNaN(age) || age > 24 * 60 * 60 * 1000) return false;

    const expectedSig = crypto
      .createHmac("sha256", ENCRYPTION_KEY)
      .update(`${sessionId}:${timestamp}`)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}
