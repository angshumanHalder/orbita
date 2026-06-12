import { useState } from "react";
import { useEffect } from "react";
import { EventsOn } from "wailsjs/runtime/runtime";
import { Button } from "./ui/button";

type WSFrame = {
  URL: string;
  Direction: string;
  MsgType: number;
  Payload: string;
  Time: number;
};

export function WebSocketLog() {
  const [frames, setFrames] = useState<WSFrame[]>([]);

  useEffect(() => {
    const off = EventsOn("ws-frames", (frame: WSFrame) => {
      setFrames((prev) => [frame, ...prev]);
    });
    return () => off();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => setFrames([])}>
          Clear
        </Button>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[24px_70px_1fr_1fr] px-4 py-1.5 text-xs text-muted-foreground border-b border-border font-mono">
        <div></div>
        <div>Time</div>
        <div>URL</div>
        <div>Payload</div>
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {frames.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No WebSocket frames yet.
          </div>
        )}
        {frames.map((f, i) => (
          <div
            key={i}
            className={`grid grid-cols-[24px_70px_1fr_1fr] px-4 py-1.5 border-b border-border items-center ${
              f.Direction === "send" ? "text-primary" : "text-green-500"
            }`}
          >
            <span>{f.Direction === "send" ? "↑" : "↓"}</span>
            <span className="text-muted-foreground">
              {new Date(f.Time).toLocaleTimeString()}
            </span>
            <span className="truncate pr-2">{f.URL}</span>
            <span className="truncate">{f.Payload}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
