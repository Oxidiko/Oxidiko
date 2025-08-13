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
    // Listen for configuration from parent window
    const messageListener = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("Login page ignoring message from untrusted origin:", event.origin)
        return
      }

      console.log("Login page received message:", event.data)

      if (event.data.api_key || event.data.fields) {
        if (event.data.api_key) {
          const providedApiKey = event.data.api_key
          setApiKey(providedApiKey)

          try {
            const validation = await validateAPIKey(providedApiKey)
            if (!validation.valid) {
              setApiError("Invalid API key. Please check your API key and try again.")
              return
            }
            if (!validation.canUse) {
              const quotaInfo = validation.quota ? ` Current quota: ${validation.quota}` : ""
              setApiError(`API key quota exceeded or inactive.${quotaInfo} Please upgrade your plan or contact support.`)
              return
            }
          } catch (err) {
            console.error("API key validation error:", err)
            setApiError("Failed to validate API key. Please try again or contact support.")
            return
          }
        } else {
          setApiError("API key is required. Please provide a valid api_key parameter.")
          return
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
