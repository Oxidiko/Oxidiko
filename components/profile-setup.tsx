"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  Globe,
  Flag,
  CreditCard,
  Upload,
  Languages,
  Shield,
  Fingerprint,
  Info,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react"
import { createVault, importVaultData } from "@/lib/vault-storage"
import { createPasskey, isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "@/lib/webauthn-utils"
import { getCountryNames, getNationalityNames } from "@/lib/countries"

interface ProfileSetupProps {
  onVaultCreated: () => void
}

export function ProfileSetup({ onVaultCreated }: ProfileSetupProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    birthdate: "",
    phone: "",
    address: "",
    country: "",
    nationality: "",
    gender: "",
    language: "",
    creditCard: "",
    creditCardExpiry: "",
    creditCardCCV: "",
    profilePicture: "",
  })
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [webAuthnSupported, setWebAuthnSupported] = useState(false)
  const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false)
  const [showPasskeyInfo, setShowPasskeyInfo] = useState(false)
  const [showPinInfo, setShowPinInfo] = useState(false)
  const [importData, setImportData] = useState("")
  const [showImportMode, setShowImportMode] = useState(false)

  const countries = getCountryNames()
  const nationalities = getNationalityNames()

  // Check WebAuthn support on component mount
  React.useEffect(() => {
    const checkSupport = async () => {
      setWebAuthnSupported(isWebAuthnSupported())
      setPlatformAuthAvailable(await isPlatformAuthenticatorAvailable())
    }
    checkSupport()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, profilePicture: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const validatePin = (pinValue: string): boolean => {
    return pinValue.length >= 8
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!webAuthnSupported) {
      setError("WebAuthn is not supported in this browser")
      setIsLoading(false)
      return
    }

    if (!validatePin(pin)) {
      setError("PIN must be at least 8 characters long")
      setIsLoading(false)
      return
    }

    if (pin !== confirmPin) {
      setError("PINs do not match")
      setIsLoading(false)
      return
    }

    try {
      // Create WebAuthn passkey and get signature for key wrapping
      const { oxidikoId, credId, signature } = await createPasskey()

      const profileData = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        birthdate: formData.birthdate,
        phone: formData.phone,
        address: formData.address,
        country: formData.country,
        nationality: formData.nationality,
        gender: formData.gender,
        language: formData.language,
        creditCard: formData.creditCard,
        creditCardExpiry: formData.creditCardExpiry,
        creditCardCCV: formData.creditCardCCV,
        profilePicture: formData.profilePicture,
      }

      await createVault(profileData, oxidikoId, credId, pin, signature)
      onVaultCreated()
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Passkey creation was cancelled or not allowed")
      } else if (err.name === "NotSupportedError") {
        setError("Passkeys are not supported on this device")
      } else {
        setError(err.message || "Failed to create vault. Please try again.")
      }
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
      setImportData("")
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to import vault data")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload for vault import
  const handleFileUploadImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          setImportData(text)
          setError("")
        } catch (err: any) {
          setError("Invalid file format. Please upload a valid vault backup JSON file.")
        }
      }
      reader.readAsText(file)
    }
  }

  if (!webAuthnSupported) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-red-400" />
              WebAuthn Not Supported
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-400 mb-4">
              Your browser doesn't support WebAuthn (passkeys). Please use a modern browser like Chrome, Firefox,
              Safari, or Edge.
            </p>
            <p className="text-gray-500 text-sm">WebAuthn is required for secure, passwordless authentication.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gray-950 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl text-center flex items-center justify-center gap-2">
            {showImportMode ? (
              <>
                <Upload className="h-8 w-8 text-purple-400" />
                Import Your Identity Vault
              </>
            ) : (
              <>
                <Fingerprint className="h-8 w-8 text-blue-400" />
                Create Your Identity Vault
              </>
            )}
          </CardTitle>
          <p className="text-gray-400 text-center mt-2">
            {showImportMode ? "Restore your vault from backup" : "Secured with dual protection: Passkey + PIN"}
          </p>
        </CardHeader>
        <CardContent>
          {!platformAuthAvailable && !showImportMode && (
            <Alert className="bg-yellow-900/20 border-yellow-800 mb-6">
              <AlertDescription className="text-yellow-400">
                Platform authenticator not detected. You may need to use an external security key or enable biometric
                authentication.
              </AlertDescription>
            </Alert>
          )}

          {showImportMode ? (
            // Import Mode Interface
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="importData" className="text-gray-300">
                    Vault Backup File
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      id="importData"
                      type="file"
                      accept="application/json"
                      onChange={handleFileUploadImport}
                      style={{ display: 'none' }}
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('importData')?.click()}
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

                {error && (
                  <Alert className="bg-red-900/20 border-red-800">
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowImportMode(false)
                      setImportData("")
                      setError("")
                    }}
                    className="flex-1 bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImportVault}
                    disabled={isLoading || !importData.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                        Importing Vault...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Vault
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Create Mode Interface (existing form)
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* All the existing form content remains the same */}
              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {formData.profilePicture ? (
                    <img
                      src={formData.profilePicture || "/placeholder.svg"}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="profilePicture"
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 rounded-full p-2 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 text-white" />
                  </label>
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Keep all existing form fields exactly as they are */}
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdate" className="text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Birth Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="birthdate"
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) => handleInputChange("birthdate", e.target.value)}
                      className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-gray-300 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Country
                  </Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger className="bg-sky-900/30 border-sky-800/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.name} className="text-white hover:bg-gray-700">
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality" className="text-gray-300 flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Nationality
                  </Label>
                  <Select
                    value={formData.nationality}
                    onValueChange={(value) => handleInputChange("nationality", value)}
                  >
                    <SelectTrigger className="bg-sky-900/30 border-sky-800/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-300 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Gender
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger className="bg-sky-900/30 border-sky-800/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-gray-300 flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Language
                  </Label>
                  <div className="relative">
                    <Input
                      id="language"
                      value={formData.language}
                      onChange={(e) => handleInputChange("language", e.target.value)}
                      className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="English"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-300 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>

              {/* Credit Card Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditCard" className="text-gray-300">
                      Credit Card Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="creditCard"
                        value={formData.creditCard}
                        onChange={(e) => handleInputChange("creditCard", e.target.value)}
                        className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creditCardExpiry" className="text-gray-300">
                      Expiry Date
                    </Label>
                    <div className="relative">
                      <Input
                        id="creditCardExpiry"
                        value={formData.creditCardExpiry}
                        onChange={(e) => handleInputChange("creditCardExpiry", e.target.value)}
                        className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="MM/YY"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creditCardCCV" className="text-gray-300">
                      CCV
                    </Label>
                    <div className="relative">
                      <Input
                        id="creditCardCCV"
                        type="password"
                        value={formData.creditCardCCV}
                        onChange={(e) => handleInputChange("creditCardCCV", e.target.value)}
                        className="bg-sky-900/30 border-sky-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Setup */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Setup
                </h3>

                {/* PIN Setup */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-white flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Backup PIN
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPinInfo(!showPinInfo)}
                      className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 h-auto"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </h4>
                  {showPinInfo && (
                    <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-4">
                      <p className="text-orange-300 text-sm mb-2">
                        Your PIN provides backup access to your vault if you lose access to your passkey or switch
                        devices.
                      </p>
                      <p className="text-orange-400 text-xs">
                        Choose a strong PIN with at least 8 characters. This PIN will be required to unlock your vault
                        on new devices.
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pin" className="text-gray-300">
                        PIN (minimum 8 characters)
                      </Label>
                      <div className="relative">
                        <Input
                          id="pin"
                          type={showPin ? "text" : "password"}
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          className="bg-orange-900/30 border-orange-800/50 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 pr-10"
                          placeholder="Enter your backup PIN"
                          minLength={8}
                          required
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

                    <div className="space-y-2">
                      <Label htmlFor="confirmPin" className="text-gray-300">
                        Confirm PIN
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPin"
                          type={showConfirmPin ? "text" : "password"}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          className="bg-orange-900/30 border-orange-800/50 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 pr-10"
                          placeholder="Confirm your backup PIN"
                          minLength={8}
                          required
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 h-auto"
                        >
                          {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {pin && !validatePin(pin) && (
                    <p className="text-red-400 text-sm">PIN must be at least 8 characters long</p>
                  )}
                  {pin && confirmPin && pin !== confirmPin && <p className="text-red-400 text-sm">PINs do not match</p>}
                </div>

                {/* Passkey Protection */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-white flex items-center gap-2">
                    <Fingerprint className="h-4 w-4" />
                    Passkey Protection
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPasskeyInfo(!showPasskeyInfo)}
                      className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 h-auto"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </h4>
                  {showPasskeyInfo && (
                    <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                      <p className="text-blue-300 text-sm mb-2">
                        Your passkey provides the primary secure access to your vault using biometric authentication or
                        your device's security features.
                      </p>
                      <p className="text-blue-400 text-xs">
                        Your passkey is stored securely on your device and provides stronger protection than traditional
                        passwords.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <Alert className="bg-red-900/20 border-red-800">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading || !validatePin(pin) || pin !== confirmPin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Fingerprint className="h-4 w-4 mr-2 animate-pulse" />
                      Creating Secure Vault...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Create Vault with Dual Protection
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => setShowImportMode(true)}
                  className="w-full bg-purple-800 text-white hover:bg-purple-700 hove:text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Existing Vault
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
