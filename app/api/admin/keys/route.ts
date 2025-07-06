import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
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
