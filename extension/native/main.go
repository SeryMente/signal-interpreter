package main

import (
  "bufio"
  "encoding/binary"
  "encoding/json"
  "fmt"
  "io"
  "os"
  "os/exec"
  "path/filepath"
  "sync"
)

var outMu sync.Mutex

func writeNative(value any) error {
  payload, err := json.Marshal(value)
  if err != nil {
    return err
  }
  var header [4]byte
  binary.LittleEndian.PutUint32(header[:], uint32(len(payload)))
  outMu.Lock()
  defer outMu.Unlock()
  if _, err = os.Stdout.Write(header[:]); err != nil {
    return err
  }
  _, err = os.Stdout.Write(payload)
  return err
}

func readNative(r io.Reader) ([]byte, error) {
  var header [4]byte
  if _, err := io.ReadFull(r, header[:]); err != nil {
    return nil, err
  }
  size := binary.LittleEndian.Uint32(header[:])
  if size == 0 || size > 1024*1024 {
    return nil, fmt.Errorf("invalid native message size: %d", size)
  }
  payload := make([]byte, size)
  if _, err := io.ReadFull(r, payload); err != nil {
    return nil, err
  }
  return payload, nil
}

func main() {
  executable, err := os.Executable()
  if err != nil {
    return
  }

  script := filepath.Join(filepath.Dir(executable), "SignalInterpreter.CaptionHost.ps1")
  if _, err := os.Stat(script); err != nil {
    _ = writeNative(map[string]any{"type":"error", "error":"SignalInterpreter.CaptionHost.ps1 is missing"})
    return
  }

  if err := writeNative(map[string]any{
    "type": "ready",
    "schema": "signal-caption-native/v1",
  }); err != nil {
    return
  }

  for {
    payload, err := readNative(os.Stdin)
    if err != nil {
      return
    }

    var message map[string]any
    if json.Unmarshal(payload, &message) != nil {
      continue
    }

    action, _ := message["type"].(string)
    if action != "start" {
      if action == "stop" {
        return
      }
      continue
    }

    child := exec.Command(
      "powershell.exe",
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      script,
    )
    stdout, err := child.StdoutPipe()
    if err != nil {
      _ = writeNative(map[string]any{"type":"error", "error":err.Error()})
      return
    }
    child.Stderr = io.Discard

    if err := child.Start(); err != nil {
      _ = writeNative(map[string]any{"type":"error", "error":err.Error()})
      return
    }

    scanner := bufio.NewScanner(stdout)
    scanner.Buffer(make([]byte, 4096), 256*1024)

    _ = writeNative(map[string]any{
      "type":"started",
      "schema":"signal-caption-native/v1",
    })

    for scanner.Scan() {
      var value any
      if json.Unmarshal(scanner.Bytes(), &value) != nil {
        continue
      }
      if err := writeNative(value); err != nil {
        _ = child.Process.Kill()
        return
      }
    }

    _ = child.Process.Kill()
    return
  }
}
