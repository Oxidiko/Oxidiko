// JWT utilities for token verification and decoding only (client-safe)

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

// Only decode and optionally check exp/nbf/iat, do not verify signature on client
export const decodeJWT = (token: string): { header: any; payload: any } => {
  const { header, payload } = validateJWTStructure(token)
  return { header, payload }
}

// Optionally: verify exp/nbf/iat claims (not signature)
export const verifyJWT = async (token: string): Promise<any> => {
  const { payload } = validateJWTStructure(token)
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp <= now) throw new Error("Token expired")
  if (payload.nbf && payload.nbf > now + 60) throw new Error("Token not yet valid")
  if (payload.iat && payload.iat > now + 60) throw new Error("Token issued in the future")
  return payload
}
