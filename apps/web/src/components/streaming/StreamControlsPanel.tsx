import React from "react";
import { Play, Square } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface StreamControlsPanelProps {
  isStreaming: boolean;
  onStartStream: () => void;
  onStopStream: () => void;
  disabled?: boolean;
}

export const StreamControlsPanel: React.FC<StreamControlsPanelProps> = ({
  isStreaming,
  onStartStream,
  onStopStream,
  disabled = false,
}) => {
  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Stream Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="text-sm text-gray-400">
            {isStreaming ? "Stream is live!" : "Ready to stream"}
          </div>
          <Button
            onClick={isStreaming ? onStopStream : onStartStream}
            disabled={disabled}
            className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-300 ${
              isStreaming
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="h-5 w-5 mr-2" />
                Stop Stream
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Stream
              </>
            )}
          </Button>
          {!isStreaming && (
            <div className="text-xs text-gray-500 text-center">
              Make sure to create a stream from the dashboard first
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
