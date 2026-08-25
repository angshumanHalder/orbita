import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  ApplyEnvMapping,
  GetEnvConfigNames,
  ImportEnvConfig,
  OpenFilePicker,
} from "wailsjs/go/main/App";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { reportError } from "../lib/report-error";

type Props = { onMappingApplied: () => void };

export function EnvMappingPanel({ onMappingApplied }: Props) {
  const [filePath, setFilePath] = useState("");
  const [envNames, setEnvNames] = useState<string[]>([]);
  const [fromEnv, setFromEnv] = useState("");
  const [toEnv, setToEnv] = useState("");

  const handleImportFile = async () => {
    try {
      const filePath = await OpenFilePicker();
      if (filePath) {
        await ImportEnvConfig(filePath);
        setFilePath(filePath);
        const envs = await GetEnvConfigNames();
        setEnvNames(envs);
      }
    } catch (err) {
      reportError("Could not import the environment file", err);
    }
  };

  const handleApplyEnvMapping = async () => {
    try {
      await ApplyEnvMapping(fromEnv, toEnv);
      onMappingApplied();
    } catch (err) {
      reportError("Could not apply the environment mapping", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground">Config File</h3>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Selected environment configuration file"
            value={filePath || "No file selected"}
            readOnly
            className="flex-1 h-7 text-xs font-mono text-muted-foreground cursor-default"
          />
          <Button size="sm" onClick={handleImportFile}>
            Import
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-foreground">
          Environment Mapping
        </h3>
        <div className="flex items-center gap-2">
          <Select value={fromEnv} onValueChange={(v) => setFromEnv(v ?? "")}>
            <SelectTrigger aria-label="Source environment" className="flex-1">
              <SelectValue placeholder="From" />
            </SelectTrigger>
            <SelectContent>
              {envNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={toEnv} onValueChange={(v) => setToEnv(v ?? "")}>
            <SelectTrigger aria-label="Target environment" className="flex-1">
              <SelectValue placeholder="To" />
            </SelectTrigger>
            <SelectContent>
              {envNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!fromEnv || !toEnv}
            onClick={handleApplyEnvMapping}
          >
            Apply Mapping
          </Button>
        </div>
      </div>
    </div>
  );
}
