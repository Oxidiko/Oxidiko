import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import crypto from "crypto"

// Fetch RSA keys from environment variables (single-line, \n replaced with real newlines)
const RSA_PRIVATE_KEY = (process.env.RSA_PRIVATE_KEY || "").replace(/\\n/g, "\n")

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    let payload: any

    // Check if this is encrypted data (new siteKey format)
    if (body.encrypted && body.iv) {
      // For encrypted data, we create a JWT with the encrypted payload
      payload = {
        encrypted: body.encrypted,
        iv: body.iv,
        type: "encrypted",
      }
    } else {
      // For plain data (fallback or old format)
      payload = { ...body }
    }

    // Add standard claims
    const now = Math.floor(Date.now() / 1000)
    const finalPayload = {
      ...payload,
      iat: now,
      exp: now + 15 * 60, // 15 minutes expiry
      nbf: now,
      jti: crypto.randomUUID(),
    }

    // Validate required claims for plain data
    if (!body.encrypted && !finalPayload.sub) {
      return NextResponse.json({ error: "Subject (sub) is required for plain data" }, { status: 400 })
    }

   if (!RSA_PRIVATE_KEY || RSA_PRIVATE_KEY.length < 100) {
     console.error("RSA_PRIVATE_KEY is missing or invalid")
     return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
   }

    // Sign JWT using jsonwebtoken (Node.js only)
    const token = jwt.sign(finalPayload, RSA_PRIVATE_KEY, { algorithm: "RS256" })
    return NextResponse.json({ token })
  } catch (err: any) {
    console.error("JWT generation error:", err)
    return NextResponse.json({ error: err.message || "Failed to generate JWT" }, { status: 500 })
  }
}
