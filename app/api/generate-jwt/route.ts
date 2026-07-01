import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { neon } from "@neondatabase/serverless"

const RSA_PRIVATE_KEY = (process.env.RSA_PRIVATE_KEY || "").replace(/\\n/g, "\n")
const sql = neon(process.env.DATABASE_URL!)

// HIGH-3 FIX: Validate the API key server-side before signing anything.
// This closes the "sign arbitrary payload" attack: only callers with a legitimate,
// active API key registered in the database can receive a signed JWT.
async function validateApiKey(apiKey: string): Promise<{ valid: boolean; reason?: string }> {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return { valid: false, reason: "missing" }
  }

  const results = await sql`
    SELECT is_active, quota FROM api_keys WHERE api_key = ${apiKey} LIMIT 1
  `

  if (results.length === 0) {
    return { valid: false, reason: "not_found" }
  }

  const keyRow = results[0]

  if (!keyRow.is_active) {
    return { valid: false, reason: "inactive" }
  }

  const [used, total] = (keyRow.quota as string).split("/").map(Number)
  if (used >= total) {
    return { valid: false, reason: "quota_exceeded" }
  }

  return { valid: true }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // HIGH-3 FIX: Require a valid API key in every JWT signing request.
    // The api_key is stripped from the signed payload below so it doesn't leak into the token.
    const { api_key: apiKey, ...restBody } = body
    const keyCheck = await validateApiKey(apiKey)
    if (!keyCheck.valid) {
      console.warn("JWT signing rejected: API key check failed:", keyCheck.reason)
      return NextResponse.json(
        { error: `Unauthorized: ${keyCheck.reason ?? "invalid API key"}` },
        { status: keyCheck.reason === "quota_exceeded" ? 429 : 401 }
      )
    }

    // Build the payload from the remaining body fields (api_key excluded)
    const payload = {
      ...restBody,
      type: restBody.encrypted ? "encrypted" : "plain",
    }

    // Validate required claims
    if (!restBody.encrypted && !payload.sub) {
      return NextResponse.json({ error: "Subject (sub) is required for plain data" }, { status: 400 })
    }

    if (!RSA_PRIVATE_KEY || RSA_PRIVATE_KEY.length < 100) {
      console.error("RSA_PRIVATE_KEY is missing or invalid")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const now = Math.floor(Date.now() / 1000)
    const finalPayload = {
      ...payload,
      iat: now,
      exp: now + 15 * 60, // 15 minutes expiry
      nbf: now,
      jti: crypto.randomUUID(),
    }

    const token = jwt.sign(finalPayload, RSA_PRIVATE_KEY, { algorithm: "RS256" })
    return NextResponse.json({ token })
  } catch (err: any) {
    console.error("JWT generation error:", err)
    return NextResponse.json({ error: err.message || "Failed to generate JWT" }, { status: 500 })
  }
}
