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
  const getButtonStyles = (isEnabled: boolean) => ({
    className: `${
      isEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
    } text-white px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`,
  });

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Media Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center space-x-4">
          <Button
            variant={cameraEnabled ? "default" : "secondary"}
            size="lg"
            onClick={onToggleCamera}
            disabled={disabled}
            {...getButtonStyles(cameraEnabled)}
          >
            {cameraEnabled ? (
              <Video className="h-5 w-5 mr-2" />
            ) : (
              <VideoOff className="h-5 w-5 mr-2" />
            )}
            Camera
          </Button>

          <Button
            variant={micEnabled ? "default" : "secondary"}
            size="lg"
            onClick={onToggleMic}
            disabled={disabled}
            {...getButtonStyles(micEnabled)}
          >
            {micEnabled ? <Mic className="h-5 w-5 mr-2" /> : <MicOff className="h-5 w-5 mr-2" />}
            Microphone
          </Button>

          <Button
            variant={screenEnabled ? "default" : "secondary"}
            size="lg"
            onClick={onToggleScreen}
            disabled={disabled}
            {...getButtonStyles(screenEnabled)}
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
