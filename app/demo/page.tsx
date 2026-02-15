"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, User } from "lucide-react"
import { verifyJWT as verifyJWTClaimsOnly } from "@/lib/jwt-utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const availableFields = [
  { id: "name", label: "Full Name", icon: "\uD83D\uDC64" },
  { id: "username", label: "Username", icon: "\uD83D\uDC64" },
  { id: "email", label: "Email Address", icon: "\uD83D\uDCE7" },
  { id: "birthdate", label: "Birth Date", icon: "\uD83D\uDCC5" },
  { id: "phone", label: "Phone Number", icon: "\uD83D\uDCF1" },
  { id: "address", label: "Address", icon: "\uD83D\uDCCD" },
  { id: "country", label: "Country", icon: "\uD83C\uDF0D" },
  { id: "nationality", label: "Nationality", icon: "\uD83C\uDFF3\uFE0F" },
  { id: "gender", label: "Gender", icon: "\uD83D\uDEB6" },
  { id: "language", label: "Language", icon: "\uD83D\uDDE3\uFE0F" },
  { id: "creditCard", label: "Credit Card", icon: "\uD83D\uDCB3" },
  { id: "none", label: "None", icon: "\uD83D\uDEAB" },
  { id: "rec_id", label: "Recovery ID", icon: "\uD83D\uDD11" },
]

export default function DemoPage() {
  const [token, setToken] = useState("")
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState("")
  const [selectedFields, setSelectedFields] = useState<string[]>(["name", "email"])
  const [apiKey, setApiKey] = useState("")

  const handleLogin = () => {
    if (selectedFields.length === 0) {
      setError("Please select at least one field to request")
      return
    }

    if (!apiKey.trim()) {
      setError("Please enter your API key")
      return
    }

    const fieldsToRequest = selectedFields.includes("none") ? ["none"] : selectedFields
    const fields = fieldsToRequest.join(",")
    const redirectUrl = `${window.location.origin}/demo`
    const siteUrl = window.location.href // Send the full current URL
    const authUrl = `${window.location.origin}/login`

    console.log("Opening login popup with config:", {
      apiKey: "***",
      fields,
      redirectUrl,
      siteUrl,
    })

    const left = (screen.width - 500) / 2
    const top = (screen.height - 700) / 2
    const popup = window.open(authUrl, "oxidiko-auth", `width=500,height=700,left=${left},top=${top}`)

    if (!popup) {
      setError("Failed to open authentication popup. Please allow popups and try again.")
      return
    }

    let messageListenerAdded = false
    let configSent = false

    // Listen for messages from popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("Ignoring message from untrusted origin:", event.origin)
        return
      }

      console.log("Received message from popup:", event.data)

      if (event.data.type === "OXID_AUTH_SUCCESS") {
        console.log("Authentication successful, received token")
        setToken(event.data.token)
        verifyToken(event.data.token)
        popup?.close()
        window.removeEventListener("message", messageListener)
        setError("")
      } else if (event.data.type === "OXID_AUTH_ERROR") {
        console.error("Authentication error:", event.data.error)
        setError(event.data.error || "Authentication failed")
        popup?.close()
        window.removeEventListener("message", messageListener)
      } else if (event.data.oxidikoReady && !configSent) {
        console.log("Popup ready, sending configuration")
        // Send the required params to the popup via postMessage
        popup.postMessage(
          {
            api_key: apiKey.trim(),
            fields,
            redirect: redirectUrl,
            site_url: siteUrl, // Include the full site URL
          },
          window.location.origin,
        )
        configSent = true
      }
    }

    // Add message listener immediately
    window.addEventListener("message", messageListener)
    messageListenerAdded = true

    // Mobile-specific: Try sending config after a short delay
    const mobileConfigTimeout = setTimeout(() => {
      if (popup && !popup.closed && !configSent) {
        console.log("Sending delayed configuration for mobile")
        popup.postMessage(
          {
            api_key: apiKey.trim(),
            fields,
            redirect: redirectUrl,
            site_url: siteUrl, // Include the full site URL
          },
          window.location.origin,
        )
        configSent = true
      }
    }, 1000)

    // Additional fallback for mobile devices
    const mobileConfigTimeout2 = setTimeout(() => {
      if (popup && !popup.closed && !configSent) {
        console.log("Sending second delayed configuration for mobile")
        popup.postMessage(
          {
            api_key: apiKey.trim(),
            fields,
            redirect: redirectUrl,
            site_url: siteUrl,
          },
          window.location.origin,
        )
        configSent = true
      }
    }, 2500)

    // Fallback: check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        console.log("Popup was closed")
        clearInterval(checkClosed)
        clearTimeout(mobileConfigTimeout)
        clearTimeout(mobileConfigTimeout2)
        if (messageListenerAdded) {
          window.removeEventListener("message", messageListener)
        }
      }
    }, 1000)
  }

  const [privateKey, setPrivateKey] = useState("")

  const importPrivateKey = async (pem: string) => {
    try {
      // Remove headers and newlines
      const pemHeader = "-----BEGIN PRIVATE KEY-----"
      const pemFooter = "-----END PRIVATE KEY-----"
      const pemContents = pem.substring(pem.indexOf(pemHeader) + pemHeader.length, pem.indexOf(pemFooter))
      // base64 decode
      const binaryDerString = window.atob(pemContents.replace(/\s/g, ''))
      const binaryDer = new Uint8Array(binaryDerString.length)
      for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i)
      }

      return await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["decrypt"]
      )
    } catch (e) {
      console.error("Error importing private key:", e)
      throw new Error("Invalid Private Key format")
    }
  }

  const base64ToBuffer = (base64: string): ArrayBuffer => {
    try {
      const cleanedB64 = base64.replace(/\s/g, '')
      const binary = window.atob(cleanedB64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes.buffer
    } catch (e) {
      console.error("Base64 decoding failed for string length:", base64.length)
      throw e
    }
  }

  const decryptData = async (payload: string, key: CryptoKey) => {
    try {
      console.log("Starting hybrid decryption for payload length:", payload.length)
      const parts = payload.split('.')
      console.log("Parts found:", parts.length)
      if (payload.length > 20) {
        console.log("Payload snippet:", payload.substring(0, 10) + "..." + payload.substring(payload.length - 10))
      }

      if (parts.length === 3) {
        // Hybrid Format: WrappedKey.IV.Data
        const [wrappedKeyB64, ivB64, dataB64] = parts
        console.log("Hybrid RSA+AES format detected. Wrapping key length:", wrappedKeyB64.length)

        // 1. Decrypt (unwrap) the AES key using RSA
        const aesKeyBuffer = await window.crypto.subtle.decrypt(
          {
            name: "RSA-OAEP"
          },
          key,
          base64ToBuffer(wrappedKeyB64)
        )
        console.log("AES key unwrapped successfully")

        // 2. Import the decrypted AES key
        const aesKey = await window.crypto.subtle.importKey(
          "raw",
          aesKeyBuffer,
          { name: "AES-GCM" },
          false,
          ["decrypt"]
        )

        // 3. Decrypt the data using AES
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: new Uint8Array(base64ToBuffer(ivB64)) },
          aesKey,
          base64ToBuffer(dataB64)
        )
        console.log("Profile data decrypted successfully")

        const decoder = new TextDecoder()
        const decodedString = decoder.decode(decryptedBuffer)
        return JSON.parse(decodedString)
      } else {
        const isHex = /^[0-9a-fA-F]+$/.test(payload)
        if (isHex) {
          console.error("SYMMETRIC (siteKey) encryption detected! RSA Private Key cannot decrypt this.")
          throw new Error("Symmetric encryption detected. This happens when the login system couldn't find your Public Key. Check the API key you used in Step 1.")
        }

        console.log("Legacy RSA-only format suspected (parts !== 3)")
        // Legacy RSA-only format
        const encryptedData = base64ToBuffer(payload)
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          {
            name: "RSA-OAEP"
          },
          key,
          encryptedData
        )
        const decoder = new TextDecoder()
        return JSON.parse(decoder.decode(decryptedBuffer))
      }
    } catch (e: any) {
      console.error("Decryption operation failed:", e)
      throw new Error(`Decryption failed: ${e.message}. Check your Private Key.`)
    }
  }

  const verifyToken = async (tokenToVerify: string) => {
    try {
      console.log("Verifying token...")
      // First try to verify the JWT claims (signature check)
      const payload = await verifyJWTClaimsOnly(tokenToVerify)
      console.log("Token payload:", payload)

      // Check if the data is encrypted
      if (payload.encrypted) {
        console.log("Token contains encrypted data.")

        if (privateKey) {
          try {
            console.log("Attempting to decrypt with provided Private Key...")
            const key = await importPrivateKey(privateKey)
            const decrypted = await decryptData(payload.encrypted, key)
            console.log("Decryption successful:", decrypted)
            setUserData({ ...decrypted, ...payload }) // Merge decrypted data with public claims like exp/iat
          } catch (err: any) {
            console.warn("Decryption failed:", err.message)
            setError("Token valid, but decryption failed: " + err.message)
            setUserData(payload) // Show encrypted payload
          }
        } else {
          console.log("No private key provided, showing encrypted payload")
          setUserData(payload)
        }
      } else {
        // Old format or unencrypted data
        console.log("Token contains plain data")
        setUserData(payload)
      }
      // setError("") // Don't clear error here if decryption failed
    } catch (err: any) {
      console.error("Token verification error:", err)
      setError(err.message || "Invalid or expired token")
      setUserData(null)
    }
  }

  const handleVerifyToken = () => {
    if (token) {
      verifyToken(token)
    }
  }

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields((prev: string[]) => {
      if (fieldId === "none") {
        // If 'none' is selected, clear all other selections
        return prev.includes("none") ? [] : ["none"]
      } else {
        // If any other field is selected, remove 'none' if it exists
        const withoutNone = prev.filter((id: string) => id !== "none")
        return withoutNone.includes(fieldId)
          ? withoutNone.filter((id: string) => id !== fieldId)
          : [...withoutNone, fieldId]
      }
    })
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
        <div className="w-full overflow-x-hidden">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Oxidiko Web Vault Demo</h1>
            <p className="text-gray-400 text-base sm:text-lg">Test the OAuth-style authentication flow</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 w-full overflow-x-hidden">
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
              <Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
                <CardHeader className="w-full overflow-x-hidden">
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Step 1: Select Data to Request
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 w-full overflow-x-hidden">
                  <p className="text-gray-400">Choose which information you want to request from the user:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full overflow-x-hidden">
                    {availableFields.map((field) => (
                      <div key={field.id} className="flex items-center space-x-2 w-full overflow-x-hidden">
                        <Checkbox
                          id={field.id}
                          checked={selectedFields.includes(field.id)}
                          onCheckedChange={() => handleFieldToggle(field.id)}
                          className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex-shrink-0"
                        />
                        <label
                          htmlFor={field.id}
                          className="text-sm text-gray-300 cursor-pointer flex items-center gap-2 min-w-0 overflow-hidden"
                        >
                          <span className="flex-shrink-0">{field.icon}</span>
                          <span className="truncate">{field.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedFields.length > 0 && (
                    <div className="mt-4 w-full overflow-x-hidden">
                      <p className="text-sm text-gray-400 mb-2">Selected fields:</p>
                      <div className="flex flex-wrap gap-2 w-full overflow-x-hidden">
                        {selectedFields.map((fieldId) => {
                          const field = availableFields.find((f) => f.id === fieldId)
                          return (
                            <Badge
                              key={fieldId}
                              className="bg-blue-900 text-blue-400 text-xs sm:text-sm flex-shrink-0 hover:bg-blue-900"
                            >
                              {field?.icon} {field?.label}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
                <CardHeader className="w-full overflow-x-hidden">
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Step 2: API Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 w-full overflow-x-hidden">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-gray-300">
                      API Key
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter your API key..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500">
                      Get your API key from the{" "}
                      <a href="/api-dashboard" className="text-blue-400 hover:underline">
                        API Dashboard
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="private-key" className="text-gray-300">
                      Private Key (for decryption)
                    </Label>
                    <Input
                      id="private-key"
                      type="password"
                      placeholder="Paste your Private Key (PEM format)..."
                      value={privateKey}
                      onChange={(e) => {
                        setPrivateKey(e.target.value);
                        // If we already have a token, re-verify to attempt decryption
                        if (token) {
                          // We can't call verifyToken directly easily here due to stale closure if we didn't wrap it, 
                          // but the user can click "Verify Token".
                          // Actually, let's just set it.
                        }
                      }}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 font-mono text-xs"
                    />
                    <p className="text-xs text-gray-500">
                      Paste the Private Key from the dashboard to simulate backend decryption.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
                <CardHeader className="w-full overflow-x-hidden">
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Step 3: Initiate Login
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 w-full overflow-x-hidden">
                  <p className="text-gray-400">
                    Click the button below to open the authentication popup with your selected fields.
                  </p>
                  <Button
                    onClick={handleLogin}
                    disabled={selectedFields.length === 0 || !apiKey.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Login with Oxidiko Web Vault</span>
                    <span className="sm:hidden">Login with Oxidiko</span>
                  </Button>
                  {error && (
                    <Alert className="bg-red-900/20 border-red-800 w-full overflow-x-hidden">
                      <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
              {userData ? (
                <Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
                  <CardHeader className="w-full overflow-x-hidden">
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Authenticated User Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 w-full overflow-x-hidden">
                    <div className="space-y-3 w-full overflow-x-hidden">
                      {userData.oxidiko_id && (
                        <div className="flex items-center justify-between w-full overflow-x-hidden">
                          <span className="text-gray-400">User ID:</span>
                          <Badge className="bg-blue-900 text-blue-400 hover:bg-blue-900">{userData.oxidiko_id}</Badge>
                        </div>
                      )}

                      {userData.rec_id && (
                        <div className="flex items-center justify-between w-full overflow-x-hidden">
                          <span className="text-gray-400 flex items-center gap-2">
                            <span>🔑</span>
                            Recovery ID:
                          </span>
                          <span className="text-white font-mono text-sm break-all overflow-wrap-anywhere min-w-0">
                            {userData.rec_id.substring(0, 16)}...
                          </span>
                        </div>
                      )}

                      {userData.encrypted && userData.iv && (
                        <div className="text-center py-4 bg-yellow-900/20 rounded-lg">
                          <span className="text-yellow-400">🔒 Data is encrypted with siteKey</span>
                          <p className="text-xs text-gray-400 mt-1">
                            This demonstrates the new encryption system is working
                          </p>
                        </div>
                      )}

                      {selectedFields.includes("none") ? (
                        <div className="text-center py-4">
                          <span className="text-gray-400">🚫 No additional data requested</span>
                        </div>
                      ) : (
                        selectedFields.map((fieldId) => {
                          const field = availableFields.find((f) => f.id === fieldId)
                          const value = userData[fieldId]
                          if (!value) return null

                          return (
                            <div
                              key={fieldId}
                              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2 w-full overflow-x-hidden"
                            >
                              <span className="text-gray-400 flex items-center gap-2 flex-shrink-0">
                                <span>{field?.icon}</span>
                                {field?.label}:
                              </span>
                              <span className="text-white break-all overflow-wrap-anywhere min-w-0">{value}</span>
                            </div>
                          )
                        })
                      )}

                      {userData.iat && (
                        <div className="flex items-center justify-between w-full overflow-x-hidden">
                          <span className="text-gray-400">Issued At:</span>
                          <span className="text-white">{new Date(userData.iat * 1000).toLocaleString()}</span>
                        </div>
                      )}

                      {userData.exp && (
                        <div className="flex items-center justify-between w-full overflow-x-hidden">
                          <span className="text-gray-400">Expires At:</span>
                          <span className="text-white">{new Date(userData.exp * 1000).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
                  <CardHeader className="w-full overflow-x-hidden">
                    <CardTitle className="text-white">Waiting for Authentication</CardTitle>
                  </CardHeader>
                  <CardContent className="w-full overflow-x-hidden">
                    <p className="text-gray-400">Complete the login flow to see the authenticated user data here.</p>
                  </CardContent>
                </Card>
              )}

              {token && (
                <Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
                  <CardHeader className="w-full overflow-x-hidden">
                    <CardTitle className="text-white">JWT Token</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 w-full overflow-x-hidden">
                    <div className="bg-gray-800 p-2 sm:p-3 rounded-lg w-full overflow-x-hidden">
                      <p className="text-xs text-gray-300 break-all font-mono overflow-wrap-anywhere w-full">{token}</p>
                    </div>
                    <Button onClick={handleVerifyToken} className="w-full bg-gray-800 hover:bg-gray-700 text-white">
                      Verify Token
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
