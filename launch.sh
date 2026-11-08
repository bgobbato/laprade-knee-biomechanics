#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Choose a starting port (default 8088 to avoid 8080 conflicts)
PORT=${1:-8088}

# Automatic port detection: if PORT is in use, find the next available port
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    echo "⚠️  Port $PORT is already in use, trying next port..."
    PORT=$((PORT + 1))
done

echo "=========================================================================="
echo " 🦵 Knee Posterolateral Corner (PLC) & Popliteus Biomechanics Simulator"
echo " Based on the seminal works of Dr. Robert F. LaPrade & Dr. Jorge Chahla"
echo "=========================================================================="
echo " Serving local simulator at: http://localhost:$PORT"
echo " Press Ctrl+C to terminate."
echo "=========================================================================="

# Automatically open in the default browser on macOS
open "http://localhost:$PORT" 2>/dev/null || true

python3 -m http.server $PORT
