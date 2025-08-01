"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import StreamingStudio from "@/components/streaming/StreamingStudio";

export default function StudioPage() {
  return (
    <ProtectedRoute>
      <StreamingStudio />
    </ProtectedRoute>
  );
}
