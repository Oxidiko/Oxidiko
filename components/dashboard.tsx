"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, User, Mail, Calendar, Phone, MapPin, Lock, Copy, Edit, Save, X, Globe, Flag, CreditCard, Languages, Upload, Download, Trash2, Eye, EyeOff, Fingerprint, Check, Skull, AlertTriangle } from 'lucide-react'
import {
  getDecryptedProfile,
  lockVault,
  updateProfile,
  exportVaultData,
  obliterateVault,
  unlockVaultWithPasskey,
  unlockVaultWithPIN,
  getStoredCredId,
  getCurrentOxidikoId,
  getRecentSiteAccesses,
} from "@/lib/vault-storage"
import { getCountryNames, getNationalityNames } from "@/lib/countries"
import { authenticatePasskey, isWebAuthnSupported } from "@/lib/webauthn-utils"
import { Analytics } from "@vercel/analytics/next"
import { SiteAccessHistory } from "@/components/site-access-history"

interface Profile {
  name: string
  email: string
  username: string
  birthdate: string
  phone: string
  address: string
  country: string
  nationality: string
  gender: string
  language: string
  creditCard: string
  creditCardExpiry: string
  creditCardCCV: string
  profilePicture: string
}

export function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const [showObliterateDialog, setShowObliterateDialog] = useState(false)
  const [obliterateStep, setObliterateStep] = useState<"confirm" | "auth">("confirm")
  const [obliteratePin, setObliteratePin] = useState("")
  const [showObliteratePin, setShowObliteratePin] = useState(false)
  const [obliterateError, setObliterateError] = useState("")
  const [isObliterating, setIsObliterating] = useState(false)
  const [credId, setCredId] = useState<string | null>(null)
  const [webAuthnSupported, setWebAuthnSupported] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showBackupWarning, setShowBackupWarning] = useState(false)
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false)
  const [recentSiteAccesses, setRecentSiteAccesses] = useState<any[]>([])
  const [showSiteHistory, setShowSiteHistory] = useState(false)

  const countries = getCountryNames()
  const nationalities = getNationalityNames()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getDecryptedProfile()
        setProfile(profileData)

        // Check if this is the first time accessing dashboard after profile setup
        const hasSeenBackupWarning = localStorage.getItem("oxidiko_backup_warning_seen")
        if (!hasSeenBackupWarning) {
          setShowBackupWarning(true)
        }

        // Load recent site accesses
        try {
          const recentAccesses = await getRecentSiteAccesses()
          setRecentSiteAccesses(recentAccesses)
        } catch (err) {
          console.error("Failed to load recent site accesses:", err)
        }
      } catch (err) {
        console.error("Failed to load profile:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      setWebAuthnSupported(isWebAuthnSupported())
      if (isWebAuthnSupported()) {
        const storedCredId = await getStoredCredId()
        setCredId(storedCredId)
      }
    }
    initializeAuth()
  }, [])

  const handleLockVault = () => {
    lockVault()
    window.location.reload()
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const handleEdit = () => {
    setEditingProfile({ ...profile! })
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (editingProfile) {
      try {
        await updateProfile(editingProfile)
        setProfile(editingProfile)
        setIsEditing(false)
        setEditingProfile(null)
      } catch (err) {
        console.error("Failed to update profile:", err)
      }
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditingProfile(null)
  }

  const handleInputChange = (field: string, value: string) => {
    if (editingProfile) {
      setEditingProfile({ ...editingProfile, [field]: value })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editingProfile) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setEditingProfile({ ...editingProfile, profilePicture: event.target?.result as string })
      }
      reader.readAsDataURL(file)
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

  const handleForceBackupDownload = async () => {
    setIsDownloadingBackup(true)
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

      // Mark as seen and close dialog
      localStorage.setItem("oxidiko_backup_warning_seen", "true")
      setShowBackupWarning(false)
    } catch (err: any) {
      setError(err.message || "Failed to export vault data")
    } finally {
      setIsDownloadingBackup(false)
    }
  }

  const handleObliterateVault = () => {
    setShowObliterateDialog(true)
    setObliterateStep("confirm")
    setObliterateError("")
    setObliteratePin("")
  }

  const handleObliterateConfirm = () => {
    setObliterateStep("auth")
  }

  const handleObliterateCancel = () => {
    setShowObliterateDialog(false)
    setObliterateStep("confirm")
    setObliterateError("")
    setObliteratePin("")
  }

  const handleObliterateWithPasskey = async () => {
    if (!credId) {
      setObliterateError("No passkey found. Please use PIN.")
      return
    }

    setObliterateError("")
    setIsObliterating(true)

    try {
      // Authenticate with WebAuthn
      const { oxidikoId, signature } = await authenticatePasskey(credId)

      // Verify authentication by attempting to unlock (without actually unlocking)
      await unlockVaultWithPasskey(oxidikoId, signature)

      // If we get here, authentication was successful
      await obliterateVault()

      // Redirect to login page
      window.location.href = "/"
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setObliterateError("Authentication was cancelled or not allowed")
      } else if (err.name === "InvalidStateError") {
        setObliterateError("Passkey not found or invalid")
      } else {
        setObliterateError(err.message || "Authentication failed")
      }
    } finally {
      setIsObliterating(false)
    }
  }

  const handleObliterateWithPin = async () => {
    if (obliteratePin.length < 8) {
      setObliterateError("PIN must be at least 8 characters long")
      return
    }

    setObliterateError("")
    setIsObliterating(true)

    try {
      // Verify PIN by attempting to unlock (without actually unlocking)
      await unlockVaultWithPIN(obliteratePin)

      // If we get here, PIN was correct
      await obliterateVault()

      // Redirect to login page
      window.location.href = "/"
    } catch (err: any) {
      setObliterateError("Invalid PIN")
    } finally {
      setIsObliterating(false)
    }
  }

  const handleViewSiteHistory = () => {
    setShowSiteHistory(true)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
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

  const currentProfile = isEditing ? editingProfile : profile

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-bold">Oxidiko Web Vault</h1>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} className="bg-gray-800 hover:bg-gray-700 text-white flex-1 sm:flex-none">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit} className="bg-gray-800 hover:bg-gray-700 text-white flex-1 sm:flex-none">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            <Button onClick={handleLockVault} className="bg-gray-800 hover:bg-gray-700 text-white flex-1 sm:flex-none">
              <Lock className="h-4 w-4 mr-2" />
              Lock Vault
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Identity Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentProfile && (
                  <>
                    {/* Profile Picture */}
                    <div className="flex justify-center mb-4 sm:mb-6">
                      <div className="relative">
                        {currentProfile.profilePicture ? (
                          <img
                            src={currentProfile.profilePicture || "/placeholder.svg"}
                            alt="Profile"
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-700"
                          />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                            <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          </div>
                        )}
                        {isEditing && (
                          <label
                            htmlFor="profilePictureEdit"
                            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 rounded-full p-1.5 sm:p-2 cursor-pointer"
                          >
                            <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </label>
                        )}
                        <input
                          id="profilePictureEdit"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">Full Name</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Input
                              value={currentProfile.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                              className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                              placeholder="Full Name"
                            />
                          ) : (
                            <span className="text-white">{currentProfile.name || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.name, "name")}
                              className={`ml-2 ${copiedField === "name" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "name" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Username */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">Username</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Input
                              value={currentProfile.username}
                              onChange={(e) => handleInputChange("username", e.target.value)}
                              className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                              placeholder="Username"
                            />
                          ) : (
                            <span className="text-white">{currentProfile.username || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.username, "username")}
                              className={`ml-2 ${copiedField === "username" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "username" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">Email</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Input
                              type="email"
                              value={currentProfile.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                              placeholder="Email"
                            />
                          ) : (
                            <span className="text-white">{currentProfile.email || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.email, "email")}
                              className={`ml-2 ${copiedField === "email" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "email" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Birth Date */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Birth Date</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={currentProfile.birthdate}
                              onChange={(e) => handleInputChange("birthdate", e.target.value)}
                              className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                            />
                          ) : (
                            <span className="text-white">{currentProfile.birthdate || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.birthdate, "birthdate")}
                              className={`ml-2 ${copiedField === "birthdate" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "birthdate" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">Phone</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Input
                              type="tel"
                              value={currentProfile.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                              placeholder="Phone"
                            />
                          ) : (
                            <span className="text-white">{currentProfile.phone || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.phone, "phone")}
                              className={`ml-2 ${copiedField === "phone" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "phone" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Country */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">Country</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Select
                              value={currentProfile.country}
                              onValueChange={(value) => handleInputChange("country", value)}
                            >
                              <SelectTrigger className="bg-transparent border-none text-white h-auto p-0">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                                {countries.map((country) => (
                                  <SelectItem
                                    key={country.code}
                                    value={country.name}
                                    className="text-white hover:bg-gray-700"
                                  >
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-white">{currentProfile.country || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.country, "country")}
                              className={`ml-2 ${copiedField === "country" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "country" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Nationality */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Flag className="h-4 w-4" />
                          <span className="text-sm">Nationality</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Select
                              value={currentProfile.nationality}
                              onValueChange={(value) => handleInputChange("nationality", value)}
                            >
                              <SelectTrigger className="bg-transparent border-none text-white h-auto p-0">
                                <SelectValue placeholder="Select nationality" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                                {nationalities.map((nationality) => (
                                  <SelectItem
                                    key={nationality.code}
                                    value={nationality.name}
                                    className="text-white hover:bg-gray-700"
                                  >
                                    {nationality.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-white">{currentProfile.nationality || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.nationality, "nationality")}
                              className={`ml-2 ${copiedField === "nationality" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "nationality" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">Gender</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Select
                              value={currentProfile.gender}
                              onValueChange={(value) => handleInputChange("gender", value)}
                            >
                              <SelectTrigger className="bg-transparent border-none text-white h-auto p-0">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="male" className="text-white hover:bg-gray-700">
                                  Male
                                </SelectItem>
                                <SelectItem value="female" className="text-white hover:bg-gray-700">
                                  Female
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-white">{currentProfile.gender || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.gender, "gender")}
                              className={`ml-2 ${copiedField === "gender" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "gender" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Language */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                          <Languages className="h-4 w-4" />
                          <span className="text-sm">Language</span>
                        </div>
                        <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                          {isEditing ? (
                            <Input
                              value={currentProfile.language}
                              onChange={(e) => handleInputChange("language", e.target.value)}
                              className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                              placeholder="Language"
                            />
                          ) : (
                            <span className="text-white">{currentProfile.language || "Not set"}</span>
                          )}
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(currentProfile.language, "language")}
                              className={`ml-2 ${copiedField === "language" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                            >
                              {copiedField === "language" ? (
                                <Check className="h-4 w-4 text-green-300" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">Address</span>
                      </div>
                      <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                        {isEditing ? (
                          <Input
                            value={currentProfile.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                            placeholder="Address"
                          />
                        ) : (
                          <span className="text-white">{currentProfile.address || "Not set"}</span>
                        )}
                        {!isEditing && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(currentProfile.address, "address")}
                            className={`ml-2 ${copiedField === "address" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                          >
                            {copiedField === "address" ? (
                              <Check className="h-4 w-4 text-green-300" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Credit Card Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <span className="text-sm">Credit Card</span>
                          </div>
                          <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                            {isEditing ? (
                              <Input
                                value={currentProfile.creditCard}
                                onChange={(e) => handleInputChange("creditCard", e.target.value)}
                                className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                                placeholder="Card Number"
                              />
                            ) : (
                              <span className="text-white">{currentProfile.creditCard || "Not set"}</span>
                            )}
                            {!isEditing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(currentProfile.creditCard, "creditCard")}
                                className={`ml-2 ${copiedField === "creditCard" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                              >
                                {copiedField === "creditCard" ? (
                                  <Check className="h-4 w-4 text-green-300" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <span className="text-sm">Expiry</span>
                          </div>
                          <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                            {isEditing ? (
                              <Input
                                value={currentProfile.creditCardExpiry}
                                onChange={(e) => handleInputChange("creditCardExpiry", e.target.value)}
                                className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                                placeholder="MM/YY"
                              />
                            ) : (
                              <span className="text-white">{currentProfile.creditCardExpiry || "Not set"}</span>
                            )}
                            {!isEditing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(currentProfile.creditCardExpiry, "creditCardExpiry")}
                                className={`ml-2 ${copiedField === "creditCardExpiry" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                              >
                                {copiedField === "creditCardExpiry" ? (
                                  <Check className="h-4 w-4 text-green-300" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <span className="text-sm">CCV</span>
                          </div>
                          <div className="bg-sky-900/30 border border-sky-800/50 rounded-lg p-3 flex items-center justify-between">
                            {isEditing ? (
                              <Input
                                value={currentProfile.creditCardCCV}
                                onChange={(e) => handleInputChange("creditCardCCV", e.target.value)}
                                className="bg-transparent border-none text-white placeholder-gray-400 p-0 h-auto focus-visible:ring-0"
                                placeholder="CCV"
                              />
                            ) : (
                              <span className="text-white">{currentProfile.creditCardCCV || "Not set"}</span>
                            )}
                            {!isEditing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(currentProfile.creditCardCCV, "creditCardCCV")}
                                className={`ml-2 ${copiedField === "creditCardCCV" ? "bg-green-700 hover:bg-green-800" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
                              >
                                {copiedField === "creditCardCCV" ? (
                                  <Check className="h-4 w-4 text-green-300" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Security Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Vault Status</span>
                  <Badge className="bg-green-900 text-green-400 hover:bg-green-900">Unlocked</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Encryption</span>
                  <Badge className="bg-blue-900 text-blue-400 hover:bg-blue-900">AES-GCM</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Storage</span>
                  <Badge className="bg-purple-900 text-purple-400 hover:bg-purple-900">Local</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Oxidiko ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-mono">{getCurrentOxidikoId()?.substring(0, 16)}...</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(getCurrentOxidikoId() || "", "oxidikoId")}
                      className={`text-gray-400 hover:text-white hover:bg-gray-700 p-1 h-auto ${copiedField === "oxidikoId" ? "bg-green-700 hover:bg-green-800" : ""}`}
                    >
                      {copiedField === "oxidikoId" ? (
                        <Check className="h-3 w-3 text-green-300" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={handleExportVault}
                    className="w-full bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Vault Backup
                  </Button>
                  <Button
                    onClick={handleObliterateVault}
                    variant="outline"
                    className="w-full bg-red-900 text-red-400 border-red-800 hover:bg-red-800 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Obliterate Vault
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Site Access */}
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-green-400" />
                    Recent Site Access
                  </span>
                  <Button
                    onClick={handleViewSiteHistory}
                    size="sm"
                    className="bg-gray-800 hover:bg-gray-700 text-white"
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSiteAccesses.length > 0 ? (
                  <div className="space-y-3">
                    {recentSiteAccesses.map((access, index) => (
                      <div key={index} className="bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-medium">
                            {getDomainFromOrigin(access.origin)}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {formatDate(access.timestamp)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {access.fields.slice(0, 3).map((field: string) => (
                            <span key={field} className="text-xs bg-gray-700 px-2 py-1 rounded">
                              {field === "name" ? "👤" : 
                               field === "email" ? "📧" : 
                               field === "phone" ? "📱" : 
                               field === "none" ? "🚫" : "📄"}
                            </span>
                          ))}
                          {access.fields.length > 3 && (
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-400">
                              +{access.fields.length - 3}
                            </span>
                          )}
                        </div>
                        {access.encrypted_data && (
                          <div className="mt-2 text-xs text-green-400">
                            ✓ Data encrypted before transmission
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Globe className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No recent site access</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <Card className="bg-red-950/20 border-red-800">
                <CardContent className="pt-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Site Access History Popup */}
        <SiteAccessHistory 
          isOpen={showSiteHistory} 
          onClose={() => setShowSiteHistory(false)} 
        />

        {/* Backup Warning Dialog - Custom Styled */}
        <Dialog open={showBackupWarning} onOpenChange={() => {}}>
          <DialogContent
            className="overflow-y-auto border border-[var(--border-dark,#1e293b)] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
            style={{
              background: 'linear-gradient(145deg, #0f172a, #020617)',
              width: '90vw',
              maxWidth: '800px',
              height: '95vh',
              padding: 0,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              borderRadius: '16px',
              border: '1px solid #1e293b',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 24, borderBottom: '1px solid #1e293b' }}>
              <div className="flex items-center gap-3" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                <Skull className="h-7 w-7" style={{ color: '#ef4444' }} />
                BACK UP YOUR VAULT OR REGRET IT FOREVER
              </div>
            </div>
            <div style={{ padding: 24, lineHeight: 1.6, maxHeight: 'calc(95vh - 80px)', overflowY: 'auto' }}>
              <p style={{ fontWeight: 600, marginBottom: 20, color: '#fff' }}>
                Listen up: your vault is your life. If you don't save it somewhere safe, don't come crying when it's gone.
              </p>
              <ul style={{ margin: '20px 0', paddingLeft: 20, listStyle: 'none' }}>
                <li style={{ marginBottom: 8, color: '#ef4444', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: -20, color: '#ef4444' }}>•</span>
                  Lose your phone? → bye-bye 👋
                </li>
                <li style={{ marginBottom: 8, color: '#ef4444', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: -20, color: '#ef4444' }}>•</span>
                  Uninstall your browser? → bye-bye 👋
                </li>
                <li style={{ marginBottom: 8, color: '#ef4444', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: -20, color: '#ef4444' }}>•</span>
                  Clear your site cache like a genius? → bye-bye 👋
                </li>
              </ul>
              <div style={{ color: '#f59e0b', fontWeight: 500, margin: '20px 0', padding: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: 8 }}>
                We're not magicians. If you lose it, we can't pull it out of thin air for you. Oxidiko is serverless: all your data stays on your phone. This is what makes it secure and private, but it also means you need to take responsibility for your own data.
              </div>
              <div style={{ color: '#3b82f6', margin: '20px 0', padding: 16, background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', borderRadius: 8 }}>
                Oh, and your oxidiko_id? Yeah, that's not just some random string of gibberish. Save that too. Somewhere safe. Somewhere you can actually find it when you need it. It will help you recover your account on some websites if you have lost your wallet.
              </div>
              <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.25rem', textAlign: 'center', margin: '24px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Stop living on the edge. Back it up. Now.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                <Button
                  onClick={handleForceBackupDownload}
                  disabled={isDownloadingBackup}
                  className="flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 32px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: isDownloadingBackup ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px rgba(239,68,68,0.2)',
                    transition: 'all 0.3s ease',
                    opacity: isDownloadingBackup ? 0.7 : 1,
                  }}
                >
                  {isDownloadingBackup ? (
                    <>
                      <Download className="h-5 w-5 mr-2 animate-pulse" style={{ animation: 'pulse 1.5s infinite' }} />
                      Downloading Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Download My Vault Backup
                    </>
                  )}
                </Button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#64748b', fontSize: '0.875rem', marginTop: 16 }}>
                <AlertTriangle className="h-4 w-4" />
                <span>This dialog will only close after you download your backup</span>
              </div>
              {/* Pulse animation for download icon */}
              <style>{`
                @keyframes pulse {
                  0% { opacity: 1; }
                  50% { opacity: 0.5; }
                  100% { opacity: 1; }
                }
              `}</style>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showObliterateDialog} onOpenChange={setShowObliterateDialog}>
          <AlertDialogContent className="bg-gray-950 border-red-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {obliterateStep === "confirm" ? "Obliterate Vault?" : "Authenticate to Obliterate"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                {obliterateStep === "confirm" ? (
                  <>
                    This action will <strong className="text-red-400">permanently delete</strong> your entire vault and
                    all stored data. This cannot be undone. Make sure you have exported your vault if you want to keep
                    your data.
                  </>
                ) : (
                  "Please authenticate with your passkey or PIN to confirm vault obliteration."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {obliterateStep === "auth" && (
              <div className="space-y-4">
                {webAuthnSupported && credId && (
                  <Button
                    onClick={handleObliterateWithPasskey}
                    disabled={isObliterating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isObliterating ? (
                      <>
                        <Fingerprint className="h-4 w-4 mr-2 animate-pulse" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="h-4 w-4 mr-2" />
                        Authenticate with Passkey
                      </>
                    )}
                  </Button>
                )}

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showObliteratePin ? "text" : "password"}
                      value={obliteratePin}
                      onChange={(e) => setObliteratePin(e.target.value)}
                      placeholder="Enter your PIN to confirm"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10"
                      minLength={8}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowObliteratePin(!showObliteratePin)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 h-auto"
                    >
                      {showObliteratePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={handleObliterateWithPin}
                    disabled={isObliterating || obliteratePin.length < 8}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {isObliterating ? (
                      <>
                        <Lock className="h-4 w-4 mr-2 animate-pulse" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Authenticate with PIN
                      </>
                    )}
                  </Button>
                </div>

                {obliterateError && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{obliterateError}</p>
                  </div>
                )}
              </div>
            )}

            <AlertDialogFooter>
              {obliterateStep === "confirm" ? (
                <>
                  <AlertDialogCancel
                    onClick={handleObliterateCancel}
                    className="bg-gray-800 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <Button onClick={handleObliterateConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                    Continue to Authentication
                  </Button>
                </>
              ) : (
                <AlertDialogCancel
                  onClick={handleObliterateCancel}
                  className="bg-gray-800 text-white hover:bg-gray-700"
                  disabled={isObliterating}
                >
                  Cancel
                </AlertDialogCancel>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Analytics />
      </div>
    </div>
  )
}
