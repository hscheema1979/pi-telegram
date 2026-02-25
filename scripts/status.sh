#!/bin/bash

# Check pi-telegram bot status

SESSION_NAME="pi-telegram"

echo "📊 Checking pi-telegram status..."
echo ""

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "🟢 Bot is RUNNING (Session: $SESSION_NAME)"
  echo ""
  echo "Session info:"
  tmux list-sessions -F "#{session_name}: #{session_windows} windows, #{session_attached} attached"
  echo ""
  echo "Recent logs (last 20 lines):"
  echo "---"
  tmux capture-pane -t "$SESSION_NAME" -p -S -20
  echo "---"
else
  echo "🔴 Bot is NOT running"
  echo ""
  echo "To start: ./scripts/start.sh"
fi

echo ""
