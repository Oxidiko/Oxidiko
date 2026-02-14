"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  BarChart3,
  Key,
  Building2,
  Mail,
  Calendar,
  Activity,
  RefreshCw,
} from "lucide-react"
import { unlockAPIVault, checkAPIVaultExists } from "@/lib/api-storage"
import { getAPIKeyDataByEmail, validateAPIKey } from "@/lib/api-validation"
import { AnimatedBackground } from "@/components/animated-background"

interface APIKeyData {
  companyName: string
  companyEmail: string
  apiKey: string
  quota: string
  planId: string
  isActive: boolean
  subscriptionId?: string
  createdAt?: string
  updatedAt?: string
  publicKey?: string
  privateKey?: string
}

export default function APIDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [vaultData, setVaultData] = useState<any>(null)
  const [databaseData, setDatabaseData] = useState<APIKeyData | null>(null)
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; canUse: boolean } | null>(null)

  useEffect(() => {
    checkForAPIVault()
  }, [])

  const checkForAPIVault = async () => {
    try {
      // Check if any API vault exists in IndexedDB
      const hasVault = await checkAPIVaultExists("")

      if (!hasVault) {
        // No API vault found, redirect to API page
        router.push("/api")
        return
      }

      setIsLoading(false)
    } catch (err) {
      console.error("Error checking API vault:", err)
      router.push("/api")
    }
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!email) {
        throw new Error("Email is required")
      }
      if (!password) {
        throw new Error("Password is required")
      }

      // Unlock vault directly with provided email and password
      const unlockedData = await unlockAPIVault(email, password)
      if (!unlockedData) {
        throw new Error("Invalid email or password")
      }

      setVaultData(unlockedData)
      setIsUnlocked(true)

      // Fetch data from database using API key validation
      await fetchDatabaseData(unlockedData.companyEmail, unlockedData.apiKey)
    } catch (err: any) {
      setError(err.message || "Failed to unlock vault")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDatabaseData = async (email: string, apiKey: string) => {
    try {
      // First validate the API key to get current quota
      const validation = await validateAPIKey(apiKey)
      setValidationResult({ valid: validation.valid, canUse: validation.canUse })
      if (validation.valid && validation.keyData) {
        setDatabaseData(validation.keyData)
      } else {
        // Fallback to email lookup if validation fails
        const data = await getAPIKeyDataByEmail(email)
        setDatabaseData(data)
      }
    } catch (err) {
      console.error("Failed to fetch database data:", err)
      setValidationResult(null)
      // Fallback to email lookup
      try {
        const data = await getAPIKeyDataByEmail(email)
        setDatabaseData(data)
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr)
      }
    }
  }

  const refreshData = async () => {
    if (!vaultData) return

    setRefreshing(true)
    try {
      await fetchDatabaseData(vaultData.companyEmail, vaultData.apiKey)
    } catch (err) {
      console.error("Failed to refresh data:", err)
    } finally {
      setRefreshing(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getUsagePercentage = () => {
    if (!databaseData?.quota) return 0
    const [used, total] = databaseData.quota.split("/").map(Number)
    return (used / total) * 100
  }

  const getPlanName = (planId: string) => {
    switch (planId) {
      case "free":
        return "Free"
      case "starter":
        return "Starter"
      case "premium":
        return "Premium"
      case "payg":
        return "Pay-as-you-go"
      default:
        return planId
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <AnimatedBackground />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Button
            onClick={() => router.push("/api")}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to API
          </Button>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Shield className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">API Dashboard</h1>
              <p className="text-gray-400">Enter your email and password to access your API dashboard</p>
            </div>

            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-center">Unlock API Vault</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your company email"
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your API vault password"
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                        required
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 h-auto"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <Alert className="bg-red-900/20 border-red-800">
                      <AlertDescription className="text-red-400">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isLoading ? "Unlocking..." : "Unlock Dashboard"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
        <Button
          onClick={() => router.push("/api")}
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to API
        </Button>

        <Button
          onClick={refreshData}
          disabled={refreshing}
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              API Dashboard
            </h1>
            <p className="text-gray-400">Manage your Oxidiko API integration</p>
          </div>

          {/* Overview Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Company</p>
                    <p className="font-semibold text-white">{vaultData?.companyName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-semibold text-white">{vaultData?.companyEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Plan</p>
                    <p className="font-semibold text-white">{getPlanName(vaultData?.planId || "")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <Badge
                      className={
                        validationResult
                          ? validationResult.valid && validationResult.canUse
                            ? "bg-green-900 text-green-400"
                            : "bg-red-900 text-red-400"
                          : databaseData?.isActive
                            ? "bg-green-900 text-green-400"
                            : "bg-red-900 text-red-400"
                      }
                    >
                      {validationResult
                        ? validationResult.valid && validationResult.canUse
                          ? "Active"
                          : "Inactive"
                        : databaseData?.isActive
                          ? "Active"
                          : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="apikey" className="data-[state=active]:bg-purple-600">
                <Key className="h-4 w-4 mr-2" />
                API Key
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Usage Statistics */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {databaseData?.quota ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">API Calls This Month</span>
                          <span className="text-white">{databaseData.quota}</span>
                        </div>
                        <Progress value={getUsagePercentage()} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {getUsagePercentage().toFixed(1)}% of monthly quota used
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-sm text-gray-400">Calls Used</p>
                          <p className="text-2xl font-bold text-white">{databaseData.quota.split("/")[0]}</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-sm text-gray-400">Monthly Limit</p>
                          <p className="text-2xl font-bold text-white">{databaseData.quota.split("/")[1]}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No usage data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-400" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">
                        {databaseData?.createdAt ? new Date(databaseData.createdAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Last Updated</p>
                      <p className="text-white">
                        {databaseData?.updatedAt ? new Date(databaseData.updatedAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                    {databaseData?.subscriptionId && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-400">Subscription ID</p>
                        <p className="text-white font-mono text-sm">{databaseData.subscriptionId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apikey" className="space-y-6">
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-400" />
                    API Key Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={vaultData?.apiKey || ""}
                        readOnly
                        className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(vaultData?.apiKey || "")}
                        size="sm"
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Private Key (RSA)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={databaseData?.privateKey || "Not generated yet"}
                        readOnly
                        type={databaseData?.privateKey ? "password" : "text"}
                        className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(databaseData?.privateKey || "")}
                        disabled={!databaseData?.privateKey}
                        size="sm"
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-red-400">
                      <strong>WARNING:</strong> This is your specialized private key for decrypting user data.
                      Oxidiko does not use this key; it is provided for your backend to decrypt sensitive fields.
                      Keep it safe!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Public Key (RSA)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={databaseData?.publicKey || "Not generated yet"}
                        readOnly
                        className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(databaseData?.publicKey || "")}
                        disabled={!databaseData?.publicKey}
                        size="sm"
                        className="bg-gray-700 hover:bg-gray-600"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Alert className="bg-blue-900/20 border-blue-800">
                    <AlertDescription className="text-blue-400">
                      Keep your API key and Private Key secure. Never share them publicly.
                      The Private Key is used to decrypt the data Oxidiko sends to your backend.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Usage Example</h4>
                    <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                      {`// 1. Client-side Auth
const authUrl = 'https://oxidiko.com/login?' + 
  'fields=email,name&' +
  'redirect=https://yourapp.com/callback&' +
  'api_key=${vaultData?.apiKey || "your-api-key"}'

window.open(authUrl, 'oxidiko-auth', 'width=400,height=600')

// 2. Server-side Decryption (Node.js)
// Received 'token' (JWT) contains encrypted 'data' blob
const privateKey = process.env.OXIDIKO_PRIVATE_KEY;
const decrypted = crypto.privateDecrypt(
  {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256",
  },
  Buffer.from(encryptedData, "base64")
);
`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
