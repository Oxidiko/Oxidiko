"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Copy, Check, CreditCard, Zap } from "lucide-react"
import { createAPIVault, updateAPIVaultStatus } from "@/lib/api-storage"
import { addAPIKeyToDatabase, updateAPIKeyStatus } from "@/lib/api-validation"
import { useRouter } from "next/navigation"

interface Plan {
  id: string
  name: string
  price: string
  period: string
  description: string
  icon: any
  color: string
  bgColor: string
  borderColor: string
  features: string[]
  limit: string
  popular: boolean
  quota: number
}

interface APIPlanPopupProps {
  isOpen: boolean
  onClose: () => void
  plan: Plan | null
}

declare global {
  interface Window {
    paypal: any
  }
}

export function APIPlanPopup({ isOpen, onClose, plan }: APIPlanPopupProps) {
  const [step, setStep] = useState<"form" | "apikey" | "payment">("form")
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const paypalRendered = useRef(false)
  const router = useRouter()

  // Map plan IDs to PayPal plan IDs and container IDs
  const paypalPlanMap: Record<string, { planId: string; containerId: string }> = {
    starter: {
      planId: "P-1F273278GP315382LNBR2NEQ",
      containerId: "paypal-button-container-P-1F273278GP315382LNBR2NEQ",
    },
    premium: {
      planId: "P-2ME39903478019128NBUALXY",
      containerId: "paypal-button-container-P-2ME39903478019128NBUALXY",
    },
    elite: {
      planId: "P-6EW32164U2662090CNBUAMTQ",
      containerId: "paypal-button-container-P-6EW32164U2662090CNBUAMTQ",
    },
  }

  useEffect(() => {
    const paid = plan?.id && paypalPlanMap[plan.id]
    if (step === "payment" && paid && !paypalLoaded && !paypalRendered.current) {
      loadPayPalScript()
    }
    if (step !== "payment" || !paid) {
      paypalRendered.current = false
      setPaypalLoaded(false)
    }
    // No manual cleanup of container.innerHTML
  }, [step, plan?.id, paypalLoaded])

  const loadPayPalScript = () => {
    if (!plan?.id || !paypalPlanMap[plan.id]) return // Only load for supported paid plans
    if (window.paypal) {
      setPaypalLoaded(true)
      renderPayPalButton()
      return
    }
    const script = document.createElement("script")
    script.src =
      "https://www.paypal.com/sdk/js?client-id=ASNg3GZgnBD6EU0iF3gVQQWzvOR6K7O_2PC9wa9DB0rpx1Btf-mTwdmeJKF8DW2YZR-OHZpWw_qq7pYd&vault=true&intent=subscription"
    script.onload = () => {
      setPaypalLoaded(true)
      renderPayPalButton()
    }
    document.head.appendChild(script)
  }

  const renderPayPalButton = () => {
    if (!plan?.id || !paypalPlanMap[plan.id] || !window.paypal || paypalRendered.current) return
    const { planId, containerId } = paypalPlanMap[plan.id]
    const container = document.getElementById(containerId)
    if (container) {
      window.paypal
        .Buttons({
          style: {
            shape: "pill",
            color: "black",
            layout: "vertical",
            label: "subscribe",
          },
          createSubscription: (data: any, actions: any) =>
            actions.subscription.create({
              plan_id: planId,
            }),
          onApprove: async (data: any, actions: any) => {
            try {
              await updateAPIVaultStatus(formData.companyEmail, formData.password, true)
              await updateAPIKeyStatus(apiKey, data.subscriptionID)
              setIsActive(true)
              alert("Payment successful! Your API key is now active.")
              router.push("/api-dashboard")
            } catch (err) {
              console.error("Activation error:", err)
              alert("Payment successful but activation failed. Please contact support.")
            }
          },
          onError: (err: any) => {
            console.error("PayPal error:", err)
            alert("Payment failed. Please try again.")
          },
        })
        .render(`#${containerId}`)
      paypalRendered.current = true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!formData.companyName || !formData.companyEmail || !formData.password) {
        throw new Error("All fields are required")
      }

      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters long")
      }

      const { apiKey: generatedKey, isActive: keyActive } = await createAPIVault(
        formData.companyName,
        formData.companyEmail,
        formData.password,
        plan?.id || "free",
      )

      setApiKey(generatedKey)
      setIsActive(keyActive)

      // Add to database
      await addAPIKeyToDatabase({
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        apiKey: generatedKey,
        quota: `0/${plan?.quota || 0}`,
        planId: plan?.id || "free",
        isActive: keyActive,
      })

      if (plan?.id === "free") {
        // Free plan - immediately show API key
        setStep("apikey")
      } else {
        // Paid plan - show payment step
        setStep("payment")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create API vault")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleClose = () => {
    setStep("form")
    setFormData({ companyName: "", companyEmail: "", password: "" })
    setError("")
    setApiKey("")
    setIsActive(false)
    setCopied(false)
    onClose()
  }

  useEffect(() => {
    if (step === "apikey" && isActive) {
      router.push("/api-dashboard")
    }
  }, [step, isActive])

  if (!plan) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {step === "form" && `Subscribe to ${plan.name} Plan`}
            {step === "apikey" && "Your API Key"}
            {step === "payment" && "Complete Payment"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-blue-400">{plan.price}</div>
              <div className="text-sm text-gray-400">
                {plan.limit}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={formData.companyEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyEmail: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                  minLength={8}
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
              {isLoading ? "Creating..." : "Create API Account"}
            </Button>
          </form>
        )}

        {step === "payment" && plan?.id && paypalPlanMap[plan.id] && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <CreditCard className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Complete your subscription to activate your API key</p>
              </div>
              <div className="mb-4">
                <Badge className="bg-orange-900 text-orange-400">API Key Generated - Pending Activation</Badge>
              </div>
            </div>
            <div
              id={paypalPlanMap[plan.id].containerId}
              className="min-h-[100px] flex items-center justify-center"
            >
              {!paypalLoaded && <div className="text-gray-400">Loading PayPal...</div>}
            </div>
            <div className="text-xs text-gray-500 text-center">
              Your API key will be activated immediately after successful payment
            </div>
          </div>
        )}
        {step === "payment" && (!plan?.id || !paypalPlanMap[plan.id]) && (
          <div className="space-y-4 text-center text-red-400">
            Payment for this plan is not yet available. Please contact support or choose another plan.
          </div>
        )}

        {step === "apikey" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-gray-800 p-4 rounded-lg mb-4">
                <Zap className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Your API key has been generated</p>
              </div>

              <Badge className={isActive ? "bg-green-900 text-green-400" : "bg-orange-900 text-orange-400"}>
                {isActive ? "Active" : "Pending Activation"}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input value={apiKey} readOnly className="bg-gray-800 border-gray-700 text-white font-mono text-sm" />
                <Button onClick={copyToClipboard} size="sm" className="bg-gray-700 hover:bg-gray-600">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Alert className="bg-blue-900/20 border-blue-800">
              <AlertDescription className="text-blue-400">
                Save this API key securely. You'll need it to authenticate your requests.
              </AlertDescription>
            </Alert>

            <Button onClick={handleClose} className="w-full bg-green-600 hover:bg-green-700">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
