"use client";

import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        <Card className="shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-xl bg-[var(--accent-red)] flex items-center justify-center">
              <Youtube className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl text-[var(--text-primary)]">
              Sign in to Stream<span className="text-[var(--accent-red)]">Tube</span>
            </CardTitle>
            <CardDescription className="text-[var(--text-secondary)]">
              Connect your Google account to start streaming to YouTube
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full justify-center"
              size="lg"
            >
              <Youtube className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>

            <div className="text-center">
              <p className="text-sm text-[var(--text-muted)]">
                By signing in, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
