import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get total count
    const totalResult = await sql`SELECT COUNT(*) as count FROM api_keys`
    const total = Number.parseInt(totalResult[0].count)

    // Get active/inactive counts
    const activeResult = await sql`SELECT COUNT(*) as count FROM api_keys WHERE is_active = true`
    const active = Number.parseInt(activeResult[0].count)
    const inactive = total - active

    // Get counts by plan
    const planResults = await sql`
      SELECT plan_id, COUNT(*) as count 
      FROM api_keys 
      GROUP BY plan_id
    `

    const byPlan: Record<string, number> = {
      free: 0,
      starter: 0,
      premium: 0,
      elite: 0,
      payg: 0,
    }

    planResults.forEach((row: any) => {
      byPlan[row.plan_id] = Number.parseInt(row.count)
    })

    return NextResponse.json({
      total,
      active,
      inactive,
      byPlan,
    })
  } catch (error) {
    console.error("Admin stats route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
