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
    <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-r from-red-500 to-purple-600 rounded-lg">
              <Youtube className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Streaming Studio</h1>
          </div>

          <div className="flex items-center space-x-4">
            {userName && (
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="h-4 w-4" />
                <span className="text-sm">{userName}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDashboardClick}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
