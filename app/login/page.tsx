"use client"

import { useState, useEffect } from "react"
import { AuthHandler } from "@/components/auth-handler"
import { validateAPIKey } from "@/lib/api-validation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [fields, setFields] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string>("")

  useEffect(() => {
    const handleApiKey = async (providedApiKey: string) => {
      setApiKey(providedApiKey)
      try {
        const validation = await validateAPIKey(providedApiKey)
        if (!validation.valid) {
          setApiError("Invalid API key. Please check your API key and try again.")
          return false
        }
        if (!validation.canUse) {
          const quotaInfo = validation.quota ? ` Current quota: ${validation.quota}` : ""
          setApiError(`API key quota exceeded or inactive.${quotaInfo} Please upgrade your plan or contact support.`)
          return false
        }
        return true
      } catch (err) {
        console.error("API key validation error:", err)
        setApiError("Failed to validate API key. Please try again or contact support.")
        return false
      }
    }

    const initFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const urlApiKey = urlParams.get("api_key")
      const urlFields = urlParams.get("fields")

      if (urlApiKey) {
        await handleApiKey(urlApiKey)
      }
      if (urlFields) {
        setFields(urlFields)
      }
    }

    initFromUrl()

    // Listen for configuration from parent window
    const messageListener = async (event: MessageEvent) => {
      console.log("Login page received message:", event.data)
      if (event.data.api_key || event.data.fields) {
        if (event.data.api_key) {
          await handleApiKey(event.data.api_key)
        }
        if (event.data.fields) {
          setFields(event.data.fields)
        }
      }
    }

    window.addEventListener("message", messageListener)

    // Signal to parent that we're ready to receive configuration
    if (window.opener) {
      console.log("Login page signaling ready to parent")
      window.opener.postMessage({ oxidikoReady: true }, "*")
    }

    return () => {
      window.removeEventListener("message", messageListener)
    }
  }, [])

  if (apiError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <Alert className="bg-red-900/20 border-red-800 mb-4">
            <AlertDescription className="text-red-400">{apiError}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return <AuthHandler apiKey={apiKey} fields={fields} />
}
