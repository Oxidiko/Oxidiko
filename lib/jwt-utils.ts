// JWT utilities for token verification and decoding
//
// SECURITY NOTES:
//   - decodeJWT / verifyJWT are CLIENT-SIDE ONLY. They do NOT verify the
//     cryptographic signature. Use them only for UI display.
//   - For server-side authorization, always use verifyAdminJWT (server only)
//     which calls jsonwebtoken.verify() with the real secret.

// Base64 URL decode (UTF-8 safe)
const base64UrlDecode = (str: string): string => {
  str += "=".repeat((4 - (str.length % 4)) % 4)
  const binary = atob(str.replace(/-/g, "+").replace(/_/g, "/"))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// Validate JWT structure and claims (without signature verification)
const validateJWTStructure = (token: string): { header: any; payload: any; signature: string } => {
  const parts = token.split(".")
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format: must have 3 parts")
  }
  const [encodedHeader, encodedPayload, signature] = parts
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Invalid JWT format: empty parts not allowed")
  }
  let header: any
  let payload: any
  try {
    header = JSON.parse(base64UrlDecode(encodedHeader))
  } catch (error) {
    throw new Error("Invalid JWT header: malformed JSON")
  }
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload))
  } catch (error) {
    throw new Error("Invalid JWT payload: malformed JSON")
  }
  return { header, payload, signature }
}

// CLIENT ONLY: decode without signature verification — for display purposes only.
export const decodeJWT = (token: string): { header: any; payload: any } => {
  const { header, payload } = validateJWTStructure(token)
  return { header, payload }
}

// CLIENT ONLY: check exp/nbf/iat claims — no signature check.
// NEVER use this function to make authorization decisions on the server.
export const verifyJWT = async (token: string): Promise<any> => {
  const { payload } = validateJWTStructure(token)
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp <= now) throw new Error("Token expired")
  if (payload.nbf && payload.nbf > now + 60) throw new Error("Token not yet valid")
  if (payload.iat && payload.iat > now + 60) throw new Error("Token issued in the future")
  return payload
}

// SERVER ONLY: verify signature + claims using jsonwebtoken.
// Import this only in server-side code (API routes / middleware).
// Never call this from client components.
export const verifyAdminJWT = async (token: string): Promise<any> => {
  // Dynamic import keeps jsonwebtoken out of the client bundle.
  const jwt = (await import("jsonwebtoken")).default
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET environment variable is not configured")
  }
  // jwt.verify throws if the signature is invalid or the token is expired.
  const payload = jwt.verify(token, secret, { algorithms: ["HS256"] })
  return payload
}
