import { useEffect, useState } from "react";
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
      <div className="flex h-11 items-center justify-between border-b border-border px-4">
        <div>
          <span className="text-sm font-medium">WebSocket frames</span>
          <span className="ml-2 text-xs text-muted-foreground">{frames.length}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setFrames([])}>
          Clear
        </Button>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[72px_90px_1fr_1fr] border-b border-border bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <div>Direction</div>
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
            className="grid grid-cols-[72px_90px_1fr_1fr] items-center border-b border-border/70 px-4 py-2 hover:bg-muted/30"
          >
            <span className={f.Direction === "send" ? "text-primary" : "text-green-500"}>
              {f.Direction === "send" ? "↑ Sent" : "↓ Received"}
            </span>
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
