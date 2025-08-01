"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, User, Code, Copy, Check } from "lucide-react"
import { verifyJWT as verifyJWTClaimsOnly } from "@/lib/jwt-utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const availableFields = [
	{ id: "name", label: "Full Name", icon: "\uD83D\uDC64" },
	{ id: "username", label: "Username", icon: "\uD83D\uDC64" },
	{ id: "email", label: "Email Address", icon: "\uD83D\uDCE7" },
	{ id: "birthdate", label: "Birth Date", icon: "\uD83D\uDCC5" },
	{ id: "phone", label: "Phone Number", icon: "\uD83D\uDCF1" },
	{ id: "address", label: "Address", icon: "\uD83D\uDCCD" },
	{ id: "country", label: "Country", icon: "\uD83C\uDF0D" },
	{ id: "nationality", label: "Nationality", icon: "\uD83C\uDFF3\uFE0F" },
	{ id: "gender", label: "Gender", icon: "\uD83D\uDEB6" },
	{ id: "language", label: "Language", icon: "\uD83D\uDDE3\uFE0F" },
	{ id: "creditCard", label: "Credit Card", icon: "\uD83D\uDCB3" },
	{ id: "none", label: "None", icon: "\uD83D\uDEAB" },
	{ id: "rec_id", label: "Recovery ID", icon: "\uD83D\uDD11" },
]

export default function DemoPage() {
	const [token, setToken] = useState("")
	const [userData, setUserData] = useState<any>(null)
	const [error, setError] = useState("")
	const [selectedFields, setSelectedFields] = useState<string[]>(["name", "email"])
	const [codeCopied, setCodeCopied] = useState(false)
	const [highlightedCode, setHighlightedCode] = useState("")
	const [apiKey, setApiKey] = useState("")

	const handleLogin = () => {
		if (selectedFields.length === 0) {
			setError("Please select at least one field to request")
			return
		}

		// If 'none' is selected, only use 'none'
		const fieldsToRequest = selectedFields.includes("none") ? ["none"] : selectedFields
		const fields = fieldsToRequest.join(",")
		const redirectUrl = `${window.location.origin}/demo`
		// Open popup with just /login (no params)
		let authUrl = `${window.location.origin}/login`

		const left = (screen.width - 500) / 2
		const top = (screen.height - 700) / 2
		const popup = window.open(authUrl, "oxidiko-auth", `width=500,height=700,left=${left},top=${top}`)

		if (!popup) {
			setError("Failed to open authentication popup. Please allow popups and try again.")
			return
		}

		// Listen for messages from popup
		const messageListener = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return

			if (event.data.type === "OXID_AUTH_SUCCESS") {
				setToken(event.data.token)
				verifyToken(event.data.token)
				popup?.close()
				window.removeEventListener("message", messageListener)
				setError("")
			} else if (event.data.type === "OXID_AUTH_ERROR") {
				setError(event.data.error || "Authentication failed")
				popup?.close()
				window.removeEventListener("message", messageListener)
			} else if (event.data.oxidikoReady) {
				// Send the required params to the popup via postMessage
				popup.postMessage(
					{
						api_key: apiKey.trim(),
						fields,
						redirect: redirectUrl,
					},
					window.location.origin
				)
			}
		}

		window.addEventListener("message", messageListener)

		// Fallback: check if popup was closed manually
		const checkClosed = setInterval(() => {
			if (popup?.closed) {
				clearInterval(checkClosed)
				window.removeEventListener("message", messageListener)
			}
		}, 1000)
	}

	const verifyToken = async (tokenToVerify: string) => {
		try {
			const payload = await verifyJWTClaimsOnly(tokenToVerify)
			setUserData(payload)
			setError("")
		} catch (err: any) {
			console.error("Token verification error:", err)
			setError(err.message || "Invalid or expired token")
			setUserData(null)
		}
	}

	const handleVerifyToken = () => {
		if (token) {
			verifyToken(token)
		}
	}

	const handleFieldToggle = (fieldId: string) => {
		setSelectedFields((prev: string[]) => {
			if (fieldId === "none") {
				// If 'none' is selected, clear all other selections
				return prev.includes("none") ? [] : ["none"]
			} else {
				// If any other field is selected, remove 'none' if it exists
				const withoutNone = prev.filter((id: string) => id !== "none")
				return withoutNone.includes(fieldId) ? withoutNone.filter((id: string) => id !== fieldId) : [...withoutNone, fieldId]
			}
		})
	}

	const codeExample = "// Example code here" // Placeholder or remove if not needed

	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText(codeExample)
			setCodeCopied(true)
			setTimeout(() => setCodeCopied(false), 2000)
		} catch (err) {
			console.error("Failed to copy code:", err)
		}
	}

	return (
		<div className="min-h-screen bg-black text-white overflow-x-hidden">
			<div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
				<div className="w-full overflow-x-hidden">
					<div className="text-center mb-6 sm:mb-8">
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Oxidiko Web Vault Demo</h1>
						<p className="text-gray-400 text-base sm:text-lg">Test the OAuth-style authentication flow</p>
					</div>

					<div className="grid lg:grid-cols-2 gap-4 lg:gap-8 w-full overflow-x-hidden">
						<div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
							<Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
								<CardHeader className="w-full overflow-x-hidden">
									<CardTitle className="text-white flex items-center gap-2">
										<User className="h-5 w-5" />
										Step 1: Select Data to Request
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 w-full overflow-x-hidden">
									<p className="text-gray-400">Choose which information you want to request from the user:</p>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full overflow-x-hidden">
										{availableFields.map((field) => (
											<div key={field.id} className="flex items-center space-x-2 w-full overflow-x-hidden">
												<Checkbox
													id={field.id}
													checked={selectedFields.includes(field.id)}
													onCheckedChange={() => handleFieldToggle(field.id)}
													className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex-shrink-0"
												/>
												<label
													htmlFor={field.id}
													className="text-sm text-gray-300 cursor-pointer flex items-center gap-2 min-w-0 overflow-hidden"
												>
													<span className="flex-shrink-0">{field.icon}</span>
													<span className="truncate">{field.label}</span>
												</label>
											</div>
										))}
									</div>
									{selectedFields.length > 0 && (
										<div className="mt-4 w-full overflow-x-hidden">
											<p className="text-sm text-gray-400 mb-2">Selected fields:</p>
											<div className="flex flex-wrap gap-2 w-full overflow-x-hidden">
												{selectedFields.map((fieldId) => {
													const field = availableFields.find((f) => f.id === fieldId)
													return (
														<Badge
															key={fieldId}
															className="bg-blue-900 text-blue-400 text-xs sm:text-sm flex-shrink-0 hover:bg-blue-900"
														>
															{field?.icon} {field?.label}
														</Badge>
													)
												})}
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							<Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
								<CardHeader className="w-full overflow-x-hidden">
									<CardTitle className="text-white flex items-center gap-2">
										<User className="h-5 w-5" />
										Step 2: API Configuration
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 w-full overflow-x-hidden">
									<div className="space-y-2">
										<Label htmlFor="api-key" className="text-gray-300">
											API Key
										</Label>
										<Input
											id="api-key"
											type="password"
											placeholder="Enter your API key..."
											value={apiKey}
											onChange={(e) => setApiKey(e.target.value)}
											className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
										/>
										<p className="text-xs text-gray-500">
											Get your API key from the{" "}
											<a href="/api-dashboard" className="text-blue-400 hover:underline">
												API Dashboard
											</a>
										</p>
									</div>
								</CardContent>
							</Card>

							<Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
								<CardHeader className="w-full overflow-x-hidden">
									<CardTitle className="text-white flex items-center gap-2">
										<User className="h-5 w-5" />
										Step 3: Initiate Login
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4 w-full overflow-x-hidden">
									<p className="text-gray-400">
										Click the button below to open the authentication popup with your selected fields.
									</p>
									<Button
										onClick={handleLogin}
										disabled={selectedFields.length === 0}
										className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										<span className="hidden sm:inline">Login with Oxidiko Web Vault</span>
										<span className="sm:hidden">Login with Oxidiko</span>
									</Button>
									{error && (
										<Alert className="bg-red-900/20 border-red-800 w-full overflow-x-hidden">
											<AlertDescription className="text-red-400">{error}</AlertDescription>
										</Alert>
									)}
								</CardContent>
							</Card>
						</div>

						<div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
							{userData ? (
								<Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
									<CardHeader className="w-full overflow-x-hidden">
										<CardTitle className="text-white flex items-center gap-2">
											<User className="h-5 w-5" />
											Authenticated User Data
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 w-full overflow-x-hidden">
										<div className="space-y-3 w-full overflow-x-hidden">
											<div className="flex items-center justify-between w-full overflow-x-hidden">
												<span className="text-gray-400">User ID:</span>
												<Badge className="bg-blue-900 text-blue-400 hover:bg-blue-900">{userData.oxidiko_id}</Badge>
											</div>

											{userData.rec_id && (
												<div className="flex items-center justify-between w-full overflow-x-hidden">
													<span className="text-gray-400 flex items-center gap-2">
														<span>🔑</span>
														Recovery ID:
													</span>
													<span className="text-white font-mono text-sm break-all overflow-wrap-anywhere min-w-0">
														{userData.rec_id.substring(0, 16)}...
													</span>
												</div>
											)}

											{selectedFields.includes("none") ? (
												<div className="text-center py-4">
													<span className="text-gray-400">🚫 No additional data requested</span>
												</div>
											) : (
												selectedFields.map((fieldId) => {
													const field = availableFields.find((f) => f.id === fieldId)
													const value = userData[fieldId]
													if (!value) return null

													return (
														<div
															key={fieldId}
															className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2 w-full overflow-x-hidden"
														>
															<span className="text-gray-400 flex items-center gap-2 flex-shrink-0">
																<span>{field?.icon}</span>
																{field?.label}:
															</span>
															<span className="text-white break-all overflow-wrap-anywhere min-w-0">{value}</span>
														</div>
													)
												})
											)}

											<div className="flex items-center justify-between w-full overflow-x-hidden">
												<span className="text-gray-400">Issued At:</span>
												<span className="text-white">{new Date(userData.iat * 1000).toLocaleString()}</span>
											</div>

											<div className="flex items-center justify-between w-full overflow-x-hidden">
												<span className="text-gray-400">Expires At:</span>
												<span className="text-white">{new Date(userData.exp * 1000).toLocaleString()}</span>
											</div>
										</div>
									</CardContent>
								</Card>
							) : (
								<Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
									<CardHeader className="w-full overflow-x-hidden">
										<CardTitle className="text-white">Waiting for Authentication</CardTitle>
									</CardHeader>
									<CardContent className="w-full overflow-x-hidden">
										<p className="text-gray-400">Complete the login flow to see the authenticated user data here.</p>
									</CardContent>
								</Card>
							)}

							{token && (
								<Card className="bg-gray-950 border-gray-800 w-full overflow-x-hidden">
									<CardHeader className="w-full overflow-x-hidden">
										<CardTitle className="text-white">JWT Token</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4 w-full overflow-x-hidden">
										<div className="bg-gray-800 p-2 sm:p-3 rounded-lg w-full overflow-x-hidden">
											<p className="text-xs text-gray-300 break-all font-mono overflow-wrap-anywhere w-full">{token}</p>
										</div>
										<Button onClick={handleVerifyToken} className="w-full bg-gray-800 hover:bg-gray-700 text-white">
											Verify Token
										</Button>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
