#!/usr/bin/env bash
# Keeps the API running — restarts on crash
set -e
cd "$(dirname "$0")"
while true; do
  echo "[$(date -u +%T)] starting api..."
  ./bin/api >> /tmp/sprout-api.log 2>&1 || true
  echo "[$(date -u +%T)] crashed, restarting in 3s..."
  sleep 3
done
