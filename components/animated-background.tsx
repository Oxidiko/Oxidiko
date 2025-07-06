"use client"

import { Shield, Lock, Fingerprint, Key, Vault, Code, BookOpen, Settings, Zap, Globe } from "lucide-react"

interface AnimatedBackgroundProps {
  variant?: "default" | "docs"
}

export function AnimatedBackground({ variant = "default" }: AnimatedBackgroundProps) {
  const getFloatingIcons = () => {
    if (variant === "docs") {
      return (
        <>
          <div className="absolute top-32 left-1/4 animate-float">
            <Code className="w-6 h-6 text-blue-400/60" />
          </div>
          <div className="absolute top-64 right-1/3 animate-float delay-500">
            <BookOpen className="w-5 h-5 text-purple-400/60" />
          </div>
          <div className="absolute bottom-48 left-1/2 animate-float delay-1000">
            <Settings className="w-4 h-4 text-cyan-400/60" />
          </div>
          <div className="absolute top-80 right-1/4 animate-float delay-1500">
            <Zap className="w-7 h-7 text-green-400/60" />
          </div>
          <div className="absolute top-1/2 left-1/6 animate-float delay-2000">
            <Globe className="w-5 h-5 text-yellow-400/60" />
          </div>
        </>
      )
    }

    return (
      <>
        <div className="absolute top-32 left-1/4 animate-float">
          <Shield className="w-6 h-6 text-blue-400/60" />
        </div>
        <div className="absolute top-64 right-1/3 animate-float delay-500">
          <Lock className="w-5 h-5 text-purple-400/60" />
        </div>
        <div className="absolute bottom-48 left-1/2 animate-float delay-1000">
          <Key className="w-4 h-4 text-cyan-400/60" />
        </div>
        <div className="absolute top-80 right-1/4 animate-float delay-1500">
          <Fingerprint className="w-7 h-7 text-green-400/60" />
        </div>
        <div className="absolute top-1/2 left-1/6 animate-float delay-2000">
          <Vault className="w-5 h-5 text-yellow-400/60" />
        </div>
        <div className="absolute bottom-1/3 right-1/5 animate-float delay-2500">
          <Shield className="w-4 h-4 text-pink-400/60" />
        </div>
        <div className="absolute top-1/4 right-1/2 animate-float delay-3000">
          <Lock className="w-6 h-6 text-indigo-400/60" />
        </div>
        <div className="absolute bottom-64 left-1/4 animate-float delay-3500">
          <Key className="w-5 h-5 text-red-400/60" />
        </div>
        <div className="absolute top-96 left-3/4 animate-float delay-4000">
          <Fingerprint className="w-4 h-4 text-orange-400/60" />
        </div>
        <div className="absolute bottom-80 right-2/3 animate-float delay-4500">
          <Vault className="w-6 w-6 text-teal-400/60" />
        </div>
      </>
    )
  }

  return (
    <>
      {/* Enhanced Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large glowing orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/8 to-purple-500/8 rounded-full blur-3xl animate-spin-slow"></div>

        {/* Additional background color effects */}
        <div className="absolute top-10 right-1/4 w-64 h-64 bg-green-500/12 rounded-full blur-2xl animate-pulse delay-3000"></div>
        <div className="absolute bottom-32 right-10 w-48 h-48 bg-yellow-500/10 rounded-full blur-2xl animate-pulse delay-4000"></div>
        <div className="absolute top-1/3 left-20 w-56 h-56 bg-pink-500/8 rounded-full blur-2xl animate-pulse delay-1500"></div>
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2500"></div>

        {/* Security-related floating shapes */}
        {getFloatingIcons()}
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(14, 165, 233, 0.5); }
          50% { box-shadow: 0 0 30px rgba(14, 165, 233, 0.8); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
        .delay-1000 { animation-delay: 1s; }
        .delay-1200 { animation-delay: 1.2s; }
        .delay-1400 { animation-delay: 1.4s; }
        .delay-1500 { animation-delay: 1.5s; }
        .delay-2000 { animation-delay: 2s; }
        .delay-2500 { animation-delay: 2.5s; }
        .delay-3000 { animation-delay: 3s; }
        .delay-3500 { animation-delay: 3.5s; }
        .delay-4000 { animation-delay: 4s; }
        .delay-4500 { animation-delay: 4.5s; }
      `}</style>
    </>
  )
}
