import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyJWT } from "@/lib/jwt-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const token = authHeader.replace("Bearer ", "").trim()
    let payload
    try {
      payload = await verifyJWT(token)
    } catch (err: any) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 })
    }

    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Check if API key exists
    const existingResults = await sql`
      SELECT id FROM api_keys WHERE api_key = ${apiKey} LIMIT 1
    `

    if (existingResults.length === 0) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    // Activate the API key
    await sql`
      UPDATE api_keys 
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE api_key = ${apiKey}
    `

    return NextResponse.json({ success: true, message: "API key activated successfully" })
  } catch (error) {
    console.error("Admin activate route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
