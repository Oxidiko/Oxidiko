"use client"

import { useState, useEffect } from "react"
import { AuthHandler } from "@/components/auth-handler"

export default function LoginPage() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [fields, setFields] = useState<string | null>(null)

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

  return <AuthHandler apiKey={apiKey} fields={fields} />
}
