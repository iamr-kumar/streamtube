import React from "react";
import { Home, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const QuickActionsPanel: React.FC = () => {
  const router = useRouter();

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--text-primary)]">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" onClick={handleDashboardClick} className="w-full">
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Button variant="outline" className="w-full" disabled>
          <Monitor className="h-4 w-4 mr-2" />
          Stream Settings
          <span className="text-xs text-[var(--text-muted)] ml-auto">(Soon)</span>
        </Button>
      </CardContent>
    </Card>
  );
};
