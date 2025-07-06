import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case "create":
        await sql`
          INSERT INTO api_keys (
            api_key, company_name, company_email, quota, plan_id, is_active, subscription_id
          ) VALUES (
            ${data.apiKey}, ${data.companyName}, ${data.companyEmail}, 
            ${data.quota}, ${data.planId}, ${data.isActive}, ${data.subscriptionId || null}
          )
          ON CONFLICT (api_key) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            company_email = EXCLUDED.company_email,
            quota = EXCLUDED.quota,
            plan_id = EXCLUDED.plan_id,
            is_active = EXCLUDED.is_active,
            subscription_id = EXCLUDED.subscription_id,
            updated_at = CURRENT_TIMESTAMP
        `
        return NextResponse.json({ success: true })

      case "validate":
        const keyResults = await sql`
          SELECT * FROM api_keys WHERE api_key = ${data.apiKey} LIMIT 1
        `

        if (keyResults.length === 0) {
          return NextResponse.json({ valid: false, canUse: false })
        }

        const keyData = keyResults[0]

        if (!keyData.is_active) {
          return NextResponse.json({
            valid: true,
            canUse: false,
            quota: keyData.quota,
            reason: "inactive",
          })
        }

        const [used, total] = keyData.quota.split("/").map(Number)
        const canUse = used < total

        return NextResponse.json({
          valid: true,
          canUse,
          quota: keyData.quota,
          keyData: {
            companyName: keyData.company_name,
            companyEmail: keyData.company_email,
            apiKey: keyData.api_key,
            quota: keyData.quota,
            planId: keyData.plan_id,
            isActive: keyData.is_active,
            subscriptionId: keyData.subscription_id,
            createdAt: keyData.created_at,
            updatedAt: keyData.updated_at,
          },
        })

      case "increment":
        const existingResults = await sql`
          SELECT quota FROM api_keys WHERE api_key = ${data.apiKey} LIMIT 1
        `

        if (existingResults.length === 0) {
          console.error("API key not found for increment:", data.apiKey)
          return NextResponse.json({ error: "API key not found" }, { status: 404 })
        }

        const [currentUsed, currentTotal] = existingResults[0].quota.split("/").map(Number)

        // Check if quota would be exceeded
        if (currentUsed >= currentTotal) {
          console.error("Quota exceeded for API key:", data.apiKey, "Current:", `${currentUsed}/${currentTotal}`)
          return NextResponse.json({ error: "Quota exceeded" }, { status: 429 })
        }

        const newUsed = currentUsed + 1
        const newQuota = `${newUsed}/${currentTotal}`

        console.log(
          "Incrementing quota for API key:",
          data.apiKey,
          "From:",
          `${currentUsed}/${currentTotal}`,
          "To:",
          newQuota,
        )

        await sql`
          UPDATE api_keys 
          SET quota = ${newQuota}, updated_at = CURRENT_TIMESTAMP
          WHERE api_key = ${data.apiKey}
        `

        return NextResponse.json({ success: true, quota: newQuota })

      case "activate":
        const activateResults = await sql`
          SELECT id FROM api_keys WHERE api_key = ${data.apiKey} LIMIT 1
        `

        if (activateResults.length === 0) {
          return NextResponse.json({ error: "API key not found" }, { status: 404 })
        }

        await sql`
          UPDATE api_keys 
          SET is_active = true, subscription_id = ${data.subscriptionId || null}, updated_at = CURRENT_TIMESTAMP
          WHERE api_key = ${data.apiKey}
        `

        return NextResponse.json({ success: true })

      case "getByEmail":
        const emailResults = await sql`
          SELECT * FROM api_keys WHERE company_email = ${data.email} LIMIT 1
        `

        if (emailResults.length === 0) {
          return NextResponse.json({ error: "API key not found" }, { status: 404 })
        }

        const emailKeyData = emailResults[0]
        return NextResponse.json({
          success: true,
          data: {
            companyName: emailKeyData.company_name,
            companyEmail: emailKeyData.company_email,
            apiKey: emailKeyData.api_key,
            quota: emailKeyData.quota,
            planId: emailKeyData.plan_id,
            isActive: emailKeyData.is_active,
            subscriptionId: emailKeyData.subscription_id,
            createdAt: emailKeyData.created_at,
            updatedAt: emailKeyData.updated_at,
          },
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("API Keys route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 })
    }

    const results = await sql`
      SELECT * FROM api_keys WHERE company_email = ${email} LIMIT 1
    `

    if (results.length === 0) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    const keyData = results[0]
    return NextResponse.json({
      success: true,
      data: {
        companyName: keyData.company_name,
        companyEmail: keyData.company_email,
        apiKey: keyData.api_key,
        quota: keyData.quota,
        planId: keyData.plan_id,
        isActive: keyData.is_active,
        subscriptionId: keyData.subscription_id,
        createdAt: keyData.created_at,
        updatedAt: keyData.updated_at,
      },
    })
  } catch (error) {
    console.error("API Keys GET route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
