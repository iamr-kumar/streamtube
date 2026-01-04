import React from "react";
import { Separator } from "../ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface StreamStatusPanelProps {
  cameraEnabled: boolean;
  micEnabled: boolean;
  screenEnabled: boolean;
  isStreaming: boolean;
}

export const StreamStatusPanel: React.FC<StreamStatusPanelProps> = ({
  cameraEnabled,
  micEnabled,
  screenEnabled,
  isStreaming,
}) => {
  const StatusIndicator: React.FC<{ enabled: boolean }> = ({ enabled }) => (
    <div
      className={`w-3 h-3 rounded-full ${
        enabled ? "bg-[var(--accent-red)]" : "bg-[var(--text-muted)]"
      }`}
    />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--text-primary)]">Stream Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-secondary)]">Camera</span>
          <StatusIndicator enabled={cameraEnabled} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-secondary)]">Microphone</span>
          <StatusIndicator enabled={micEnabled} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-secondary)]">Screen Share</span>
          <StatusIndicator enabled={screenEnabled} />
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-secondary)]">Stream Status</span>
          <span
            className={`text-sm font-semibold ${
              isStreaming ? "text-[var(--accent-red)]" : "text-[var(--text-muted)]"
            }`}
          >
            {isStreaming ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
