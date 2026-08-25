import { Pencil, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { GetMocks, SetMocks } from "wailsjs/go/main/App";
import { EventsOn } from "wailsjs/runtime/runtime";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { MockEditor } from "./MockEditor";
import { reportError } from "../lib/report-error";

type MockRule = {
  Method: string;
  Path: string;
  Body: string;
  Enabled: boolean;
  Status: number;
};

export function MockManager() {
  const [mocks, setMocks] = useState<MockRule[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const loadMocks = async () => {
    try {
      const m = await GetMocks();
      setMocks(m ?? []);
    } catch (err) {
      reportError("Could not load mocks", err);
    }
  };

  useEffect(() => {
    loadMocks();
    const unsub = EventsOn("mocks-updated", (m: MockRule[]) => setMocks(m ?? []));
    return () => unsub?.();
  }, []);

  const handleToggle = async (index: number) => {
    const updated = mocks.map((m, i) =>
      i === index ? { ...m, Enabled: !m.Enabled } : m,
    );
    try {
      await SetMocks(updated);
      setMocks(updated);
    } catch (err) {
      reportError("Could not update the mock", err);
    }
  };

  const handleDelete = async (index: number) => {
    const updated = mocks.filter((_, i) => i !== index);
    try {
      await SetMocks(updated);
      setMocks(updated);
    } catch (err) {
      reportError("Could not delete the mock", err);
    }
  };

  const handleSaveEdit = async (body: string, status: number) => {
    if (editIndex === null) return;
    const updated = mocks.map((m, i) =>
      i === editIndex ? { ...m, Body: body, Status: status } : m,
    );
    try {
      await SetMocks(updated);
      setMocks(updated);
      setEditIndex(null);
    } catch (err) {
      reportError("Could not save the mock", err);
    }
  };

  const editing = editIndex !== null ? mocks[editIndex] : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-[80px_1fr_70px_70px_80px] px-4 py-1.5 text-xs text-muted-foreground border-b border-border">
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
            className="grid grid-cols-[80px_1fr_70px_70px_80px] px-4 py-2 text-sm border-b border-border hover:bg-muted/50 items-center"
          >
            <div className="font-mono text-xs">{m.Method}</div>
            <div className="truncate text-xs">{m.Path}</div>
            <div className="text-xs">{m.Status}</div>
            <div>
              <Switch
                aria-label={`${m.Enabled ? "Disable" : "Enable"} mock for ${m.Path}`}
                size="sm"
                checked={m.Enabled}
                onCheckedChange={() => handleToggle(i)}
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                aria-label={`Edit mock for ${m.Path}`}
                title="Edit mock"
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditIndex(i)}
              >
                <Pencil aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button
                aria-label={`Delete mock for ${m.Path}`}
                title="Delete mock"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(i)}
              >
                <Trash aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <MockEditor
          open={editIndex !== null}
          method={editing.Method}
          path={editing.Path}
          status={editing.Status}
          initialBody={editing.Body}
          onClose={() => setEditIndex(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
