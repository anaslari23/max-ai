#!/usr/bin/env bash
set -euo pipefail

# MAX AI runner: installs frontend deps if needed and launches backend + frontend
# Usage: ./run.sh

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Ensure Node and Python are available
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is not installed. Please install Node (e.g., via nvm) and retry." >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ python3 is not installed. Please install Python 3 and retry." >&2
  exit 1
fi

# Install frontend deps if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

# Launch both servers via launcher
echo "🚀 Launching MAX (backend + frontend)..."
python3 launch_max_ai.py
