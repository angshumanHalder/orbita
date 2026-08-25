package profiles

import (
	"os"
	"path/filepath"
	"testing"
)

func TestProfilePersistenceAndEnvParsing(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "profiles.json")
	store, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	store.Environments = []Environment{{Name: "local", Headers: map[string]string{"X-Test": "yes"}}}
	store.Active = "local"
	if err := store.Save(); err != nil {
		t.Fatal(err)
	}
	loaded, err := Load(path)
	if err != nil || loaded.ActiveEnv() == nil || loaded.ActiveEnv().Headers["X-Test"] != "yes" {
		t.Fatalf("profile round trip failed: %#v, %v", loaded, err)
	}

	envPath := filepath.Join(dir, "env.json")
	if err := os.WriteFile(envPath, []byte(`{"shared":{},"environments":{"dev":{"urls":{"api":"https://dev.example.com"}}}}`), 0600); err != nil {
		t.Fatal(err)
	}
	cfg, err := ParseEnvConfig(envPath)
	if err != nil || cfg.Environments["dev"].URLs["api"] != "https://dev.example.com" {
		t.Fatalf("environment parsing failed: %#v, %v", cfg, err)
	}
}
