import { useEffect, useState } from "react";
import {
  AddPACDomain,
  GetPACDomains,
  RemovePACDomain,
} from "wailsjs/go/main/App";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Trash } from "lucide-react";

export function PACDomainsPanel() {
  const [domains, setDomains] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const load = async () => {
    const d = await GetPACDomains();
    setDomains(d ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;
    await AddPACDomain(input.trim());
    setInput("");
    load();
  };

  const handleRemove = async (domain: string) => {
    await RemovePACDomain(domain);
    load();
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. api.example.com"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-7 text-xs"
        />
        <Button size="sm" onClick={handleAdd}>Add</Button>
      </div>
      {domains.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          No domains. Import env config to auto-populate.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {domains.map((d) => (
            <div
              key={d}
              className="flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-xs font-mono text-foreground">{d}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => handleRemove(d)}>
                <Trash className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
