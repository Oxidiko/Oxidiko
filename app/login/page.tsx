"use client"

import { useState, useEffect } from "react"
import { AuthHandler } from "@/components/auth-handler"
import { validateAPIKey } from "@/lib/api-validation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [isAuthFlow, setIsAuthFlow] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState("")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [fields, setFields] = useState<string | null>(null)
  const [siteUrl, setSiteUrl] = useState<string | null>(null)
  const [trustedOrigin, setTrustedOrigin] = useState<string | null>(null)

  useEffect(() => {
    // Dynamically determine trusted origin from parent/opener
    let origin: string | null = null
    try {
      if (window.opener && window.opener.origin) {
        origin = window.opener.origin
      } else if (window.parent !== window && window.parent.origin) {
        origin = window.parent.origin
      }
    } catch (e) {
      // cross-origin access may fail
      origin = null
    }
    // fallback: use document.referrer if available
    if (!origin && document.referrer) {
      try {
        origin = new URL(document.referrer).origin
      } catch {}
    }
    setTrustedOrigin(origin)

    const handleMessage = async (event: MessageEvent) => {
      // Only allow messages from the parent/opener's origin if available
      if (origin && event.origin !== origin) {
        setApiError("Untrusted origin. Authentication aborted.")
        setIsLoading(false)
        return
      }
      const { api_key: providedApiKey, fields: providedFields, redirect, site_url: providedSiteUrl } = event.data || {}
      // Normalize fields to a comma-separated string
      let normalizedFields = providedFields
      if (Array.isArray(providedFields)) {
        normalizedFields = providedFields.join(",")
      }
      if (!providedApiKey) {
        setApiError("API key is required. Please provide a valid api_key parameter.")
        setIsLoading(false)
        return
      }
      if (!normalizedFields || !redirect) {
        setApiError("Missing required parameters: fields and redirect are required.")
        setIsLoading(false)
        return
      }
      try {
        const validation = await validateAPIKey(providedApiKey)
        if (!validation.valid) {
          setApiError("Invalid API key. Please check your API key and try again.")
          setIsLoading(false)
          return
        }
        if (!validation.canUse) {
          const quotaInfo = validation.quota ? ` Current quota: ${validation.quota}` : ""
          setApiError(`API key quota exceeded or inactive.${quotaInfo} Please upgrade your plan or contact support.`)
          setIsLoading(false)
          return
        }
        setApiKey(providedApiKey)
        setFields(normalizedFields)
        setSiteUrl(providedSiteUrl || null)
        setIsAuthFlow(true)
      } catch (err) {
        console.error("API key validation error:", err)
        setApiError("Failed to validate API key. Please try again or contact support.")
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }
    window.addEventListener("message", handleMessage)
    // Optionally, notify parent that the page is ready
    if (window.opener) {
      window.opener.postMessage({ oxidikoReady: true }, "*")
    } else if (window.parent !== window) {
      window.parent.postMessage({ oxidikoReady: true }, "*")
    }
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <Alert className="bg-red-900/20 border-red-800 mb-4">
            <AlertDescription className="text-red-400">{apiError}</AlertDescription>
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
              <li>
                <code>site_url</code> - (optional) The requesting website's origin for encrypted JWT
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

  if (!isAuthFlow) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Waiting for Authentication Request</h1>
          <p className="text-gray-400">This page is waiting for a secure authentication request from the parent website.</p>
        </div>
      </div>
    )
  }

  return <AuthHandler apiKey={apiKey} fields={fields} siteUrl={siteUrl} />
}
