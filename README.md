# pi-telegram 🤖📱

Real agentic conversations between Telegram and pi coding agent with full OMC orchestration.

Bridge Telegram directly to pi for authentic agent interactions with streaming responses, persistent sessions, and access to all OMC engine commands.

## Features

✅ **Real Agentic Conversations** - Full pi agent capabilities via Telegram  
✅ **Streaming Responses** - Updates appear in real-time as pi processes  
✅ **Persistent Sessions** - Per-user/thread conversation history  
✅ **OMC Full Access** - tap, tav, tvs, rawr, rawrs, swarm commands available  
✅ **Thread/Topic Support** - Works with Telegram topics and threads  
✅ **Rate Limiting** - Built-in security and rate limiting  
✅ **Easy Deployment** - tmux-based management for 24/7 operation  

## Architecture

Based on **Claude Code Telegram Plugin** but adapted for **pi SDK** instead of Claude Code SDK.

```
Telegram Message
    ↓
Pi Telegram Bot
    ↓
Pi SDK Integration
    ↓
Pi Agent + pi-agent-teams Extension
    ↓
OMC Engines (RALPH, AUTOPILOT, ULTRAWORK, SWARM)
    ↓
Streaming Response Back to Telegram
```

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/hscheema1979/pi-telegram.git
cd pi-telegram
```

### 2. Setup Configuration

```bash
# Copy example config
cp .env.telegram.example .env.telegram

# Edit with your values
nano .env.telegram
```

Edit `.env.telegram`:
```bash
# Get token from @BotFather in Telegram
TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE
TELEGRAM_BOT_USERNAME=your_bot_name

# Pi will use ANTHROPIC_API_KEY from environment
# Make sure it's set: export ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Install Dependencies

```bash
npm install
npm run build
```

### 4. Start with tmux

```bash
# Start bot in tmux session
./scripts/start.sh

# View logs
tmux attach -t pi-telegram

# Stop bot
./scripts/stop.sh

# Check status
./scripts/status.sh
```

Or run directly:

```bash
npm start
```

## Configuration

### Required Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `TELEGRAM_BOT_USERNAME` - Bot's username (without @)
- `ANTHROPIC_API_KEY` - Your Anthropic API key (for pi agent)

### Optional Environment Variables

- `PI_WORKING_DIRECTORY` - Working directory for pi agent (default: `./`)
- `LOG_LEVEL` - Logging level: debug, info, warn, error (default: `info`)
- `ENABLE_RATE_LIMIT` - Enable rate limiting (default: `true`)
- `RATE_LIMIT_PER_MINUTE` - Rate limit threshold (default: `30`)
- `MAX_CONVERSATION_HISTORY` - Messages to keep per session (default: `50`)
- `NODE_ENV` - Environment: development or production (default: `development`)

## Usage

### Commands

```
/help                  - Show help message
/status                - Check bot and session status
/clear                 - Clear conversation history
/about                 - About this bot
```

### OMC Commands

All OMC commands from pi-agent-teams are available:

```
/tap "Add OAuth2"      - AUTOPILOT autonomous execution
/tav "Optimize DB"     - RALPH verification loops
/tvs "Refactor code"   - RALPH + SWARM (verified teams)
/rawr "Build feature"  - Triple engine power (r@lph + @utopilot + ultrawork)
/rawrs "Big project"   - ULTIMATE power (all 4 engines)
/swarm "Scale task"    - Multi-team coordination
```

### Just Chat

Or just send any message and pi will respond with full agent capabilities!

```
"How can I refactor my authentication module?"
"Add error handling to this function"
"What's wrong with my database query?"
```

## Architecture Details

### Bot Core (`src/bot/core.ts`)

- Handles Telegram message polling
- Registers command handlers
- Bridges messages to pi SDK
- Manages streaming responses

### Pi Integration (`src/pi/integration.ts`)

- Creates and manages pi SDK sessions
- Sends prompts to pi agent
- Handles agent responses
- Maintains per-user session state

### Session Manager (`src/session/manager.ts`)

- Tracks conversation history per user/thread
- Implements trimming for memory efficiency
- Supports persistent storage (SQLite ready)

### Streaming Handler (`src/bot/streaming.ts`)

- Real-time message updates to Telegram
- Chunks large responses (Telegram 4096 char limit)
- Updates message as pi processes

## Deployment

### Local (Development)

```bash
npm run dev
```

### Production (tmux)

```bash
# Start in background
./scripts/start.sh

# Keeps running even if terminal closes
# Access with: tmux attach -t pi-telegram
```

### Using PM2

```bash
npm install -g pm2
pm2 start "npm start" --name "pi-telegram"
pm2 save
pm2 startup
```

## Monitoring

### View Logs

```bash
# tmux session
tmux attach -t pi-telegram

# Or with npm run in foreground
npm start
```

### Check Health

Send `/status` to the bot in Telegram to see:
- Active sessions count
- Pi integration status
- Bot connectivity

## Security Notes

⚠️ **Important:**

1. **Telegram Bot Token** - Keep in `.env.telegram`, never commit to git
2. **API Key** - Set `ANTHROPIC_API_KEY` environment variable, never hardcode
3. **User Isolation** - Each user/thread gets separate pi session
4. **Rate Limiting** - Enabled by default to prevent abuse
5. **Approved Directory** - Pi agent restricted to configured working directory

### Securing Your Bot

```bash
# Restrict .env.telegram permissions
chmod 600 .env.telegram

# Never commit secrets
echo ".env.telegram" >> .gitignore

# Use environment variables for secrets
export ANTHROPIC_API_KEY=sk-ant-...
export TELEGRAM_BOT_TOKEN=123456:ABC...
```

## Integration with pi-agent-teams

This bot has full access to the **pi-agent-teams extension** which provides:

- 🐯 **RAWR** (Triple Engine) - RALPH + AUTOPILOT + ULTRAWORK
- 🐯🐝 **RAWRS** (Ultimate Power) - All 4 OMC engines
- 🔄 **RALPH** - Verification loops
- 🤖 **AUTOPILOT** - Autonomous planning
- ⚡ **ULTRAWORK** - 10+ parallel operations
- 🐝 **SWARM** - Multi-team coordination

All commands are available through the `/tap`, `/tav`, `/rawr`, `/rawrs` shortcuts or full names.

## Troubleshooting

### Bot Not Responding

1. Check token is correct:
   ```bash
   curl -s -X POST https://api.telegram.org/botYOUR_TOKEN/getMe
   ```

2. Check pi is working:
   ```bash
   pi
   /help
   ```

3. Check ANTHROPIC_API_KEY is set:
   ```bash
   echo $ANTHROPIC_API_KEY
   ```

### Messages Not Streaming

- Verify `ENABLE_STREAMING=true` in config
- Check bot has message_thread_id permissions
- Check Telegram rate limits

### Session Persistence Issues

- Verify write permissions to working directory
- Check database file isn't locked
- Clear `./.db` files and restart

## Performance

### Typical Response Times

- Simple question: 5-15 seconds
- Code analysis: 15-30 seconds
- OMC commands: 30-60 seconds
- Complex tasks (RAWRS): 60+ seconds

### Optimization Tips

- Use specific OMC commands (`/tap`, `/rawr`) for tasks
- Keep messages focused and concise
- Use `/clear` to reset session if memory grows
- Monitor session count with `/status`

## Development

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Dev Mode (watch)

```bash
npm run dev
```

## Project Structure

```
pi-telegram/
├── src/
│   ├── bot/
│   │   ├── core.ts          # Main bot implementation
│   │   └── streaming.ts     # Streaming response handler
│   ├── pi/
│   │   └── integration.ts   # Pi SDK integration
│   ├── session/
│   │   └── manager.ts       # Session/history management
│   ├── config/
│   │   └── settings.ts      # Configuration loader
│   ├── utils/
│   │   └── logger.ts        # Logging utilities
│   └── main.ts              # Entry point
├── scripts/
│   ├── start.sh             # Start with tmux
│   ├── stop.sh              # Stop bot
│   └── status.sh            # Check status
├── .env.telegram.example    # Config template
├── package.json
├── tsconfig.json
└── README.md
```

## Next Steps

- [ ] Add database persistence for sessions (SQLite)
- [ ] Add user authorization levels
- [ ] Add inline query buttons for common commands
- [ ] Add conversation export to file
- [ ] Add webhook mode for scalability
- [ ] Add metrics/monitoring dashboard
- [ ] Add multi-language support
- [ ] Add custom pi prompt templates

## License

MIT

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

- 🐛 Issues: GitHub Issues
- 💬 Questions: Discord
- 📖 Documentation: This README

## References

- [Pi Documentation](https://pi.dev)
- [Pi SDK](https://www.npmjs.com/package/@mariozechner/pi-coding-agent)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Claude Code Telegram](https://github.com/RichardAtCT/claude-code-telegram)

---

**Status**: Beta  
**Version**: 0.1.0  
**Last Updated**: February 25, 2026
