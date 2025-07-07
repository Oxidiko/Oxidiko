"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Fingerprint, ArrowRight, BookOpen, HelpCircle, Menu, X } from "lucide-react"
import { ProfileSetup } from "@/components/profile-setup"
import { VaultUnlock } from "@/components/vault-unlock"
import { Dashboard } from "@/components/dashboard"
import { checkVaultExists, isVaultUnlocked } from "@/lib/vault-storage"
import { useRouter } from "next/navigation"
import { AnimatedBackground } from "@/components/animated-background"

export default function Home() {
  const [hasVault, setHasVault] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const profileSetupRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeApp = async () => {
      const vaultExists = await checkVaultExists()
      const unlocked = isVaultUnlocked()

      setHasVault(vaultExists)
      setIsUnlocked(unlocked)
      setIsLoading(false)
    }

    initializeApp()
  }, [])

  const handleVaultCreated = () => {
    setHasVault(true)
    setIsUnlocked(true)
  }

  const handleVaultUnlocked = () => {
    setIsUnlocked(true)
  }

  const scrollToProfileSetup = () => {
    profileSetupRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const handleWhyOxidikoClick = () => {
    router.push("/whyoxidiko")
    setIsMenuOpen(false)
  }

  const handleDocsClick = () => {
    router.push("/docs")
    setIsMenuOpen(false)
  }

  const handleApiClick = () => {
    router.push("/api")
    setIsMenuOpen(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!hasVault) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Enhanced Animated Background Shapes */}
        <AnimatedBackground />

        {/* Top Navigation */}
        <div className="absolute top-6 right-6 z-20">
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-4">
            <Button onClick={handleApiClick} className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800">
              <BookOpen className="h-4 w-4 mr-2" />
              API
            </Button>
            <Button
              onClick={handleWhyOxidikoClick}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Why use Oxidiko
            </Button>
            <Button
              onClick={handleDocsClick}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Docs
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>

            {isMenuOpen && (
              <div className="absolute right-0 top-12 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-2 min-w-[200px]">
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleApiClick}
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 justify-start"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    API
                  </Button>
                  <Button
                    onClick={handleWhyOxidikoClick}
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 justify-start"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Why use Oxidiko
                  </Button>
                  <Button
                    onClick={handleDocsClick}
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 justify-start"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Docs
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <Shield className="h-16 w-16 text-blue-400" />
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent animate-gradient">
              Oxidiko Web Vault
            </h1>
            <p className="text-2xl text-gray-300 mb-4 animate-fade-in-up delay-300">
              One click. Full privacy. Zero passwords.
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto animate-fade-in-up delay-500">
              Your encrypted identity, stored locally in your browser. Share only what you want, when you want.
            </p>
          </div>

          {/* Create Vault Button */}
          <div className="flex justify-center mb-20 animate-fade-in-up delay-700">
            <Button
              onClick={scrollToProfileSetup}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse-glow"
            >
              Create Your Vault Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
              <CardHeader>
                <div className="relative mb-2">
                  <Lock className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                  <div className="absolute inset-0 h-8 w-8 text-blue-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping">
                    <Lock className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="text-white group-hover:text-blue-100 transition-colors duration-300">
                  Encrypted Storage
                </CardTitle>
                <CardDescription className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Your data is encrypted with military-grade AES-GCM and stored locally
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
              <CardHeader>
                <div className="relative mb-2">
                  <Fingerprint className="h-8 w-8 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
                  <div className="absolute inset-0 h-8 w-8 text-green-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping">
                    <Fingerprint className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="text-white group-hover:text-green-100 transition-colors duration-300">
                  Passkey Protection
                </CardTitle>
                <CardDescription className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Only you can unlock your vault with your secure passkey
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
              <CardHeader>
                <div className="relative mb-2">
                  <ArrowRight className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                  <div className="absolute inset-0 h-8 w-8 text-purple-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                </div>
                <CardTitle className="text-white group-hover:text-purple-100 transition-colors duration-300">
                  One-Click Login
                </CardTitle>
                <CardDescription className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  Seamlessly authenticate with websites without passwords
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div ref={profileSetupRef} className="animate-fade-in-up delay-1400">
            <ProfileSetup onVaultCreated={handleVaultCreated} />
          </div>
        </div>
      </div>
    )
  }

  if (!isUnlocked) {
    return <VaultUnlock onUnlocked={handleVaultUnlocked} />
  }

  return <Dashboard />
}
