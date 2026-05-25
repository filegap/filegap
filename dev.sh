#!/usr/bin/env bash
set -euo pipefail

# Root-level development helpers for filegap.
# Keep commands as thin wrappers around the repository's existing npm/cargo scripts.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<EOF
Usage: ./dev.sh <command> [args]

Shortcuts:
  server                 Start the web dev server
  app                    Start the Tauri desktop app

Setup:
  deps                   Install web and desktop npm dependencies
  web:deps               Install web npm dependencies
  desktop:deps           Install desktop npm dependencies

Web:
  web:dev                Start the web dev server
  web:build              Build the web app
  web:test               Run web tests
  web:preview            Preview the web production build

Desktop:
  desktop:dev            Start the Tauri desktop app
  desktop:ui             Start only the desktop Vite UI server
  desktop:build          Build the desktop UI
  desktop:test           Run desktop tests
  desktop:preview        Preview the desktop UI production build
  desktop:tauri:build    Build the Tauri desktop app

CLI / Rust:
  cli:help               Show the filegap CLI help
  cli:run [args]         Run the filegap CLI with args
  rust:build             Build the Rust workspace
  rust:test              Run Rust workspace tests

Validation:
  build                  Run Rust, web, and desktop builds
  test                   Run Rust, web, and desktop tests

Examples:
  ./dev.sh server
  ./dev.sh app
  ./dev.sh cli:run info --help
  ./dev.sh test
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing dependency: $1" >&2
    exit 1
  }
}

run_npm() {
  local app_dir="$1"
  shift
  require_cmd npm
  (cd "$ROOT_DIR/$app_dir" && npm "$@")
}

run_cargo() {
  require_cmd cargo
  (cd "$ROOT_DIR" && cargo "$@")
}

main() {
  case "${1:-}" in
    server|web:dev)
      run_npm apps/web run dev
      ;;
    app|desktop:dev)
      run_npm apps/desktop run tauri:dev
      ;;
    deps)
      run_npm apps/web ci
      run_npm apps/desktop ci
      ;;
    web:deps)
      run_npm apps/web ci
      ;;
    desktop:deps)
      run_npm apps/desktop ci
      ;;
    web:build)
      run_npm apps/web run build
      ;;
    web:test)
      run_npm apps/web run test
      ;;
    web:preview)
      run_npm apps/web run preview
      ;;
    desktop:ui)
      run_npm apps/desktop run dev
      ;;
    desktop:build)
      run_npm apps/desktop run build
      ;;
    desktop:test)
      run_npm apps/desktop run test
      ;;
    desktop:preview)
      run_npm apps/desktop run preview
      ;;
    desktop:tauri:build)
      run_npm apps/desktop run tauri:build
      ;;
    cli:help)
      run_cargo run -p filegap-cli --bin filegap -- --help
      ;;
    cli:run)
      shift
      run_cargo run -p filegap-cli --bin filegap -- "$@"
      ;;
    rust:build)
      run_cargo build
      ;;
    rust:test)
      run_cargo test
      ;;
    build)
      run_cargo build
      run_npm apps/web run build
      run_npm apps/desktop run build
      ;;
    test)
      run_cargo test
      run_npm apps/web run test
      run_npm apps/desktop run test
      ;;
    -h|--help|"")
      usage
      ;;
    *)
      echo "Unknown command: ${1}" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
