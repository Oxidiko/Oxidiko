"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Check, X, Fingerprint, Lock, Eye, EyeOff } from "lucide-react"
import {
  unlockVaultWithPasskey,
  unlockVaultWithPIN,
  getDecryptedProfile,
  isVaultUnlocked,
  getStoredCredId,
  getCurrentOxidikoId,
  getStoredRecId,
  encryptDataForSite,
  recordSiteAccess,
} from "@/lib/vault-storage"
import { authenticatePasskey, isWebAuthnSupported } from "@/lib/webauthn-utils"
import { incrementQuota } from "@/lib/api-validation"

interface AuthHandlerProps {
  apiKey?: string | null
  fields?: string | string[] | null
}

export function AuthHandler({ apiKey, fields }: AuthHandlerProps) {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [requestedFields, setRequestedFields] = useState<string[]>([])
  const [redirectUrl, setRedirectUrl] = useState("")
  const [siteUrl, setSiteUrl] = useState("")
  const [profile, setProfile] = useState<any>(null)
  const [credId, setCredId] = useState<string | null>(null)
  const [webAuthnSupported, setWebAuthnSupported] = useState(false)
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [activeTab, setActiveTab] = useState("passkey")
  const [configReceived, setConfigReceived] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      let fieldsArray: string[] = []
      if (fields) {
        if (Array.isArray(fields)) {
          fieldsArray = fields
        } else if (typeof fields === "string") {
          fieldsArray = fields
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
        }
      } else {
        // fallback to URL param for backward compatibility
        const urlParams = new URLSearchParams(window.location.search)
        fieldsArray = urlParams.get("fields")?.split(",") || []
      }
      setRequestedFields(fieldsArray)

      const urlParams = new URLSearchParams(window.location.search)
      const redirect = urlParams.get("redirect") || ""
      setRedirectUrl(redirect)
      setWebAuthnSupported(isWebAuthnSupported())

      if (isVaultUnlocked()) {
        setIsUnlocked(true)
        await loadProfile()
      } else {
        const storedCredId = await getStoredCredId()
        setCredId(storedCredId)
        if (!storedCredId || !isWebAuthnSupported()) {
          setActiveTab("pin")
        }
      }
    }

    initializeAuth()
  }, [fields])

  useEffect(() => {
    // Listen for configuration from parent window
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("Ignoring message from untrusted origin:", event.origin)
        return
      }

      console.log("Auth handler received message:", event.data)

      // Handle configuration from parent
      if (event.data.api_key || event.data.fields || event.data.redirect || event.data.site_url) {
        if (event.data.fields) {
          const fieldsArray = event.data.fields
            .split(",")
            .map((f: string) => f.trim())
            .filter(Boolean)
          setRequestedFields(fieldsArray)
        }
        if (event.data.redirect) {
          setRedirectUrl(event.data.redirect)
        }
        if (event.data.site_url) {
          setSiteUrl(event.data.site_url)
          console.log("Site URL set from parent:", event.data.site_url)
        }
        setConfigReceived(true)
      }
    }

    window.addEventListener("message", messageListener)

    // Signal to parent that we're ready to receive configuration
    if (window.opener) {
      console.log("Signaling to parent that auth handler is ready")
      window.opener.postMessage({ oxidikoReady: true }, "*")
    }

    return () => {
      window.removeEventListener("message", messageListener)
    }
  }, [])

  const loadProfile = async () => {
    try {
      const profileData = await getDecryptedProfile()
      setProfile(profileData)
    } catch (err) {
      setError("Failed to load profile")
    }
  }

  const handlePasskeyUnlock = async () => {
    if (!credId) {
      setError("No passkey found")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const { oxidikoId, signature } = await authenticatePasskey(credId)
      await unlockVaultWithPasskey(oxidikoId, signature)
      setIsUnlocked(true)
      await loadProfile()
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Authentication was cancelled")
      } else if (err.message?.includes("Oxidiko ID mismatch")) {
        setError("Authentication failed - identity mismatch")
      } else {
        setError(err.message || "Authentication failed")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinUnlock = async () => {
    if (pin.length < 8) {
      setError("PIN must be at least 8 characters long")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await unlockVaultWithPIN(pin)
      setIsUnlocked(true)
      await loadProfile()
    } catch (err: any) {
      setError(err.message || "Invalid PIN")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!profile) return

    setIsLoading(true)
    setError("")

    try {
      const oxidikoId = getCurrentOxidikoId()
      if (!oxidikoId) {
        throw new Error("No Oxidiko ID available")
      }

      const recId = await getStoredRecId()

      const allowedData: any = {
        sub: oxidikoId,
        oxidiko_id: oxidikoId,
        rec_id: recId,
      }

      // Collect requested fields (except 'none')
      if (!requestedFields.includes("none")) {
        requestedFields.forEach((field) => {
          if (field !== "none" && profile[field]) {
            allowedData[field] = profile[field]
          }
        })
      }

      console.log("Preparing to generate JWT with data:", {
        hasEncryption: !!siteUrl,
        siteUrl,
        fields: requestedFields,
        dataKeys: Object.keys(allowedData),
      })

      let jwtPayload: any

      // Try to use siteKey encryption if we have a site URL and it's different from current origin
      if (siteUrl && siteUrl !== window.location.origin) {
        try {
          console.log("Attempting siteKey encryption for:", siteUrl)
          const encryptedData = await encryptDataForSite(allowedData, siteUrl)
          await recordSiteAccess(siteUrl, requestedFields, encryptedData, redirectUrl)

          jwtPayload = {
            encrypted: encryptedData.encrypted,
            iv: encryptedData.iv,
          }
          console.log("Successfully encrypted data for site")
        } catch (encryptError) {
          console.error("Encryption failed, using plain data:", encryptError)
          jwtPayload = allowedData
        }
      } else {
        console.log("Using plain data (no siteUrl or same origin)")
        jwtPayload = allowedData
      }

      console.log("Calling JWT generation API with payload type:", jwtPayload.encrypted ? "encrypted" : "plain")

      const response = await fetch("/api/generate-jwt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jwtPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("JWT generation failed:", result)
        throw new Error(result.error || `HTTP ${response.status}: Failed to generate authentication token`)
      }

      const token = result.token
      console.log("JWT generated successfully")

      // Increment API quota
      if (apiKey) {
        try {
          await incrementQuota(apiKey)
        } catch (err) {
          console.error("Failed to increment quota:", err)
        }
      }

      // Send success message to parent
      if (window.opener) {
        const parentOrigin = redirectUrl ? new URL(redirectUrl).origin : "*"
        window.opener.postMessage(
          {
            type: "OXID_AUTH_SUCCESS",
            token: token,
          },
          parentOrigin,
        )
        window.close()
      } else {
        const callbackUrl = `${redirectUrl}?token=${token}`
        window.location.href = callbackUrl
      }
    } catch (err: any) {
      console.error("Authentication approval error:", err)
      const errorMessage = err.message || "Failed to generate authentication token"

      if (window.opener) {
        const parentOrigin = redirectUrl ? new URL(redirectUrl).origin : "*"
        window.opener.postMessage(
          {
            type: "OXID_AUTH_ERROR",
            error: errorMessage,
          },
          parentOrigin,
        )
        window.close()
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeny = () => {
    if (window.opener) {
      const parentOrigin = redirectUrl ? new URL(redirectUrl).origin : "*"
      window.opener.postMessage(
        {
          type: "OXID_AUTH_ERROR",
          error: "access_denied",
        },
        parentOrigin,
      )
      window.close()
    } else {
      const callbackUrl = `${redirectUrl}?error=access_denied`
      window.location.href = callbackUrl
    }
  }

  const getFieldIcon = (field: string) => {
    switch (field) {
      case "name":
        return "👤"
      case "email":
        return "📧"
      case "username":
        return "👤"
      case "birthdate":
        return "📅"
      case "phone":
        return "📱"
      case "address":
        return "📍"
      case "country":
        return "🌍"
      case "nationality":
        return "🏳️"
      case "gender":
        return "🚻"
      case "language":
        return "🗣️"
      case "creditCard":
        return "💳"
      case "none":
        return "🚫"
      default:
        return "📄"
    }
  }

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "name":
        return "Full Name"
      case "email":
        return "Email Address"
      case "username":
        return "Username"
      case "birthdate":
        return "Birth Date"
      case "phone":
        return "Phone Number"
      case "address":
        return "Address"
      case "country":
        return "Country"
      case "nationality":
        return "Nationality"
      case "gender":
        return "Gender"
      case "language":
        return "Language"
      case "creditCard":
        return "Credit Card"
      case "none":
        return "None"
      default:
        return field.charAt(0).toUpperCase() + field.slice(1)
    }
  }

  if (!webAuthnSupported && !credId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-center flex items-center justify-center gap-2">
                  <Shield className="h-8 w-8 text-red-400" />
                  Authentication Required
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-400">Please use PIN authentication or import your vault to continue.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Shield className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Authentication Request</h1>
              <p className="text-gray-400">Unlock your vault to continue</p>
              {apiKey && <Badge className="bg-blue-900 text-blue-400 mt-2">API Request</Badge>}
              {!configReceived && (
                <Badge className="bg-yellow-900 text-yellow-400 mt-2">Waiting for configuration...</Badge>
              )}
            </div>

            <Card className="bg-gray-950 border-gray-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white text-lg">Requested Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requestedFields.length > 0 ? (
                    requestedFields.map((field) => (
                      <div key={field} className="flex items-center gap-3">
                        <span className="text-lg">{getFieldIcon(field)}</span>
                        <span className="text-gray-300">{getFieldLabel(field)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center">Waiting for field configuration...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-center">Unlock Your Vault</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                    <TabsTrigger
                      value="passkey"
                      disabled={!webAuthnSupported || !credId}
                      className="data-[state=active]:bg-blue-600"
                    >
                      <Fingerprint className="h-4 w-4 mr-1" />
                      Passkey
                    </TabsTrigger>
                    <TabsTrigger value="pin" className="data-[state=active]:bg-orange-600">
                      <Lock className="h-4 w-4 mr-1" />
                      PIN
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="passkey" className="space-y-4">
                    <div className="text-center">
                      <div className="bg-gray-800 p-4 rounded-lg mb-4">
                        <Fingerprint className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Use your biometric authentication or security key</p>
                      </div>
                    </div>

                    <Button
                      onClick={handlePasskeyUnlock}
                      disabled={isLoading || !credId}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Fingerprint className="h-4 w-4 mr-2 animate-pulse" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="h-4 w-4 mr-2" />
                          Unlock & Continue
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="pin" className="space-y-4">
                    <div className="text-center">
                      <div className="bg-gray-800 p-4 rounded-lg mb-4">
                        <Lock className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Enter your backup PIN</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPin ? "text" : "password"}
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="Enter your backup PIN"
                          className="bg-orange-900/30 border-orange-800/50 text-white placeholder-gray-400 pr-10"
                          minLength={8}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 h-auto"
                        >
                          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handlePinUnlock}
                      disabled={isLoading || pin.length < 8}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Lock className="h-4 w-4 mr-2 animate-pulse" />
                          Unlocking...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Unlock & Continue
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>

                {error && (
                  <Alert className="bg-red-900/20 border-red-800">
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Authorization Request</h1>
            <p className="text-gray-400">
              {siteUrl ? new URL(siteUrl).hostname : "A website"} wants to access your information
            </p>
            {apiKey && <Badge className="bg-green-900 text-green-400 mt-2">API Request</Badge>}
          </div>

          <Card className="bg-gray-950 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Requested Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requestedFields.map((field) => (
                  <div key={field} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getFieldIcon(field)}</span>
                      <div>
                        <div className="text-white font-medium">{getFieldLabel(field)}</div>
                        <div className="text-gray-400 text-sm">
                          {field === "none" ? "No additional data" : profile?.[field] || "Not available"}
                        </div>
                      </div>
                    </div>
                    {(field === "none" || profile?.[field]) && (
                      <Badge className="bg-green-900 text-green-400 hover:bg-green-900">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleDeny}
              variant="outline"
              className="bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-400"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Deny
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Allow
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Only the requested information will be shared. Your Oxidiko ID: {getCurrentOxidikoId()?.substring(0, 8)}...
          </p>

          {error && (
            <Alert className="mt-4 bg-red-900/20 border-red-800">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
