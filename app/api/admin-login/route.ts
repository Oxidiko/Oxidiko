import { NextRequest, NextResponse } from "next/server"
import argon2 from "argon2"
import jwt from "jsonwebtoken"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }
    const combinedString = username + password
    const adminHash = process.env.NEXT_PUBLIC_ADMIN_HASH
    if (!adminHash) {
      return NextResponse.json({ success: false, error: "Admin authentication not configured" }, { status: 500 })
    }
    const isValid = await argon2.verify(adminHash, combinedString)
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 })
    }
    // Issue JWT with admin role
    const payload = {
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 1 // 1 hour
    }
    // SECURITY (CRIT-3): Never fall back to a default secret.
    // If JWT_SECRET is not set, refuse to issue tokens rather than signing with a public constant.
    const secret = process.env.JWT_SECRET
    if (!secret || secret.length < 32) {
      console.error("JWT_SECRET is not configured or too short")
      return NextResponse.json({ success: false, error: "Server authentication not configured" }, { status: 500 })
    }
    const token = jwt.sign(payload, secret, { algorithm: "HS256" })
    return NextResponse.json({ success: true, token })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Authentication failed" }, { status: 500 })
  }
}
