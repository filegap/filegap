# DESK-04 — `open_file` / `show_in_folder` launch unvalidated paths via system shell

- **Severity:** Medium
- **Category:** Tauri IPC — Unsafe Shell Launch
- **Location:** `apps/desktop/src-tauri/src/commands.rs:927-962`

## Description
Both `open_file` and `show_in_folder` receive a caller-supplied `path: String`, check only that it exists (`target.exists()`), then pass it to `Command::new("open")` / `Command::new("cmd")` / `Command::new("xdg-open")`. On Windows the invocation is `cmd /C start "" <path>`; `start` treats the first non-empty argument specially, so a crafted path (`.exe`, `.bat`, `.lnk`) can launch an executable. The pattern of feeding unvalidated caller input to `open`/`xdg-open` (which accept URLs and app names, not just file paths) is a latent risk on all platforms.

## Impact
A compromised webview passing a path to a `.bat`/`.lnk` (Windows) gets it executed by `cmd /C start`. On macOS/Linux the immediate risk is lower but the surface is unnecessary.

## Evidence
```rust
// commands.rs:944
Command::new("cmd")
    .arg("/C").arg("start").arg("")
    .arg(path)   // caller-controlled
    .status()
```

## Remediation
Restrict the path to files the app itself wrote (tracked in Rust-side `lastOutputPath` state), assert it lives in the user's output directory, and restrict the extension to `.pdf`/`.zip`. On Windows prefer `ShellExecute` (via the `windows` crate) over `cmd /C start`. Consider using `tauri-plugin-opener`'s scoped `open_path` instead of a bespoke command.
