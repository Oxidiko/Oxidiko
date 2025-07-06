import { NextRequest, NextResponse } from "next/server"
import argon2 from "argon2"

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
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Authentication failed" }, { status: 500 })
  }
}
