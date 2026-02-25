#!/bin/bash

# Start pi-telegram bot in tmux session

set -e

SESSION_NAME="pi-telegram"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting pi-telegram bot..."
echo "Project directory: $PROJECT_DIR"
echo "Session name: $SESSION_NAME"
echo ""

# Check if session already exists
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "⚠️  Session '$SESSION_NAME' already exists!"
  echo ""
  echo "To attach: tmux attach -t $SESSION_NAME"
  echo "To kill and restart: tmux kill-session -t $SESSION_NAME && ./scripts/start.sh"
  exit 1
fi

# Check configuration
if [ ! -f "$PROJECT_DIR/.env.telegram" ]; then
  echo "❌ .env.telegram not found!"
  echo ""
  echo "Setup configuration:"
  echo "  cp .env.telegram.example .env.telegram"
  echo "  nano .env.telegram"
  echo ""
  exit 1
fi

# Source environment
set -a
source "$PROJECT_DIR/.env.telegram"
set +a

# Verify required variables
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "❌ TELEGRAM_BOT_TOKEN not set in .env.telegram"
  exit 1
fi

if [ -z "$TELEGRAM_BOT_USERNAME" ]; then
  echo "❌ TELEGRAM_BOT_USERNAME not set in .env.telegram"
  exit 1
fi

# Create tmux session
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR"

# Send startup command
tmux send-keys -t "$SESSION_NAME" "npm start" Enter

# Wait for startup
sleep 2

# Show session
echo ""
echo "✅ Bot started in tmux session '$SESSION_NAME'"
echo ""
echo "Commands:"
echo "  tmux attach -t $SESSION_NAME          # View bot output"
echo "  tmux send-keys -t $SESSION_NAME C-c   # Stop bot"
echo "  tmux kill-session -t $SESSION_NAME    # Kill session"
echo "  ./scripts/status.sh                   # Check status"
echo "  ./scripts/stop.sh                     # Stop gracefully"
echo ""
echo "📱 Find your bot: @$TELEGRAM_BOT_USERNAME"
echo "💬 Send /help for commands"
echo ""
