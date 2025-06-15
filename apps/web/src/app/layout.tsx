import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/providers/SessionProvider";

export const metadata: Metadata = {
  title: "StreamTube",
  description: "StreamTube - Stream to YouTube with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
