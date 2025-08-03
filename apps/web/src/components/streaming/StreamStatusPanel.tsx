import React from "react";
import { Separator } from "@radix-ui/react-separator";
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
    <div className={`w-3 h-3 rounded-full ${enabled ? "bg-green-500" : "bg-gray-500"}`} />
  );

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Stream Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Camera</span>
          <StatusIndicator enabled={cameraEnabled} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Microphone</span>
          <StatusIndicator enabled={micEnabled} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Screen Share</span>
          <StatusIndicator enabled={screenEnabled} />
        </div>
        <Separator className="bg-white/10" />
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Stream Status</span>
          <span className={`text-sm font-medium ${isStreaming ? "text-red-400" : "text-gray-400"}`}>
            {isStreaming ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
