#!/bin/bash

# Stop pi-telegram bot gracefully

SESSION_NAME="pi-telegram"

echo "🛑 Stopping pi-telegram bot..."
echo ""

if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "⚠️  Session '$SESSION_NAME' not running"
  exit 0
fi

# Send Ctrl-C to stop
tmux send-keys -t "$SESSION_NAME" C-c

# Wait for graceful shutdown
echo "Waiting for graceful shutdown (5 seconds)..."
sleep 5

# Kill session
tmux kill-session -t "$SESSION_NAME"

echo "✅ Bot stopped"
echo ""
