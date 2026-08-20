import { useEffect, useState } from "react";
import "./App.css";
import { profiles } from "wailsjs/go/models";
import {
  GetActiveEnv,
  GetEnvironments,
  GetProxyAddr,
  OpenInChrome,
  SetActiveEnv,
  StartRecording,
  StopRecording,
} from "wailsjs/go/main/App";
import { EnvSelector } from "./components/EnvSelector";
import { Button } from "./components/ui/button";
import { Circle, Globe, Orbit, Square } from "lucide-react";
import { RequestLog } from "./components/RequestLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { MockManager } from "./components/MockManager";
import { ConfigPanel } from "./components/ConfigPanel";
import { TestOutputDialog } from "./components/TestOutputDialog";
import { WebSocketLog } from "./components/WebSocketLog";

function App() {
  const [envs, setEnvs] = useState<profiles.Environment[]>([]);
  const [activeEnvName, setActiveEnvName] = useState("");
  const [activeEnv, setActiveEnv] = useState<profiles.Environment | null>(null);
  const [proxyAddr, setProxyAddr] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [testOutput, setTestOutput] = useState("");

  const loadEnvs = async () => {
    try {
      const proxyAddr = await GetProxyAddr();
      setProxyAddr(proxyAddr);
      const envs = await GetEnvironments();
      setEnvs(envs);
      const activeEnv = await GetActiveEnv();
      if (activeEnv) {
        setActiveEnv(activeEnv);
        setActiveEnvName(activeEnv.Name);
      } else {
        setActiveEnv(null);
        setActiveEnvName("");
      }
    } catch (err) {
      console.error("Failed to read config", err);
    }
  };

  const handleEnvChange = async (name: string) => {
    try {
      await SetActiveEnv(name);
      const activeEnv = await GetActiveEnv();
      if (activeEnv !== null) {
        setActiveEnvName(activeEnv.Name);
        setActiveEnv(activeEnv);
      }
    } catch (err) {
      console.error("Unable to set environment", err);
    }
  };

  const handleOpenChrome = async () => {
    try {
      await OpenInChrome();
    } catch (err) {
      console.error("Failed to open chrome", err);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      const output = await StopRecording();
      setTestOutput(output);
    } else {
      await StartRecording();
    }
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    loadEnvs();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-card/60 px-5 shadow-sm">
        <div className="flex items-center gap-2 pr-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Orbit className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Orbita</span>
        </div>
        <EnvSelector
          activeEnv={activeEnvName}
          environments={envs}
          onEnvChange={handleEnvChange}
        />
        <div className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
          <span className={`size-1.5 rounded-full ${proxyAddr ? "bg-green-500" : "bg-muted-foreground"}`} />
          <span className="font-mono">{proxyAddr || "Proxy offline"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={handleToggleRecording}
          >
            {isRecording ? (
              <Square className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
            {isRecording ? "Stop" : "Record"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenChrome}>
            <Globe className="w-3 h-3" /> Open in Chrome
          </Button>
        </div>
      </header>
      <Tabs
        className="flex flex-1 flex-col overflow-hidden p-3"
        defaultValue="request-log"
      >
        <TabsList className="mb-2 shrink-0 self-start">
          <TabsTrigger value="request-log">Requests</TabsTrigger>
          <TabsTrigger value="ws-log">WebSockets</TabsTrigger>
          <TabsTrigger value="mocks">Mocks</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>
        <TabsContent
          value="request-log"
          keepMounted
          className="panel flex-1 overflow-hidden"
        >
          <RequestLog />
        </TabsContent>
        <TabsContent value="ws-log" keepMounted className="panel flex-1 overflow-hidden">
          <WebSocketLog />
        </TabsContent>
        <TabsContent value="mocks" className="panel flex-1 overflow-hidden">
          <MockManager />
        </TabsContent>
        <TabsContent value="config" className="panel flex-1 overflow-hidden p-3">
          <ConfigPanel
            activeEnv={activeEnv}
            activeEnvName={activeEnvName}
            onEnvChange={handleEnvChange}
            onEnvsChange={loadEnvs}
          />
        </TabsContent>
      </Tabs>
      <TestOutputDialog
        open={!!testOutput}
        content={testOutput}
        onOpenChange={(open: boolean) => {
          if (!open) setTestOutput("");
        }}
      />
    </div>
  );
}

export default App;
