"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Globe, Calendar, Eye, Shield, Clock, Database, X } from 'lucide-react'
import { getSiteAccessHistory } from "@/lib/vault-storage"

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
    encrypted_data?: string
    encryption_iv?: string
  }>
  site_url: string
}

interface SiteAccessHistoryProps {
  isOpen: boolean
  onClose: () => void
}

export function SiteAccessHistory({ isOpen, onClose }: SiteAccessHistoryProps) {
  const [siteAccess, setSiteAccess] = useState<Record<string, SiteAccess>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadSiteAccess()
    }
  }, [isOpen])

  const loadSiteAccess = async () => {
    try {
      setIsLoading(true)
      const accessData = await getSiteAccessHistory()
      setSiteAccess(accessData)
    } catch (err) {
      console.error("Failed to load site access history:", err)
    } finally {
      setIsLoading(false)
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

  const siteEntries = Object.entries(siteAccess)

  if (selectedSite && siteAccess[selectedSite]) {
    const site = siteAccess[selectedSite]
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setSelectedSite(null)}
                  size="sm"
                  className="bg-gray-800 hover:bg-gray-700 text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sites
                </Button>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {getDomainFromOrigin(selectedSite)}
                  </DialogTitle>
                  <p className="text-gray-400 text-sm">{selectedSite}</p>
                </div>
              </div>
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="grid lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
            <div className="lg:col-span-2 space-y-4">
              {/* Recent Access History */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-blue-400" />
                    Recent Access History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {site.recent_accesses?.map((access, index) => (
                      <div key={index} className="bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium text-sm">
                            {formatDate(access.timestamp)}
                          </span>
                          <Badge className="bg-blue-900 text-blue-400 text-xs">
                            {access.fields.length} field{access.fields.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {access.fields.map((field) => (
                            <div
                              key={field}
                              className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-xs"
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
                        {access.encrypted_data && (
                          <div className="mt-2 text-xs text-green-400">
                            ✓ Data encrypted before transmission
                          </div>
                        )}
                      </div>
                    )) || (
                      <div className="text-center py-6">
                        <p className="text-gray-400">No recent access history available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {/* Site Statistics */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5 text-green-400" />
                    Site Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total Accesses</span>
                    <span className="text-white font-semibold">{site.access_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">First Access</span>
                    <span className="text-white text-xs">{formatDate(site.first_access)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Last Access</span>
                    <span className="text-white text-xs">{formatDate(site.last_access)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Accessed Fields */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-purple-400" />
                    Accessed Fields
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {site.accessed_fields?.map((field) => (
                      <div
                        key={field}
                        className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg"
                      >
                        <span className="text-lg">{getFieldIcon(field)}</span>
                        <div>
                          <div className="text-white font-medium text-sm">{getFieldLabel(field)}</div>
                          <div className="text-gray-400 text-xs">Encrypted before transmission</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-3">
                        <p className="text-gray-400 text-sm">No fields accessed</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gray-950 border-gray-800 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Site Access History</DialogTitle>
              <p className="text-gray-400">View all sites that have accessed your encrypted data</p>
            </div>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : siteEntries.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="text-center py-12">
                <Globe className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Site Access History</h3>
                <p className="text-gray-400">
                  No websites have accessed your data yet. When you authenticate with sites using Oxidiko, they'll appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {siteEntries.map(([origin, data]) => (
                <Card
                  key={origin}
                  className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => setSelectedSite(origin)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                      <Globe className="h-5 w-5 text-blue-400" />
                      {getDomainFromOrigin(origin)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Accesses</span>
                      <Badge className="bg-blue-900 text-blue-400">{data.access_count}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Fields Accessed</span>
                      <Badge className="bg-purple-900 text-purple-400">
                        {data.accessed_fields?.length || 0}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <span className="text-gray-400 text-xs">Last Access</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="text-white text-xs">{formatDate(data.last_access)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
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
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white mt-3"
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
      </DialogContent>
    </Dialog>
  )
}
