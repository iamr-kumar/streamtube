"use client";

import { Button } from "@/components/ui/button";
import { Shield, Video, Youtube, Zap } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-32 rounded-lg bg-[var(--bg-tertiary)]"></div>
          <div className="h-4 w-48 rounded-lg bg-[var(--bg-tertiary)]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary text-text-secondary">
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-16 space-y-12">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-secondary)]/90 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 opacity-60" aria-hidden>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.04),transparent_32%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(250,45,72,0.08),transparent_36%)]"></div>
            </div>

            <div className="relative px-8 py-12 md:px-12 md:py-16 flex flex-col items-center text-center space-y-8">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)]/60 border border-[var(--border-soft)]">
                <div className="h-12 w-12 rounded-lg bg-[var(--accent-red)] flex items-center justify-center">
                  <Youtube className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-[var(--text-muted)]">Live to YouTube, simply</p>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    Stream<span className="text-[var(--accent-red)]">Tube</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-primary)] tracking-tight">
                  Broadcast with confidence.
                </h1>
                <p className="text-lg md:text-xl text-[var(--text-secondary)]/90">
                  A focused studio for creators who want calm, controlled, reliable streaming to
                  YouTube.
                </p>
              </div>

              {!session ? (
                <div className="space-y-3">
                  <Button
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    size="lg"
                    className="px-6"
                  >
                    <Youtube className="mr-2 h-5 w-5" />
                    Sign in with Google
                  </Button>
                  <p className="text-sm text-[var(--text-muted)]">
                    Connect your channel to set up and go live in minutes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[var(--text-secondary)]">
                    Welcome back,{" "}
                    <span className="text-[var(--text-primary)]">{session.user?.name}</span>
                  </p>
                  <Link href="/dashboard">
                    <Button size="lg" className="px-6">
                      <Video className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Secure by design",
                icon: Shield,
                copy: "Protected flows with clear states so you never guess what's live.",
              },
              {
                title: "Studio-grade control",
                icon: Video,
                copy: "Preview, adjust, and go live without noise, glare, or clutter.",
              },
              {
                title: "Instant readiness",
                icon: Zap,
                copy: "Stream setup that feels native—fast feedback and deliberate motion.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-secondary)]/80 px-4 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.28)]"
              >
                <div className="flex items-center gap-3 mb-3 text-[var(--text-primary)]">
                  <div className="h-10 w-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--accent-red)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">{item.title}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]/90 leading-relaxed">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
