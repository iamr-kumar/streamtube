import React from "react";
import { Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import StreamCanvas from "./StreamCanvas";

interface LivePreviewPanelProps {
  isStreaming: boolean;
  cameraEnabled: boolean;
  screenEnabled: boolean;
  micEnabled: boolean;
  onStreamData: (data: Blob) => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  isStreaming,
  cameraEnabled,
  screenEnabled,
  micEnabled,
  onStreamData,
}) => {
  return (
    <Card className="shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
      <CardHeader>
        <CardTitle className="text-[var(--text-primary)] flex items-center space-x-2">
          <Video className="h-5 w-5 text-[var(--accent-red)]" />
          <span>Live Preview</span>
          {isStreaming && (
            <div className="flex items-center space-x-2 ml-auto">
              <div className="w-3 h-3 bg-[var(--accent-red)] rounded-full animate-pulse" />
              <span className="text-[var(--accent-red)] text-sm font-medium">LIVE</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StreamCanvas
          isStreaming={isStreaming}
          cameraEnabled={cameraEnabled}
          screenEnabled={screenEnabled}
          micEnabled={micEnabled}
          onStreamData={onStreamData}
        />
      </CardContent>
    </Card>
  );
};
