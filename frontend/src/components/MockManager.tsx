import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { GetMocks, SetMocks } from "wailsjs/go/main/App";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";

export function MockManager() {
  const [mocks, setMocks] = useState<
    {
      Method: string;
      Path: string;
      Body: string;
      Enabled: boolean;
      Status: number;
    }[]
  >([]);

  const loadMocks = async () => {
    try {
      const mocks = await GetMocks();
      setMocks(mocks ?? []);
    } catch (err) {
      console.error("unable to load mocks", err);
    }
  };

  const handleToggle = async (index: number) => {
    const updated = mocks.map((m, i) =>
      i === index ? { ...m, Enabled: !m.Enabled } : m,
    );

    setMocks(updated);
    await SetMocks(updated);
  };

  const handleDelete = async (index: number) => {
    const updated = mocks.filter((_, i) => index !== i);
    setMocks(updated);
    await SetMocks(updated);
  };

  useEffect(() => {
    loadMocks();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-[80px_1fr_70px_70px_60px] px-4 py-1.5 text-xs text-muted-foreground border-b border-border">
        <div>Method</div>
        <div>Path</div>
        <div>Status</div>
        <div>Enabled</div>
        <div>Actions</div>
      </div>
      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {mocks.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No mocks yet. Right-click a request to create one.
          </div>
        )}
        {mocks.map((m, i) => (
          <div
            key={i}
            className="grid grid-cols-[80px_1fr_70px_70px_60px] px-4 py-2 text-sm border-b border-border hover:bg-muted/50 items-center"
          >
            <div className="font-mono text-xs">{m.Method}</div>
            <div className="truncate text-xs">{m.Path}</div>
            <div className="text-xs">{m.Status}</div>
            <div>
              <Switch
                size="sm"
                checked={m.Enabled}
                onCheckedChange={() => handleToggle(i)}
              />
            </div>
            <div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(i)}
              >
                <Trash className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
