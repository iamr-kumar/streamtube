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
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Video className="h-5 w-5" />
          <span>Live Preview</span>
          {isStreaming && (
            <div className="flex items-center space-x-2 ml-auto">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-medium">LIVE</span>
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
