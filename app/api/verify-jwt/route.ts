import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/jwt-utils"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }
    const payload = await verifyJWT(token)
    return NextResponse.json({ payload })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to verify JWT" }, { status: 400 })
  }
}
