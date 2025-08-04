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
              Professional live streaming platform for YouTube creators.
            </p>

            {!session ? (
              <div className="space-y-4">
                <Button
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
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
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300"
                  >
                    <Video className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-24 bg-black/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            One-Stop Solution for YouTube Live Streaming
          </h2>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            StreamTube is your complete platform for managing live streams on YouTube. From setting
            up your stream to going live with professional quality, we provide everything you need
            in one unified solution. Whether you're a content creator, educator, or business,
            StreamTube simplifies the entire live streaming process.
          </p>
        </div>
      </div>
    </div>
  );
}
