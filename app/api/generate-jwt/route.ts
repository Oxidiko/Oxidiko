import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Fetch RSA keys from environment variables (single-line, \n replaced with real newlines)
const RSA_PRIVATE_KEY = (process.env.RSA_PRIVATE_KEY || "").replace(/\\n/g, "\n")

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    
    // Add standard claims
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      ...body,
      iat: now,
      exp: now + 15 * 60, // 15 minutes expiry
      nbf: now,
      jti: crypto.randomUUID(),
    }
    
    // Validate required claims
    if (!payload.sub) {
      return NextResponse.json({ error: "Subject (sub) is required" }, { status: 400 })
    }
    
    // Sign JWT using jsonwebtoken (Node.js only)
    const token = jwt.sign(payload, RSA_PRIVATE_KEY, { algorithm: "RS256" })
    return NextResponse.json({ token })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate JWT" }, { status: 500 })
  }
}
