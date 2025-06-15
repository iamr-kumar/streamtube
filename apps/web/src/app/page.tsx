"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Video, Youtube, Zap } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-white/20 rounded mb-4"></div>
          <div className="h-4 w-48 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-red-500 to-purple-600 rounded-2xl shadow-2xl">
                <Youtube className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Stream
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
                Tube
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Professional live streaming platform for YouTube creators. Camera, screen sharing, and
              seamless RTMP streaming.
            </p>

            {!session ? (
              <div className="space-y-4">
                <Button
                  onClick={() => signIn("google", { callbackUrl: "/studio" })}
                  size="lg"
                  className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-red-500/25 transition-all duration-300"
                >
                  <Youtube className="mr-2 h-5 w-5" />
                  Sign in with Google
                </Button>
                <p className="text-gray-400 text-sm">
                  Connect your Google account to start streaming to YouTube
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-300 mb-4">
                  Welcome back,{" "}
                  <span className="text-white font-semibold">{session.user?.name}</span>!
                </p>
                <Link href="/studio">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                  >
                    <Video className="mr-2 h-5 w-5" />
                    Go to Streaming Studio
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to go live
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Professional streaming tools designed for content creators who demand quality and
              reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg w-fit mb-4">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Multi-Source Streaming</CardTitle>
                <CardDescription className="text-gray-300">
                  Seamlessly combine camera feed and screen sharing with intelligent layout
                  composition.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg w-fit mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Real-Time Processing</CardTitle>
                <CardDescription className="text-gray-300">
                  Low-latency RTMP conversion and streaming directly to your YouTube channel.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg w-fit mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">Secure & Reliable</CardTitle>
                <CardDescription className="text-gray-300">
                  Enterprise-grade security with Google OAuth and reliable streaming infrastructure.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
