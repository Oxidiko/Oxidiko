// CANCELLED

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Shield,
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  RefreshCw,
  Trash2,
  Crown,
  Zap,
  Star,
  Gift,
  CheckCircle,
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
} from "lucide-react"
import { getAPIKeyStats, getAllAPIKeys, revokeAPIKey, activateAPIKey } from "@/lib/api-validation"
import { AnimatedBackground } from "@/components/animated-background"
import crypto from "crypto"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
}

interface APIKeyStats {
  total: number
  byPlan: Record<string, number>
  active: number
  inactive: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<APIKeyStats | null>(null)
  const [apiKeys, setApiKeys] = useState<APIKeyData[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [processingKey, setProcessingKey] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)

    try {
      if (!username || !password) {
        throw new Error("Username and password are required")
      }

      // Call server API for authentication
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || "Authentication failed")
      }

      if (data.token) {
        localStorage.setItem("admin_jwt", data.token)
      }
      setIsAuthenticated(true)
      await loadDashboardData()
    } catch (err: any) {
      setLoginError(err.message || "Authentication failed")
    } finally {
      setLoginLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setError("")
      const token = localStorage.getItem("admin_jwt")
      const [statsData, keysData] = await Promise.all([
        getAPIKeyStats(token),
        getAllAPIKeys(token)
      ])
      setStats(statsData)
      setApiKeys(keysData)
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await loadDashboardData()
    } catch (err: any) {
      setError(err.message || "Failed to refresh data")
    } finally {
      setRefreshing(false)
    }
  }

  const handleRevokeKey = async (apiKey: string) => {
    setProcessingKey(apiKey)
    try {
      await revokeAPIKey(apiKey)
      await loadDashboardData() // Refresh data after revoking
    } catch (err: any) {
      setError(err.message || "Failed to revoke API key")
    } finally {
      setProcessingKey(null)
    }
  }

  const handleActivateKey = async (apiKey: string) => {
    setProcessingKey(apiKey)
    try {
      await activateAPIKey(apiKey)
      await loadDashboardData() // Refresh data after activating
    } catch (err: any) {
      setError(err.message || "Failed to activate API key")
    } finally {
      setProcessingKey(null)
    }
  }

  const getPlanName = (planId: string) => {
    switch (planId) {
      case "free":
        return "Free"
      case "starter":
        return "Starter"
      case "premium":
        return "Premium"
      case "elite":
        return "Elite"
      case "payg":
        return "Pay-as-you-go"
      default:
        return planId
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free":
        return <Gift className="h-4 w-4" />
      case "starter":
        return <Zap className="h-4 w-4" />
      case "premium":
        return <Star className="h-4 w-4" />
      case "elite":
        return <Crown className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getPlanIconColor = (planId: string) => {
    switch (planId) {
      case "free":
        return "text-gray-400"
      case "starter":
        return "text-blue-400"
      case "premium":
        return "text-purple-400"
      case "elite":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case "free":
        return "bg-gray-900 text-gray-400"
      case "starter":
        return "bg-blue-900 text-blue-400"
      case "premium":
        return "bg-purple-900 text-purple-400"
      case "elite":
        return "bg-yellow-900 text-yellow-400"
      default:
        return "bg-gray-900 text-gray-400"
    }
  }

  // Plan prices in dollars
  const planPrices: Record<string, number> = {
    free: 0,
    starter: 15,
    premium: 50,
    elite: 150,
  }

  // Calculate active plans and revenue per plan
  const planActiveCounts: Record<string, number> = {
    free: 0,
    starter: 0,
    premium: 0,
    elite: 0,
  }
  apiKeys.forEach((key) => {
    if (key.isActive && planActiveCounts.hasOwnProperty(key.planId)) {
      planActiveCounts[key.planId]++
    }
  })
  const planRevenues: Record<string, number> = {
    free: 0,
    starter: planActiveCounts.starter * planPrices.starter,
    premium: planActiveCounts.premium * planPrices.premium,
    elite: planActiveCounts.elite * planPrices.elite,
  }
  const totalRevenue = planRevenues.starter + planRevenues.premium + planRevenues.elite

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <AnimatedBackground />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <Button
            onClick={() => router.push("/")}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <Shield className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
              <p className="text-gray-400">Enter your credentials to access the admin dashboard</p>
            </div>

            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-center">Admin Login</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="username">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter admin username"
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white" htmlFor="password">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
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

                  {loginError && (
                    <Alert className="bg-red-900/20 border-red-800">
                      <AlertDescription className="text-red-400">{loginError}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={loginLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {loginLoading ? "Authenticating..." : "Login"}
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
          onClick={() => router.push("/")}
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">Manage Oxidiko API keys and monitor usage</p>
          </div>

          {error && (
            <Alert className="bg-red-900/20 border-red-800 mb-6">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {/* Overview Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total API Keys</p>
                    <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CircleCheck className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Active Keys</p>
                    <p className="text-2xl font-bold text-white">{stats?.active || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CircleX className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="text-sm text-gray-400">Inactive Keys</p>
                    <p className="text-2xl font-bold text-white">{stats?.inactive || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Companies</p>
                    <p className="text-2xl font-bold text-white">{apiKeys.length}</p>
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
              <TabsTrigger value="companies" className="data-[state=active]:bg-purple-600">
                <Building2 className="h-4 w-4 mr-2" />
                Companies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Plan Distribution */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Plan Distribution
                    <span className="text-sm text-gray-400 font-normal ml-2">{`$${totalRevenue}`}/month total</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {["free", "starter", "premium", "elite"].map((plan) => (
                      <div key={plan} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={getPlanIconColor(plan)}>
                            {plan === "free" && <Gift className="h-5 w-5" />}
                            {plan === "starter" && <Zap className="h-5 w-5" />}
                            {plan === "premium" && <Star className="h-5 w-5" />}
                            {plan === "elite" && <Crown className="h-5 w-5" />}
                          </div>
                          <p className="text-sm text-gray-400">{getPlanName(plan)}</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats?.byPlan[plan] || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          ${planRevenues[plan]}/month
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-400" />
                    Recent API Keys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiKeys.slice(0, 5).map((key) => (
                      <div key={key.apiKey} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-semibold text-white">{key.companyName}</p>
                            <p className="text-sm text-gray-400">{key.companyEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPlanColor(key.planId)}>{getPlanName(key.planId)}</Badge>
                          <Badge className={key.isActive ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}>
                            {key.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="companies" className="space-y-6">
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-400" />
                    All Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Company</TableHead>
                          <TableHead className="text-gray-400">Email</TableHead>
                          <TableHead className="text-gray-400">Plan</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Usage</TableHead>
                          <TableHead className="text-gray-400">Created</TableHead>
                          <TableHead className="text-gray-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {apiKeys.map((key) => (
                          <TableRow key={key.apiKey} className="border-gray-800">
                            <TableCell className="text-white font-medium">{key.companyName}</TableCell>
                            <TableCell className="text-gray-300">{key.companyEmail}</TableCell>
                            <TableCell>
                              <Badge className={getPlanColor(key.planId)}>
                                {getPlanIcon(key.planId)}
                                <span className="ml-1">{getPlanName(key.planId)}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={key.isActive ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}
                              >
                                {key.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{key.quota}</TableCell>
                            <TableCell className="text-gray-300">
                              {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "Unknown"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {key.isActive ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={processingKey === key.apiKey}
                                        className="bg-red-900 hover:bg-red-800"
                                      >
                                        {processingKey === key.apiKey ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gray-950 border-gray-800">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white">Deactivate API Key</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-400">
                                          Are you sure you want to deactivate the API key for {key.companyName}? This
                                          action will immediately disable their access.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleRevokeKey(key.apiKey)}
                                          className="bg-red-900 hover:bg-red-800"
                                        >
                                          Deactivate
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        disabled={processingKey === key.apiKey}
                                        className="bg-green-900 hover:bg-green-800 text-green-100"
                                      >
                                        {processingKey === key.apiKey ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gray-950 border-gray-800">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white">Activate API Key</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-400">
                                          Are you sure you want to activate the API key for {key.companyName}? This will
                                          restore their access to the API.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleActivateKey(key.apiKey)}
                                          className="bg-green-900 hover:bg-green-800"
                                        >
                                          Activate
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {apiKeys.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No API keys found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
