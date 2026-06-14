import { CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { EventsOn } from "wailsjs/runtime/runtime";
import { Button } from "./ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { Input } from "./ui/input";
import { MockEditor } from "./MockEditor";
import { GetMocks, SetMocks } from "wailsjs/go/main/App";

type MockRule = {
  Method: string;
  Path: string;
  Body: string;
  Enabled: boolean;
  Status: number;
};

type LogEntry = {
  Method: string;
  Path: string;
  Status: number;
  Latency: number;
  Mocked: boolean;
  Time: number;
  ContentType: string;
};

const NON_API = [
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "image/",
  "font/",
  "audio/",
  "video/",
];

export function RequestLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [mocks, setMocks] = useState<MockRule[]>([]);
  const [xhrOnly, setXhrOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [mockDraft, setMockDraft] = useState<{
    method: string;
    path: string;
    status: number;
    body?: string;
  } | null>(null);

  useEffect(() => {
    const unsub = EventsOn("request-log", (entry: LogEntry) => {
      setEntries((prev: LogEntry[]) => [entry, ...prev]);
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    GetMocks().then((m) => setMocks(m ?? []));
    const unsub = EventsOn("mocks-updated", (m: MockRule[]) => setMocks(m ?? []));
    return () => unsub?.();
  }, []);

  const isEntryMocked = (entry: LogEntry) =>
    mocks.some(
      (m) =>
        m.Enabled &&
        m.Method.toUpperCase() === entry.Method.toUpperCase() &&
        m.Path.split("?")[0] === entry.Path.split("?")[0],
    );

  const statusStyleHelper = (status: number) => {
    return status >= 400
      ? "text-destructive"
      : status >= 200
        ? "text-green-500"
        : "text-muted-foreground";
  };

  const handleMock = (entry: LogEntry) => {
    setMockDraft({
      method: entry.Method,
      path: entry.Path,
      status: entry.Status,
    });
  };

  const handleSaveMock = async (body: string, status: number) => {
    if (!mockDraft) return;
    const existing = await GetMocks();
    const updated = [
      ...(existing ?? []),
      {
        Method: mockDraft.method,
        Path: mockDraft.path,
        Body: body,
        Status: status,
        Enabled: true,
      },
    ];
    await SetMocks(updated);
    setMocks(updated);
    setMockDraft(null);
  };

  const visible = entries
    .filter((e) => !xhrOnly || !NON_API.some((t) => e.ContentType.includes(t)))
    .filter((e) => e.Path.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <Button
          variant={xhrOnly ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setXhrOnly((v) => !v)}
        >
          XHR
        </Button>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter path..."
          className="h-7 text-xs w-56"
        />
        <Button variant="ghost" size="sm" onClick={() => setEntries([])}>
          Clear
        </Button>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[80px_1fr_70px_80px_70px_50px] px-4 py-1.5 text-xs text-muted-foreground border-b border-border">
        <div>Method</div>
        <div>Path</div>
        <div>Status</div>
        <div>Latency</div>
        <div>Time</div>
        <div>Mocked</div>
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {entries.length === 0
              ? "No requests yet."
              : "No matching requests."}
          </div>
        )}
        {visible.map((e, i) => (
          <ContextMenu key={i}>
            <ContextMenuTrigger>
              <div className="grid grid-cols-[80px_1fr_70px_80px_70px_50px] px-4 py-2 text-sm border-b border-border hover:bg-muted/50 items-center">
                <span className="font-mono text-xs">{e.Method}</span>
                <span className="truncate text-xs" title={e.Path}>
                  {e.Path}
                </span>
                <span className={`text-xs ${statusStyleHelper(e.Status)}`}>
                  {e.Status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.Latency}ms
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.Time).toLocaleTimeString()}
                </span>
                <span>
                  {isEntryMocked(e) ? (
                    <CircleCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleMock(e)}>
                Mock this endpoint
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      {mockDraft && (
        <MockEditor
          method={mockDraft.method}
          onClose={() => setMockDraft(null)}
          onSave={(body: string, status: number) => {
            handleSaveMock(body, status);
          }}
          open={mockDraft !== null}
          path={mockDraft.path}
          status={mockDraft.status}
        />
      )}
    </div>
  );
}
