/**
 * Telegram Bot
 * 
 * Routes messages to/from tmux+pi sessions
 */

import TelegramBot from "node-telegram-bot-api";
import type { Message as TelegramMessage } from "node-telegram-bot-api";
import { TmuxManager } from "./tmux-manager.js";
import { logger } from "./logger.js";

const HELP_MESSAGE = `
🤖 *Pi Telegram Bot*

Each thread gets its own persistent pi session!

*How to use:*
Just send any message and it goes to your pi session:
- \`tap "Add feature"\`
- \`rawr "Complex task"\`
- \`/help\` in pi
- Normal pi commands work too!

*Commands:*
/help - This message
/status - Check your session
/clear - Clear session history

*What happens:*
1. Message sent to Telegram
2. Creates/uses your thread's pi session (in tmux)
3. Pi executes it
4. Response comes back to Telegram

Your pi session stays alive between messages! 🚀
`;

export class Bot {
  private telegramBot: TelegramBot;
  private tmux: TmuxManager;
  private activeRequests: Set<string> = new Set();

  constructor(token: string) {
    this.telegramBot = new TelegramBot(token, { polling: true });
    this.tmux = new TmuxManager();
    this.setupHandlers();
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    logger.info("Bot started, listening for messages...");
  }

  /**
   * Shutdown gracefully
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down bot...");
    await this.telegramBot.stopPolling();
    this.tmux.cleanupAll();
    logger.info("Bot shutdown complete");
  }

  /**
   * Setup message handlers
   */
  private setupHandlers(): void {
    // Help command
    this.telegramBot.onText(/\/help/, (msg) => {
      this.sendMessage(msg.chat.id, HELP_MESSAGE, msg.message_thread_id);
    });

    // Status command
    this.telegramBot.onText(/\/status/, (msg) => {
      const sessionName = this.tmux.getSessionName(
        msg.chat.id,
        msg.message_thread_id
      );
      const exists = this.tmux.sessionExists(sessionName);

      const status = exists
        ? `✅ *Session Active*\n\nYour pi session is running and ready!`
        : `❌ *No Active Session*\n\nSend a message to create your pi session!`;

      this.sendMessage(msg.chat.id, status, msg.message_thread_id);
    });

    // Clear command
    this.telegramBot.onText(/\/clear/, (msg) => {
      const sessionName = this.tmux.getSessionName(
        msg.chat.id,
        msg.message_thread_id
      );
      this.tmux.killSession(sessionName);
      this.sendMessage(
        msg.chat.id,
        "✅ Session cleared. Send a message to create a new one!",
        msg.message_thread_id
      );
    });

    // Catch all other messages
    this.telegramBot.on("message", (msg) => {
      if (msg.text && !msg.text.startsWith("/")) {
        this.handleUserMessage(msg);
      }
    });

    // Error handlers
    this.telegramBot.on("error", (error) => {
      logger.error("Telegram bot error:", error);
    });

    this.telegramBot.on("polling_error", (error) => {
      logger.error("Polling error:", error);
    });
  }

  /**
   * Handle regular user messages
   */
  private async handleUserMessage(msg: TelegramMessage): Promise<void> {
    if (!msg.text || !msg.from) return;

    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const threadId = msg.message_thread_id;
    const text = msg.text;

    // Prevent simultaneous requests
    const requestKey = `${chatId}-${threadId}`;
    if (this.activeRequests.has(requestKey)) {
      this.sendMessage(
        chatId,
        "⏳ Already processing. Please wait...",
        threadId
      );
      return;
    }

    this.activeRequests.add(requestKey);

    try {
      logger.info("Message received", {
        chatId,
        userId,
        threadId,
        textLength: text.length,
      });

      // Show typing indicator
      await this.telegramBot.sendChatAction(chatId, "typing", {
        message_thread_id: threadId,
      });

      // Get or create session
      const sessionName = this.tmux.getSessionName(chatId, threadId);
      if (!this.tmux.sessionExists(sessionName)) {
        this.tmux.createSession(sessionName);
        // Wait for pi to fully start
        await this.tmux.waitForPrompt(sessionName, 5000);
      }

      // Send message to pi
      this.tmux.sendMessage(sessionName, text);

      // Wait for response
      await this.tmux.waitForPrompt(sessionName, 10000);

      // Read output
      const output = this.tmux.readOutput(sessionName, 100);

      // Send back to Telegram
      if (output) {
        this.sendMessage(chatId, output, threadId);
      } else {
        this.sendMessage(
          chatId,
          "⚠️ No output received from pi",
          threadId
        );
      }

      logger.info("Response sent", { chatId, outputLength: output.length });
    } catch (error) {
      logger.error("Error handling message:", error);
      this.sendMessage(
        chatId,
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        threadId
      );
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * Send message to Telegram
   */
  private async sendMessage(
    chatId: number,
    text: string,
    threadId?: number
  ): Promise<void> {
    try {
      // Split if too long
      const maxLength = 4096;
      if (text.length > maxLength) {
        const parts = text.match(new RegExp(`.{1,${maxLength}}`, "g")) || [];
        for (const part of parts) {
          await this.telegramBot.sendMessage(chatId, part, {
            message_thread_id: threadId,
            parse_mode: "Markdown",
          });
        }
      } else {
        await this.telegramBot.sendMessage(chatId, text, {
          message_thread_id: threadId,
          parse_mode: "Markdown",
        });
      }
    } catch (error) {
      logger.error("Failed to send message:", error);
    }
  }
}
