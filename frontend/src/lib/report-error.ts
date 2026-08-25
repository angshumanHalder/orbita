export function reportError(message: string, error?: unknown) {
  const detail = `${message}${error ? `: ${error instanceof Error ? error.message : String(error)}` : ""}`;
  console.error(detail, error);
  window.dispatchEvent(new CustomEvent("orbita-error", { detail }));
}
