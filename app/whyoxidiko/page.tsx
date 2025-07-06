"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Fingerprint, ArrowLeft, Check, X, AlertTriangle, Eye, Server, Zap, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnimatedBackground } from "@/components/animated-background"

export default function WhyOxidiko() {
  const router = useRouter()

  const handleBackClick = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background Shapes */}
      <AnimatedBackground />

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Button onClick={handleBackClick} className="bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <Shield className="h-16 w-16 text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Why Choose Oxidiko?
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover why Oxidiko Web Vault is the future of secure, privacy-first authentication
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
              <CardHeader className="text-center">
                <Shield className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <CardTitle className="text-white">Zero Trust</CardTitle>
                <CardDescription className="text-gray-400">Your data never leaves your device</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
              <CardHeader className="text-center">
                <Eye className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <CardTitle className="text-white">No Tracking</CardTitle>
                <CardDescription className="text-gray-400">Complete privacy, no data collection</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
              <CardHeader className="text-center">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <CardTitle className="text-white">Lightning Fast</CardTitle>
                <CardDescription className="text-gray-400">Instant authentication with passkeys</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
              <CardHeader className="text-center">
                <Server className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <CardTitle className="text-white">No Servers</CardTitle>
                <CardDescription className="text-gray-400">
                  Fully decentralized, no single point of failure
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Punchlines */}
          <div className="mb-16">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">The Real Talk</h2>
                <p className="text-gray-400">Why Oxidiko is different (and why you'll love it)</p>
              </div>

              <div className="grid gap-4">
                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
                  <CardContent className="p-6">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      Oxidiko is like login therapy — one tap, you're in. No passwords, no "please verify you're not a
                      bot."
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
                  <CardContent className="p-6">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      Oxidiko doesn't need captchas. You're not a robot, we get it.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
                  <CardContent className="p-6">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      Still using email + password? Damn, grandpa, want me to dial-up your modem too?
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
                  <CardContent className="p-6">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      We don't sell your data — because we don't even have your data. Mark Zuckerberg is shaking.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
                  <CardContent className="p-6">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      Lose your vault? Chill. Your account's still alive. Recovery is baked in — no customer service
                      nightmares or ritual sacrifices needed.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
                  <CardContent className="p-6">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      Faster than your attention span. Tap. Boom. You're in. Go scroll TikTok or whatever.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
                  <CardContent className="p-6">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      Oxidiko is private, secure, and doesn't track you. Basically the opposite of everything you use
                      right now.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-800">
                  <CardContent className="p-6">
                    <p className="text-gray-200 text-lg leading-relaxed">
                      You could keep using the same password everywhere… or use Oxidiko and not get wrecked in the next
                      data breach.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm mb-16">
            <CardHeader>
              <CardTitle className="text-2xl text-white text-center">Oxidiko vs Traditional Authentication</CardTitle>
              <CardDescription className="text-center text-gray-400">
                See how Oxidiko compares to other authentication solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300 font-semibold">Feature</TableHead>
                      <TableHead className="text-center text-blue-400 font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <Shield className="h-4 w-4" />
                          Oxidiko
                        </div>
                      </TableHead>
                      <TableHead className="text-center text-gray-400">Auth0</TableHead>
                      <TableHead className="text-center text-gray-400">Firebase Auth</TableHead>
                      <TableHead className="text-center text-gray-400">Traditional Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-gray-700">
                      <TableCell className="font-medium text-gray-300">Data Privacy</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          100% Private
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <X className="h-3 w-3 mr-1" />
                          Data Collected
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <X className="h-3 w-3 mr-1" />
                          Data Collected
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Varies
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-gray-700">
                      <TableCell className="font-medium text-gray-300">Server Dependency</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          Serverless
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Server className="h-3 w-3 mr-1" />
                          Server Required
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Server className="h-3 w-3 mr-1" />
                          Server Required
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Server className="h-3 w-3 mr-1" />
                          Server Required
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-gray-700">
                      <TableCell className="font-medium text-gray-300">Password Required</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          Passwordless
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Optional
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Optional
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <X className="h-3 w-3 mr-1" />
                          Required
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-gray-700">
                      <TableCell className="font-medium text-gray-300">Setup Complexity</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          One Click
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Complex
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Moderate
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <X className="h-3 w-3 mr-1" />
                          Very Complex
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-gray-700">
                      <TableCell className="font-medium text-gray-300">Monthly Cost</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          Free
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Users className="h-3 w-3 mr-1" />
                          $23+/month
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Users className="h-3 w-3 mr-1" />
                          Pay per use
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Server className="h-3 w-3 mr-1" />
                          Server costs
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-gray-700">
                      <TableCell className="font-medium text-gray-300">Vendor Lock-in</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          None
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <X className="h-3 w-3 mr-1" />
                          High
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <X className="h-3 w-3 mr-1" />
                          High
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="h-3 w-3 mr-1" />
                          None
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <Lock className="h-8 w-8 text-blue-400 mb-2" />
                <CardTitle className="text-white">Security First</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  • <strong>AES-GCM Encryption:</strong> Military-grade encryption for all data
                </p>
                <p>
                  • <strong>RSA-2048 Signatures:</strong> Cryptographic proof of authenticity
                </p>
                <p>
                  • <strong>WebAuthn/FIDO2:</strong> Hardware-backed security keys
                </p>
                <p>
                  • <strong>Zero Knowledge:</strong> We never see your data, ever
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <Fingerprint className="h-8 w-8 text-green-400 mb-2" />
                <CardTitle className="text-white">User Experience</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  • <strong>One-Click Setup:</strong> Create your vault in seconds
                </p>
                <p>
                  • <strong>Biometric Login:</strong> Face ID, Touch ID, or Windows Hello
                </p>
                <p>
                  • <strong>Cross-Platform:</strong> Works on all modern browsers
                </p>
                <p>
                  • <strong>Serverless:</strong> Your data is stored on your device. No one can access it, unless you
                  explicitly accept
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
