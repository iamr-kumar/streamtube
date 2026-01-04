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
    <Card>
      <CardHeader>
        <CardTitle className="text-[var(--text-primary)]">Stream Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="text-sm text-[var(--text-muted)]">
            {isStreaming ? "Stream is live" : "Ready to stream"}
          </div>
          <Button
            onClick={isStreaming ? onStopStream : onStartStream}
            disabled={disabled}
            size="lg"
            className={`w-full py-3 text-lg font-semibold ${
              isStreaming
                ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--accent-red)] hover:bg-[var(--accent-red-muted)]"
                : "bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white"
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="h-5 w-5 mr-2" />
                End Stream
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Go Live
              </>
            )}
          </Button>
          {!isStreaming && (
            <div className="text-xs text-[var(--text-muted)] text-center">
              Make sure to create a stream from the dashboard first
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
