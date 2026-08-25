import { useEffect, useState } from "react";
import "./App.css";
import { profiles } from "wailsjs/go/models";
import {
  GetActiveEnv,
  GetEnvironments,
  GetProxyAddr,
  InstallCA,
  OpenInChrome,
  SetActiveEnv,
  StartRecording,
  StopRecording,
} from "wailsjs/go/main/App";
import { EnvSelector } from "./components/EnvSelector";
import { Button } from "./components/ui/button";
import { Circle, Globe, Orbit, ShieldCheck, Square } from "lucide-react";
import { RequestLog } from "./components/RequestLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { MockManager } from "./components/MockManager";
import { ConfigPanel } from "./components/ConfigPanel";
import { TestOutputDialog } from "./components/TestOutputDialog";
import { WebSocketLog } from "./components/WebSocketLog";
import { reportError } from "./lib/report-error";

function App() {
  const [envs, setEnvs] = useState<profiles.Environment[]>([]);
  const [activeEnvName, setActiveEnvName] = useState("");
  const [activeEnv, setActiveEnv] = useState<profiles.Environment | null>(null);
  const [proxyAddr, setProxyAddr] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [testOutput, setTestOutput] = useState("");
  const [error, setError] = useState("");
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [caInstalled, setCAInstalled] = useState(false);

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
      reportError("Could not load Orbita configuration", err);
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
      reportError("Could not switch environment", err);
    }
  };

  const handleOpenChrome = async () => {
    try {
      await OpenInChrome();
    } catch (err) {
      reportError("Could not open Chrome", err);
    }
  };

  const handleToggleRecording = async () => {
    setRecordingBusy(true);
    try {
      if (isRecording) {
        const output = await StopRecording();
        setTestOutput(output);
      } else {
        await StartRecording();
      }
      setIsRecording(!isRecording);
    } catch (err) {
      reportError(`Could not ${isRecording ? "stop" : "start"} recording`, err);
    } finally {
      setRecordingBusy(false);
    }
  };

  const handleInstallCA = async () => {
    try {
      await InstallCA();
      setCAInstalled(true);
    } catch (err) {
      reportError("Could not trust the Orbita certificate", err);
    }
  };

  useEffect(() => {
    const onError = (event: Event) => setError((event as CustomEvent<string>).detail);
    const onRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      reportError("Orbita could not complete that action", event.reason);
    };
    window.addEventListener("orbita-error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    loadEnvs();
    return () => {
      window.removeEventListener("orbita-error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-card/60 px-5 shadow-sm">
        <div className="flex items-center gap-2 pr-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Orbit aria-hidden="true" className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Orbita</span>
        </div>
        <EnvSelector
          activeEnv={activeEnvName}
          environments={envs}
          onEnvChange={handleEnvChange}
        />
        <div
          aria-live="polite"
          className="flex flex-1 items-center gap-2 text-xs text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${proxyAddr ? "bg-green-500" : "bg-muted-foreground"}`}
          />
          <span className="font-mono">{proxyAddr || "Proxy offline"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={recordingBusy}
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={handleToggleRecording}
          >
            {isRecording ? (
              <Square aria-hidden="true" className="w-3 h-3" />
            ) : (
              <Circle aria-hidden="true" className="w-3 h-3" />
            )}
            {isRecording ? "Stop" : "Record"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleInstallCA}>
            <ShieldCheck aria-hidden="true" className="w-3 h-3" />
            {caInstalled ? "CA Trusted" : "Trust CA"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenChrome}>
            <Globe aria-hidden="true" className="w-3 h-3" /> Open in Chrome
          </Button>
        </div>
      </header>
      {error && (
        <div role="alert" className="flex items-center gap-3 border-b border-destructive/30 bg-destructive/10 px-5 py-2 text-sm text-destructive">
          <span className="min-w-0 flex-1 break-words">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError("")}>Dismiss</Button>
        </div>
      )}
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
