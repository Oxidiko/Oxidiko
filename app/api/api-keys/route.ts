import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Helper to generate keys
const generateKeyPair = async () => {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  )

  const exportedPublic = await crypto.subtle.exportKey("spki", publicKey)
  const exportedPrivate = await crypto.subtle.exportKey("pkcs8", privateKey)

  const toPem = (buffer: ArrayBuffer, type: string) => {
    const b64 = Buffer.from(buffer).toString('base64')
    const chunks = b64.match(/.{1,64}/g)
    const formattedChunks = chunks ? chunks.join('\n') : b64
    return `-----BEGIN ${type} KEY-----\n${formattedChunks}\n-----END ${type} KEY-----`
  }

  return {
    publicKey: toPem(exportedPublic, "PUBLIC"),
    privateKey: toPem(exportedPrivate, "PRIVATE")
  }
}

const ensureKeys = async (keyData: any) => {
  if (!keyData.public_key || !keyData.private_key) {
    const { publicKey, privateKey } = await generateKeyPair()
    await sql`
      UPDATE api_keys 
      SET public_key = ${publicKey}, private_key = ${privateKey}, updated_at = CURRENT_TIMESTAMP
      WHERE api_key = ${keyData.api_key}
    `
    keyData.public_key = publicKey
    keyData.private_key = privateKey
  }
  return keyData
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case "migrate":
        // One-time migration to add columns
        try {
          await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS public_key TEXT`
          await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS private_key TEXT`
          return NextResponse.json({ success: true, message: "Migration successful" })
        } catch (e: any) {
          return NextResponse.json({ error: e.message }, { status: 500 })
        }

      case "create":
        // Ensure columns exist first
        try {
          await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS public_key TEXT`
          await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS private_key TEXT`
        } catch (e) {
          console.error("Auto-migration during create failed:", e)
          // Continue anyway, maybe they exist
        }

        const { publicKey, privateKey } = await generateKeyPair()

        await sql`
          INSERT INTO api_keys (
            api_key, company_name, company_email, quota, plan_id, is_active, subscription_id, public_key, private_key
          ) VALUES (
            ${data.apiKey}, ${data.companyName}, ${data.companyEmail}, 
            ${data.quota}, ${data.planId}, ${data.isActive}, ${data.subscriptionId || null},
            ${publicKey}, ${privateKey}
          )
          ON CONFLICT (api_key) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            company_email = EXCLUDED.company_email,
            quota = EXCLUDED.quota,
            plan_id = EXCLUDED.plan_id,
            is_active = EXCLUDED.is_active,
            subscription_id = EXCLUDED.subscription_id,
            public_key = EXCLUDED.public_key,
            private_key = EXCLUDED.private_key,
            updated_at = CURRENT_TIMESTAMP
        `
        return NextResponse.json({ success: true, publicKey, privateKey })

      case "validate":
        const keyResults = await sql`
          SELECT * FROM api_keys WHERE api_key = ${data.apiKey} LIMIT 1
        `

        if (keyResults.length === 0) {
          return NextResponse.json({ valid: false, canUse: false })
        }

        const keyData = await ensureKeys(keyResults[0])

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

        console.log("Validation successful for key:", data.apiKey, "Has public_key:", !!keyData.public_key)

        return NextResponse.json({
          valid: true,
          canUse,
          quota: keyData.quota,
          publicKey: keyData.public_key, // Explicitly at root
          public_key: keyData.public_key, // Snake case fallback
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
            publicKey: keyData.public_key,
            privateKey: keyData.private_key,
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

        const emailKeyData = await ensureKeys(emailResults[0])
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
            publicKey: emailKeyData.public_key,
            privateKey: emailKeyData.private_key,
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

    const keyData = await ensureKeys(results[0])
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
        publicKey: keyData.public_key,
        privateKey: keyData.private_key,
      },
    })
  } catch (error) {
    console.error("API Keys GET route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
