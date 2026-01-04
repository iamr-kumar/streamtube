import React from "react";
import { Youtube, User, Home, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface StreamingStudioHeaderProps {
  userName?: string;
}

export const StreamingStudioHeader: React.FC<StreamingStudioHeaderProps> = ({ userName }) => {
  const router = useRouter();

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <header className="bg-[var(--bg-primary)]/85 backdrop-blur-sm border-b border-[var(--border-soft)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-[var(--accent-red)] text-white">
              <Youtube className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Streaming <span className="text-[var(--accent-red)]">Studio</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {userName && (
              <div className="flex items-center space-x-2 text-[var(--text-muted)]">
                <User className="h-4 w-4" />
                <span className="text-sm">{userName}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleDashboardClick}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
