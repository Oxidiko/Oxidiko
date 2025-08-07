
import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyJWT } from "@/lib/jwt-utils"


const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
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

    const results = await sql`
      SELECT 
        company_name,
        company_email,
        api_key,
        quota,
        plan_id,
        is_active,
        subscription_id,
        created_at,
        updated_at
      FROM api_keys 
      ORDER BY created_at DESC
    `

    const data = results.map((row: any) => ({
      companyName: row.company_name,
      companyEmail: row.company_email,
      apiKey: row.api_key,
      quota: row.quota,
      planId: row.plan_id,
      isActive: row.is_active,
      subscriptionId: row.subscription_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Admin keys route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
