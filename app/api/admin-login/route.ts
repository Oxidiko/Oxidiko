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
    const secret = process.env.JWT_SECRET || "dev_secret"
    const token = jwt.sign(payload, secret)
    return NextResponse.json({ success: true, token })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Authentication failed" }, { status: 500 })
  }
}
