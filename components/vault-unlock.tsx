"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Fingerprint, Lock, Eye, EyeOff, Upload, Download } from "lucide-react"
import {
  unlockVaultWithPasskey,
  unlockVaultWithPIN,
  getStoredCredId,
  exportVaultData,
  importVaultData,
} from "@/lib/vault-storage"
import { authenticatePasskey, isWebAuthnSupported } from "@/lib/webauthn-utils"

interface VaultUnlockProps {
  onUnlocked: () => void
}

export function VaultUnlock({ onUnlocked }: VaultUnlockProps) {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [credId, setCredId] = useState<string | null>(null)
  const [webAuthnSupported, setWebAuthnSupported] = useState(false)
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [activeTab, setActiveTab] = useState("passkey")
  const [importData, setImportData] = useState("")

  useEffect(() => {
    const initializeUnlock = async () => {
      setWebAuthnSupported(isWebAuthnSupported())

      if (isWebAuthnSupported()) {
        const storedCredId = await getStoredCredId()
        setCredId(storedCredId)
        if (!storedCredId) {
          setActiveTab("pin") // Default to PIN if no passkey available
        }
      } else {
        setActiveTab("pin") // Default to PIN if WebAuthn not supported
      }
    }

    initializeUnlock()
  }, [])

  const handlePasskeyUnlock = async () => {
    if (!credId) {
      setError("No passkey found. Please use PIN or import your vault.")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Authenticate with WebAuthn
      const { oxidikoId, signature } = await authenticatePasskey(credId)

      // Unlock vault with the authenticated signature
      await unlockVaultWithPasskey(oxidikoId, signature)

      onUnlocked()
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Authentication was cancelled or not allowed")
      } else if (err.name === "InvalidStateError") {
        setError("Passkey not found or invalid")
      } else if (err.message?.includes("Oxidiko ID mismatch")) {
        setError("Authentication failed - identity mismatch")
      } else {
        setError(err.message || "Failed to unlock vault. Please try again.")
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
      onUnlocked()
    } catch (err: any) {
      setError(err.message || "Invalid PIN or vault not found")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportVault = async () => {
    if (!importData.trim()) {
      setError("Please select a vault backup file")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await importVaultData(importData)
      setError("")
      setActiveTab("pin")
      setImportData("")
      alert("Vault imported successfully! You can now unlock with your PIN.")
    } catch (err: any) {
      setError(err.message || "Failed to import vault data")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload for vault import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          // Optionally validate JSON here
          setImportData(text)
          setError("")
        } catch (err: any) {
          setError("Invalid file format. Please upload a valid vault backup JSON file.")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExportVault = async () => {
    try {
      const vaultData = await exportVaultData()

      // Create download link
      const blob = new Blob([vaultData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `oxidiko-vault-backup-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || "Failed to export vault data")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-400">Unlock your Oxidiko Web Vault</p>
          </div>

          <Card className="bg-gray-950 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-center flex items-center justify-center gap-2">
                <Lock className="h-6 w-6" />
                Vault Locked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
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
                  <TabsTrigger value="import" className="data-[state=active]:bg-purple-600">
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="passkey" className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Use your passkey to unlock your vault</p>

                    <div className="bg-gray-800 p-4 rounded-lg mb-4">
                      <Fingerprint className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">
                        Touch your fingerprint sensor, use Face ID, or insert your security key
                      </p>
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
                        Unlock with Passkey
                      </>
                    )}
                  </Button>

                  {!credId && (
                    <p className="text-center text-sm text-gray-500">No passkey found. Use PIN or import your vault.</p>
                  )}
                </TabsContent>

                <TabsContent value="pin" className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Enter your backup PIN to unlock your vault</p>

                    <div className="bg-gray-800 p-4 rounded-lg mb-4">
                      <Lock className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">Use this method if you don't have access to your passkey</p>
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
                        Unlock with PIN
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="import" className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">Import your vault from another device</p>
                    <div className="bg-gray-800 p-4 rounded-lg mb-4">
                      <Upload className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">Upload your exported vault backup JSON file to restore access</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <input
                        id="vaultImportFile"
                        type="file"
                        accept="application/json"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('vaultImportFile')?.click()}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {importData ? "File Selected" : "Choose Vault File"}
                      </Button>
                      {importData && (
                        <span className="text-gray-400 text-sm">File ready for import</span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleImportVault}
                    disabled={isLoading || !importData.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Vault
                      </>
                    )}
                  </Button>

                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Need to export to another device?</p>
                    <Button
                      onClick={handleExportVault}
                      variant="outline"
                      className="w-full bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Current Vault
                    </Button>
                  </div>
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
