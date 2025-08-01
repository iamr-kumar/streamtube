"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};
