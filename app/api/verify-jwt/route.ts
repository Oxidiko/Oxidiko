import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Get RSA public key from private key for verification
const RSA_PRIVATE_KEY = (process.env.RSA_PRIVATE_KEY || "").replace(/\\n/g, "\n")

// Extract public key from private key for verification
function getPublicKeyFromPrivate(privateKey: string): string {
  try {
    // This is a simplified approach - in production you'd want to store the public key separately
    const crypto = require("crypto")
    const keyObject = crypto.createPrivateKey(privateKey)
    const publicKey = crypto.createPublicKey(keyObject)
    return publicKey.export({ type: "spki", format: "pem" })
  } catch (err) {
    console.error("Failed to extract public key:", err)
    throw new Error("Invalid private key")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, decrypt = false } = body

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Verify JWT signature
    const publicKey = getPublicKeyFromPrivate(RSA_PRIVATE_KEY)
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as any

    // If this is encrypted data and decryption is requested
    if (decrypt && decoded.encrypted && decoded.iv && decoded.type === "encrypted") {
      try {
        // Try to decrypt with siteKey
        // Note: This would require the site's origin to get the correct siteKey
        // For demo purposes, we'll return the encrypted payload
        return NextResponse.json({
          payload: decoded,
          decrypted: false,
          message: "Encrypted data - decryption requires site context",
        })
      } catch (decryptError) {
        console.error("Decryption failed:", decryptError)
        return NextResponse.json({
          payload: decoded,
          decrypted: false,
          error: "Decryption failed",
        })
      }
    }

    return NextResponse.json({ payload: decoded, valid: true })
  } catch (err: any) {
    console.error("JWT verification error:", err)
    if (err.name === "TokenExpiredError") {
      return NextResponse.json({ error: "Token has expired" }, { status: 401 })
    } else if (err.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    return NextResponse.json({ error: err.message || "Token verification failed" }, { status: 500 })
  }
}
