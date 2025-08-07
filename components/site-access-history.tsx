"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Globe, Calendar, Eye, Shield, Clock, Database } from 'lucide-react'
import { getSiteAccessHistory } from "@/lib/vault-storage"
import { useRouter } from "next/navigation"

interface SiteAccess {
  origin: string
  first_access: number
  last_access: number
  access_count: number
  accessed_fields: string[]
  recent_accesses: Array<{
    timestamp: number
    fields: string[]
    redirect_url?: string
  }>
}

export function SiteAccessHistory() {
  const [siteAccess, setSiteAccess] = useState<Record<string, SiteAccess>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadSiteAccess = async () => {
      try {
        const accessData = await getSiteAccessHistory()
        setSiteAccess(accessData)
      } catch (err) {
        console.error("Failed to load site access history:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSiteAccess()
  }, [])

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDomainFromOrigin = (origin: string) => {
    try {
      return new URL(origin).hostname
    } catch {
      return origin
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  const siteEntries = Object.entries(siteAccess)

  if (selectedSite && siteAccess[selectedSite]) {
    const site = siteAccess[selectedSite]
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => setSelectedSite(null)}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sites
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{getDomainFromOrigin(selectedSite)}</h1>
              <p className="text-gray-400">{selectedSite}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Access History */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Recent Access History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {site.recent_accesses?.map((access, index) => (
                      <div key={index} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-medium">
                            {formatDate(access.timestamp)}
                          </span>
                          <Badge className="bg-blue-900 text-blue-400">
                            {access.fields.length} field{access.fields.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {access.fields.map((field) => (
                            <div
                              key={field}
                              className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{getFieldIcon(field)}</span>
                              <span className="text-gray-300">{getFieldLabel(field)}</span>
                            </div>
                          ))}
                        </div>
                        {access.redirect_url && (
                          <div className="mt-2 text-xs text-gray-500">
                            Redirect: {access.redirect_url}
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No recent access history available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Site Statistics */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-400" />
                    Site Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Accesses</span>
                    <span className="text-white font-semibold">{site.access_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">First Access</span>
                    <span className="text-white text-sm">{formatDate(site.first_access)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Last Access</span>
                    <span className="text-white text-sm">{formatDate(site.last_access)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Accessed Fields */}
              <Card className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    Accessed Fields
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {site.accessed_fields?.map((field) => (
                      <div
                        key={field}
                        className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
                      >
                        <span className="text-lg">{getFieldIcon(field)}</span>
                        <div>
                          <div className="text-white font-medium">{getFieldLabel(field)}</div>
                          <div className="text-gray-400 text-sm">Encrypted before transmission</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4">
                        <p className="text-gray-400">No fields accessed</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => router.back()}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Site Access History</h1>
            <p className="text-gray-400">View all sites that have accessed your encrypted data</p>
          </div>
        </div>

        {siteEntries.length === 0 ? (
          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="text-center py-12">
              <Globe className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Site Access History</h3>
              <p className="text-gray-400">
                No websites have accessed your data yet. When you authenticate with sites using Oxidiko, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {siteEntries.map(([origin, data]) => (
              <Card
                key={origin}
                className="bg-gray-950 border-gray-800 hover:bg-gray-900 transition-colors cursor-pointer"
                onClick={() => setSelectedSite(origin)}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-400" />
                    {getDomainFromOrigin(origin)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Accesses</span>
                    <Badge className="bg-blue-900 text-blue-400">{data.access_count}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fields Accessed</span>
                    <Badge className="bg-purple-900 text-purple-400">
                      {data.accessed_fields?.length || 0}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <span className="text-gray-400 text-sm">Last Access</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-white text-sm">{formatDate(data.last_access)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {data.accessed_fields?.slice(0, 3).map((field) => (
                      <span key={field} className="text-xs bg-gray-800 px-2 py-1 rounded">
                        {getFieldIcon(field)}
                      </span>
                    ))}
                    {data.accessed_fields?.length > 3 && (
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                        +{data.accessed_fields.length - 3}
                      </span>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white mt-4"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSite(origin)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
