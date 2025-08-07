"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SiteAccessHistoryPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard since we're using popup now
    router.push("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  )
}
