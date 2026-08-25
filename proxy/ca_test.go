package proxy

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCAKeyPermissions(t *testing.T) {
	dir := t.TempDir()
	certPath, keyPath := filepath.Join(dir, "ca.crt"), filepath.Join(dir, "ca.key")
	if _, err := LoadOrGenerate(certPath, keyPath); err != nil {
		t.Fatal(err)
	}
	assertMode0600(t, keyPath)
	if err := os.Chmod(keyPath, 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := LoadOrGenerate(certPath, keyPath); err != nil {
		t.Fatal(err)
	}
	assertMode0600(t, keyPath)
}

func assertMode0600(t *testing.T, path string) {
	t.Helper()
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0600 {
		t.Fatalf("key mode = %v; want 0600", info.Mode().Perm())
	}
}
