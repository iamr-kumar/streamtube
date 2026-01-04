import React from "react";
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface MediaControlsPanelProps {
  cameraEnabled: boolean;
  micEnabled: boolean;
  screenEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreen: () => void;
  disabled?: boolean;
}

export const MediaControlsPanel: React.FC<MediaControlsPanelProps> = ({
  cameraEnabled,
  micEnabled,
  screenEnabled,
  onToggleCamera,
  onToggleMic,
  onToggleScreen,
  disabled = false,
}) => {
  return (
    <Card className="shadow-[0_18px_50px_rgba(0,0,0,0.32)]">
      <CardHeader>
        <CardTitle className="text-[var(--text-primary)]">Media Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            size="lg"
            onClick={onToggleCamera}
            disabled={disabled}
            className={`px-5 ${
              cameraEnabled
                ? "bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white"
                : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-primary)]"
            }`}
          >
            {cameraEnabled ? (
              <Video className="h-5 w-5 mr-2" />
            ) : (
              <VideoOff className="h-5 w-5 mr-2" />
            )}
            Camera
          </Button>

          <Button
            size="lg"
            onClick={onToggleMic}
            disabled={disabled}
            className={`px-5 ${
              micEnabled
                ? "bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white"
                : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-primary)]"
            }`}
          >
            {micEnabled ? <Mic className="h-5 w-5 mr-2" /> : <MicOff className="h-5 w-5 mr-2" />}
            Microphone
          </Button>

          <Button
            size="lg"
            onClick={onToggleScreen}
            disabled={disabled}
            className={`px-5 ${
              screenEnabled
                ? "bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white"
                : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-[var(--text-primary)]"
            }`}
          >
            {screenEnabled ? (
              <Monitor className="h-5 w-5 mr-2" />
            ) : (
              <MonitorOff className="h-5 w-5 mr-2" />
            )}
            Screen Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
