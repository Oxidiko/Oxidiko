"use client"

import { useState, useEffect } from "react"
import { AuthHandler } from "@/components/auth-handler"

export default function LoginPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [fields, setFields] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<"ok" | "missing_apiKey" | "quota_exceeded" | "wrong_apiKey" | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAuthFlow, setIsAuthFlow] = useState<boolean>(false)

  useEffect(() => {
    // Listen for configuration from parent window
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("Login page ignoring message from untrusted origin:", event.origin)
        return
      }

      console.log("Login page received message:", event.data)

      // Handle configuration from parent
      if (event.data.api_key || event.data.fields || event.data.redirect || event.data.site_url) {
        if (event.data.api_key) {
          setApiKey(event.data.api_key)
        }
        if (event.data.fields) {
          setFields(event.data.fields)
        }
        // Forward the complete message to AuthHandler via props
        // The AuthHandler will handle the rest of the configuration
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

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("Ignoring message from untrusted origin:", event.origin)
        return
      }

      const { api_key: providedApiKey, fields: providedFields, redirect } = event.data

      console.log("Received configuration:", { providedApiKey, providedFields, redirect })

      setIsLoading(true)
      setApiError(null)

      const normalizedFields = typeof providedFields === "string" ? providedFields.split(",") : providedFields

      if (!providedApiKey) {
        setApiError("API key is required. Please provide a valid api_key parameter.")
        setApiStatus("missing_apiKey")
        setIsLoading(false)
        return
      }
      if (!normalizedFields || !redirect) {
        setApiError("Missing required parameters: fields and redirect are required.")
        setApiStatus(null)
        setIsLoading(false)
        return
      }
      try {
        const validation = await validateAPIKey(providedApiKey)
        if (!validation.valid) {
          setApiError("Invalid API key. Please check your API key and try again.")
          setApiStatus("wrong_apiKey")
          setIsLoading(false)
          return
        }
        if (!validation.canUse) {
          const quotaInfo = validation.quota ? ` Current quota: ${validation.quota}` : ""
          setApiError(`API key quota exceeded or inactive.${quotaInfo} Please upgrade your plan or contact support.`)
          setApiStatus("quota_exceeded")
          setIsLoading(false)
          return
        }
        setApiKey(providedApiKey)
        setFields(normalizedFields)
        setIsAuthFlow(true)
        setApiStatus("ok")
      } catch (err) {
        console.error("API key validation error:", err)
        setApiError("Failed to validate API key. Please try again or contact support.")
        setApiStatus(null)
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  if (apiError) {
    let statusMsg = null
    if (apiStatus === "missing_apiKey") {
      statusMsg = <span className="text-yellow-400">API key is missing.</span>
    } else if (apiStatus === "wrong_apiKey") {
      statusMsg = <span className="text-red-400">API key is invalid.</span>
    } else if (apiStatus === "quota_exceeded") {
      statusMsg = <span className="text-orange-400">API key quota exceeded.</span>
    }
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <Alert className="bg-red-900/20 border-red-800 mb-4">
            <AlertDescription className="text-red-400">{apiError}</AlertDescription>
            {statusMsg && <div className="mt-2">{statusMsg}</div>}
          </Alert>
          <div className="text-gray-400 text-sm space-y-2">
            <p>Required parameters must be sent via <code>postMessage</code> from the parent website:</p>
            <ul className="list-disc list-inside text-left">
              <li>
                <code>api_key</code> - Your valid API key
              </li>
              <li>
                <code>fields</code> - Comma-separated list of fields to collect
              </li>
              <li>
                <code>redirect</code> - URL to redirect after authentication
              </li>
            </ul>
            <p className="mt-4">
              Visit our API documentation for more information or contact support if you need assistance.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <AuthHandler apiKey={apiKey} fields={fields} />
}
