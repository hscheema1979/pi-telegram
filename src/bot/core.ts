/**
 * Pi Telegram Bot Core
 * 
 * Main bot implementation that handles Telegram messages
 * and bridges them to pi agent for real agentic conversations
 */

import TelegramBot from "node-telegram-bot-api";
import type { Message as TelegramMessage } from "node-telegram-bot-api";
import { Config } from "../config/settings.js";
import { logger } from "../utils/logger.js";
import { PiIntegration } from "../pi/integration.js";
import { SessionManager } from "../session/manager.js";

const HELP_MESSAGE = `
🤖 *Pi Telegram Bot*

Real agentic conversations with pi coding agent and OMC orchestration!

*Commands:*
/help - Show this help message
/status - Check bot and session status
/clear - Clear conversation history
/about - About this bot

*How to use:*
Just send any message or task and I'll invoke pi with full agent capabilities:

✅ /tap "Add OAuth2 authentication" - AUTOPILOT mode
✅ /tav "Optimize database" - RALPH verification loops  
✅ /rawr "Build feature" - Triple engine power
✅ /rawrs "Big project" - ALL 4 OMC engines

Or just chat naturally and I'll help with whatever you need!

*Powered by:*
🏖️ Pi coding agent
🐯 OMC Engines (RALPH, AUTOPILOT, ULTRAWORK, SWARM)
📱 Telegram Bot API
`;

export class PiTelegramBot {
  private telegramBot: TelegramBot;
  private config: Config;
  private piIntegration: PiIntegration;
  private sessionManager: SessionManager;
  private isRunning = false;

  constructor(config: Config) {
    this.config = config;
    this.telegramBot = new TelegramBot(config.telegramBotToken, {
      polling: true,
      baseUrl: config.apiDebug ? undefined : undefined,
    });
    this.piIntegration = new PiIntegration(config);
    this.sessionManager = new SessionManager(config);
  }

  /**
   * Initialize bot and register handlers
   */
  async initialize(): Promise<void> {
    try {
      logger.info("🤖 Initializing Pi Telegram Bot...");

      // Initialize pi integration
      await this.piIntegration.initialize();

      // Initialize session manager
      await this.sessionManager.initialize();

      // Register error handlers
      this.telegramBot.on("error", (error: any) => {
        logger.error("Telegram bot error:", error);
      });

      this.telegramBot.on("polling_error", (error: any) => {
        logger.error("Polling error:", error);
      });

      // Register command handlers
      this.registerCommandHandlers();

      // Register message handler
      this.registerMessageHandler();

      logger.info("✅ Bot initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize bot:", error);
      throw error;
    }
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    try {
      this.isRunning = true;
      logger.info("🚀 Bot started, waiting for messages...");

      // Keep the bot running
      await new Promise(() => {
        // Never resolves, keeps process alive
      });
    } catch (error) {
      logger.error("Bot error:", error);
      throw error;
    }
  }

  /**
   * Shutdown the bot gracefully
   */
  async shutdown(): Promise<void> {
    try {
      logger.info("🛑 Shutting down bot...");

      this.isRunning = false;

      // Stop polling
      await this.telegramBot.stopPolling();

      // Close all pi sessions
      this.piIntegration.closeAllSessions();

      // Close session manager
      await this.sessionManager.shutdown();

      logger.info("✅ Bot shutdown complete");
    } catch (error) {
      logger.error("Error during shutdown:", error);
    }
  }

  /**
   * Register command handlers
   */
  private registerCommandHandlers(): void {
    // /help command
    this.telegramBot.onText(/\/help/, async (msg: TelegramMessage) => {
      const chatId = msg.chat.id;
      try {
        await this.telegramBot.sendMessage(chatId, HELP_MESSAGE, {
          parse_mode: "Markdown",
          message_thread_id: msg.message_thread_id,
        });
      } catch (error) {
        logger.error("Failed to send help message:", error);
      }
    });

    // /start command
    this.telegramBot.onText(/\/start/, async (msg: TelegramMessage) => {
      const chatId = msg.chat.id;
      try {
        await this.telegramBot.sendMessage(
          chatId,
          "👋 Welcome to Pi Telegram Bot!\n\nSend /help to see what I can do.",
          { message_thread_id: msg.message_thread_id }
        );
      } catch (error) {
        logger.error("Failed to send start message:", error);
      }
    });

    // /status command
    this.telegramBot.onText(/\/status/, async (msg: TelegramMessage) => {
      const chatId = msg.chat.id;
      try {
        const sessionCount = this.piIntegration.getSessionCount();
        const status = `
📊 *Bot Status*

🟢 Active Sessions: ${sessionCount}
🔌 Pi Integration: Ready
📱 Telegram: Connected

Ready to handle requests!
`;
        await this.telegramBot.sendMessage(chatId, status, {
          parse_mode: "Markdown",
          message_thread_id: msg.message_thread_id,
        });
      } catch (error) {
        logger.error("Failed to send status:", error);
      }
    });

    // /clear command
    this.telegramBot.onText(/\/clear/, async (msg: TelegramMessage) => {
      const chatId = msg.chat.id;
      try {
        const threadId = msg.message_thread_id;
        await this.sessionManager.clearHistory(chatId, threadId);

        await this.telegramBot.sendMessage(
          chatId,
          "✅ Conversation history cleared",
          { message_thread_id: threadId }
        );
      } catch (error) {
        logger.error("Failed to clear history:", error);
      }
    });

    // /about command
    this.telegramBot.onText(/\/about/, async (msg: TelegramMessage) => {
      const chatId = msg.chat.id;
      try {
        const about = `
🤖 *Pi Telegram Bot*

Bridge real agentic conversations between Telegram and pi coding agent.

*Features:*
✅ Full pi agent capabilities
✅ OMC orchestration (RALPH, AUTOPILOT, ULTRAWORK, SWARM)
✅ Persistent conversations
✅ Thread/topic support
✅ Rate limiting & security

*Based on:*
• Claude Code Telegram Plugin architecture
• Pi coding agent SDK
• OMC core orchestration engines

*Version:* 0.1.0
*Status:* Beta

Learn more: https://github.com/hscheema1979/pi-telegram
`;
        await this.telegramBot.sendMessage(chatId, about, {
          parse_mode: "Markdown",
          message_thread_id: msg.message_thread_id,
        });
      } catch (error) {
        logger.error("Failed to send about message:", error);
      }
    });
  }

  /**
   * Register message handler for all other messages
   */
  private registerMessageHandler(): void {
    this.telegramBot.on("message", async (msg: TelegramMessage) => {
      // Skip if no text (photo, file, etc)
      if (!msg.text || msg.text.startsWith("/")) {
        return;
      }

      const chatId = msg.chat.id;
      const userId = msg.from?.id || 0;
      const threadId = msg.message_thread_id;
      const messageText = msg.text;

      try {
        logger.info("📨 Message received", {
          chatId,
          userId,
          threadId,
          messageLength: messageText.length,
        });

        // Send "typing" indicator
        await this.telegramBot.sendChatAction(chatId, "typing", {
          message_thread_id: threadId,
        });

        // Get or create pi session for this user/thread
        const piSession = await this.piIntegration.getOrCreateSession(
          userId,
          threadId
        );

        // Send message to pi and get response
        const response = await this.piIntegration.sendPrompt(
          piSession.sessionId,
          messageText
        );

        // Store in conversation history
        await this.sessionManager.addMessage(chatId, threadId, "user", messageText);
        await this.sessionManager.addMessage(chatId, threadId, "assistant", response.content);

        // Split response if too long for Telegram (max 4096 chars per message)
        const maxLength = 4096;
        if (response.content.length > maxLength) {
          const parts = response.content.match(new RegExp(`.{1,${maxLength}}`, "g")) || [];
          for (const part of parts) {
            await this.telegramBot.sendMessage(chatId, part, {
              parse_mode: "Markdown",
              message_thread_id: threadId,
            });
          }
        } else {
          await this.telegramBot.sendMessage(chatId, response.content, {
            parse_mode: "Markdown",
            message_thread_id: threadId,
          });
        }

        logger.info("✅ Response sent", { chatId, responseLength: response.content.length });
      } catch (error) {
        logger.error("Error processing message:", error);

        try {
          const errorMsg = `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
          await this.telegramBot.sendMessage(chatId, errorMsg, {
            message_thread_id: threadId,
          });
        } catch (sendError) {
          logger.error("Failed to send error message:", sendError);
        }
      }
    });
  }
}
