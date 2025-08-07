"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, Check, Zap, Crown, Briefcase } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnimatedBackground } from "@/components/animated-background"
import { APIPlanPopup } from "@/components/api-plan-popup"
import { getVault } from "@/lib/vault-storage"

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

export default function APIPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const checkAPIVault = async () => {
      try {
        const apiVault = await getVault("oxidikoapi")
        if (apiVault) {
          router.push("/api-dashboard")
        }
      } catch (error) {
        // Vault doesn't exist, stay on current page
      }
    }

    checkAPIVault()
  }, [router])

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "/month",
      description: "For testing, small projects, or personal use.",
      icon: Shield,
      color: "text-gray-400",
      bgColor: "bg-gray-900/50",
      borderColor: "border-gray-700",
      features: ["1,000 logins per month", "Basic email support", "Best for hobby projects and demos"],
      limit: "1,000 logins/month",
      popular: false,
      quota: 1000,
    },
    {
      id: "starter",
      name: "Starter",
      price: "$15",
      period: "/month",
      description: "For developers and startups who need more room.",
      icon: Zap,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-500",
      features: ["10,000 logins per month", "Priority support", "Good for production apps and early-stage businesses"],
      limit: "10,000 logins/month",
      popular: true,
      quota: 10000,
    },
    {
      id: "premium",
      name: "Premium",
      price: "$50",
      period: "/month",
      description: "For applications with high traffic or enterprise needs.",
      icon: Crown,
      color: "text-amber-400",
      bgColor: "bg-amber-900/20",
      borderColor: "border-amber-500",
      features: [
        "50,000 logins per month",
        "Premium support",
        "Ideal for scaling businesses and SaaS platforms"
      ],
      limit: "50,000 logins/month",
      popular: false,
      quota: 50000
    },
    {
      id: "elite",
      name: "Elite",
      price: "$150",
      period: "/month",
      description: "For large companies and heavy apps",
      icon: Briefcase,
      color: "text-purple-400",
      bgColor: "bg-purple-900/20",
      borderColor: "border-purple-500",
      features: [
        "300,000 logins/month",
        "Premium support",
        "Best for enterprises & demanding apps"
      ],
      limit: "300,000 logins/month",
      popular: false,
      quota: 300000
    }
  ]

  const handleChoosePlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowPopup(true)
  }

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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <Shield className="h-16 w-16 text-blue-400" />
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent animate-gradient">
              Oxidiko API Pricing
            </h1>
            <p className="text-2xl text-gray-300 mb-4 animate-fade-in-up delay-300">
              Choose the perfect plan for your authentication needs
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto animate-fade-in-up delay-500">
              Secure, scalable, and simple pricing that grows with your business
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-16">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              return (
                <Card
                  key={plan.id}
                  className={`${plan.bgColor} ${plan.borderColor} backdrop-blur-sm hover:bg-opacity-80 transition-all duration-500 hover:scale-105 hover:shadow-2xl group animate-fade-in-up relative ${
                    plan.popular ? "ring-2 ring-blue-500" : ""
                  }`}
                  style={{ animationDelay: `${800 + index * 200}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="relative mb-4">
                      <IconComponent
                        className={`h-12 w-12 ${plan.color} mx-auto group-hover:scale-110 transition-transform duration-300`}
                      />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">{plan.name}</CardTitle>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400 text-lg">{plan.period}</span>
                    </div>
                    <CardDescription className="text-gray-400">{plan.description}</CardDescription>
                    <div className={`text-sm font-semibold ${plan.color} mt-2`}>{plan.limit}</div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleChoosePlan(plan)}
                      className={`w-full ${
                        plan.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"
                      } text-white transition-all duration-300`}
                    >
                      {plan.id === "free" ? "Get Started" : "Choose Plan"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who trust Oxidiko for secure, passwordless authentication
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/docs")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                View Documentation
              </Button>
              <Button
                onClick={() => router.push("/demo")}
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 text-lg"
              >
                Try Demo
              </Button>
            </div>
          </div>

          {/* API Dashboard Link */}
          <div className="text-center mt-8 pt-8 border-t border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-4">Already have an API account?</h3>
            <Button
              onClick={() => router.push("/api-dashboard")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
            >
              Access API Dashboard
            </Button>
          </div>
        </div>
      </div>

      <APIPlanPopup isOpen={showPopup} onClose={() => setShowPopup(false)} plan={selectedPlan} />
    </div>
  )
}
