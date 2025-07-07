"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Lock, Fingerprint, ArrowLeft, Code, BookOpen, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { AnimatedBackground } from "@/components/animated-background"
import hljs from "highlight.js"
import "highlight.js/styles/tokyo-night-dark.css"

export default function Docs() {
  const router = useRouter()
  const [codeCopied, setCodeCopied] = useState(false)

  const handleBackClick = () => {
    router.push("/")
  }

  const codeExample = `// Include Oxidiko SDK
<script src="https://cdn.jsdelivr.net/gh/Oxidiko/oxidiko-sdk@main/oxidiko-sdk.js"></script>

// Initialize OxidikoAuth
const oxidiko = new OxidikoAuth({
    apiKey: 'put_your_api_key_here'
});

// Start authentication
const result = await oxidiko.authenticate(['name', 'email']);

// Do your job with the JWT
// This is an example. Do not use in production environment
// consol.log(result.token)`

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeExample)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  useEffect(() => {
    // Highlight all code blocks
    hljs.highlightAll()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground variant="docs" />

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
              <BookOpen className="h-16 w-16 text-blue-400" />
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Oxidiko Documentation
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to know about implementing and using Oxidiko Web Vault
            </p>
          </div>

          {/* Documentation Tabs */}
          <Tabs defaultValue="integration" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-gray-700">
              <TabsTrigger value="integration" className="data-[state=active]:bg-blue-600">
                Integration
              </TabsTrigger>
              <TabsTrigger value="api" className="data-[state=active]:bg-blue-600">
                API Reference
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="integration" className="mt-8">
              <div className="space-y-8">
                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-green-400" />
                        Oxidiko JavaScript SDK
                      </div>
                      <Button
                        onClick={copyCode}
                        size="sm"
                        variant="outline"
                        className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      >
                        {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Complete SDK for integrating Oxidiko authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-4">
                    <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">
                        <code className="language-javascript">{codeExample}</code>
                      </pre>
                    </div>
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                      <p className="text-blue-400 text-sm font-medium mb-2">Quick Start:</p>
                      <div className="text-xs text-blue-300 space-y-1">
                        <div>1. Copy the SDK code above</div>
                        <div>2. Include it in your project</div>
                        <div>
                          3. Use:{" "}
                          <code className="bg-blue-800/30 px-1 rounded">
                            new OxidikoAuth().authenticate(['name', 'email'])
                          </code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-8">
              <div className="space-y-8">
                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lock className="h-5 w-5 text-red-400" />
                      Security Architecture
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-6">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Encryption</h4>
                      <p>
                        All user data is encrypted using AES-GCM with 256-bit keys. Keys are derived from your passkey
                        and never leave your device.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">Digital Signatures</h4>
                      <p>
                        JWT tokens are signed using RSA-2048 with SHA-256. Each user has a unique key pair generated
                        during vault creation.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">Zero Knowledge</h4>
                      <p>
                        Oxidiko operates on a zero-knowledge principle. We never have access to your private keys,
                        passwords, or personal data.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-green-400" />
                      Authentication Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mt-1">1</Badge>
                        <div>
                          <h5 className="font-semibold text-white">Passkey Verification</h5>
                          <p className="text-sm">User authenticates with biometric or security key</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mt-1">2</Badge>
                        <div>
                          <h5 className="font-semibold text-white">Vault Decryption</h5>
                          <p className="text-sm">Local vault is decrypted using derived keys</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mt-1">3</Badge>
                        <div>
                          <h5 className="font-semibold text-white">JWT Generation</h5>
                          <p className="text-sm">Signed JWT token is created with user claims</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mt-1">4</Badge>
                        <div>
                          <h5 className="font-semibold text-white">Token Delivery</h5>
                          <p className="text-sm">JWT is securely delivered to requesting website</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="api" className="mt-8">
              <div className="space-y-8">
                <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Code className="h-5 w-5 text-cyan-400" />
                      Available Fields
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Fields that can be requested from the user's vault
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead className="text-gray-300 font-semibold">Field Name</TableHead>
                            <TableHead className="text-gray-300 font-semibold">JWT Key</TableHead>
                            <TableHead className="text-gray-300 font-semibold">Example Value</TableHead>
                            <TableHead className="text-gray-300 font-semibold">Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Full Name</TableCell>
                            <TableCell className="text-blue-400 font-mono">name</TableCell>
                            <TableCell className="text-gray-300">John Doe</TableCell>
                            <TableCell className="text-gray-400">User's full name</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Username</TableCell>
                            <TableCell className="text-blue-400 font-mono">username</TableCell>
                            <TableCell className="text-gray-300">johndoe123</TableCell>
                            <TableCell className="text-gray-400">User's preferred username</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Email Address</TableCell>
                            <TableCell className="text-blue-400 font-mono">email</TableCell>
                            <TableCell className="text-gray-300">john@example.com</TableCell>
                            <TableCell className="text-gray-400">User's email address</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Birth Date</TableCell>
                            <TableCell className="text-blue-400 font-mono">birthdate</TableCell>
                            <TableCell className="text-gray-300">1990-01-15</TableCell>
                            <TableCell className="text-gray-400">Date of birth (YYYY-MM-DD)</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Phone Number</TableCell>
                            <TableCell className="text-blue-400 font-mono">phone</TableCell>
                            <TableCell className="text-gray-300">+1-555-123-4567</TableCell>
                            <TableCell className="text-gray-400">Phone number with country code</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Address</TableCell>
                            <TableCell className="text-blue-400 font-mono">address</TableCell>
                            <TableCell className="text-gray-300">123 Main St, City, State 12345</TableCell>
                            <TableCell className="text-gray-400">Full postal address</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Country</TableCell>
                            <TableCell className="text-blue-400 font-mono">country</TableCell>
                            <TableCell className="text-gray-300">United States</TableCell>
                            <TableCell className="text-gray-400">Country of residence</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Nationality</TableCell>
                            <TableCell className="text-blue-400 font-mono">nationality</TableCell>
                            <TableCell className="text-gray-300">American</TableCell>
                            <TableCell className="text-gray-400">User's nationality</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Gender</TableCell>
                            <TableCell className="text-blue-400 font-mono">gender</TableCell>
                            <TableCell className="text-gray-300">Male</TableCell>
                            <TableCell className="text-gray-400">Gender identity</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Language</TableCell>
                            <TableCell className="text-blue-400 font-mono">language</TableCell>
                            <TableCell className="text-gray-300">English</TableCell>
                            <TableCell className="text-gray-400">Preferred language</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Credit Card</TableCell>
                            <TableCell className="text-blue-400 font-mono">creditCard</TableCell>
                            <TableCell className="text-gray-300">**** **** **** 1234</TableCell>
                            <TableCell className="text-gray-400">Masked credit card number</TableCell>
                          </TableRow>
                          <TableRow className="border-gray-700">
                            <TableCell className="font-medium text-gray-300">Recovery ID</TableCell>
                            <TableCell className="text-blue-400 font-mono">rec_id</TableCell>
                            <TableCell className="text-gray-300">abc123def456...</TableCell>
                            <TableCell className="text-gray-400">Encrypted recovery identifier</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
