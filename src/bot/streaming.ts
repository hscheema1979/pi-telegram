/**
 * Streaming Response Handler
 * 
 * Streams pi agent responses back to Telegram in real-time
 * Updates message as pi continues processing
 */

import TelegramBot from "node-telegram-bot-api";
import { logger } from "../utils/logger.js";

export interface StreamingOptions {
  chatId: number;
  messageThreadId?: number;
  updateInterval: number; // ms between updates
}

/**
 * Manages streaming responses to Telegram
 */
export class StreamingResponseHandler {
  private messageId?: number;
  private telegramBot: TelegramBot;
  private options: StreamingOptions;
  private buffer: string = "";
  private lastUpdate: Date = new Date();

  constructor(telegramBot: TelegramBot, options: StreamingOptions) {
    this.telegramBot = telegramBot;
    this.options = options;
  }

  /**
   * Start streaming response
   */
  async start(): Promise<void> {
    try {
      // Send initial "processing" message
      const msg = await this.telegramBot.sendMessage(
        this.options.chatId,
        "⏳ Processing your request...",
        { message_thread_id: this.options.messageThreadId }
      );
      this.messageId = msg.message_id;
      logger.info("Streaming started", { messageId: this.messageId });
    } catch (error) {
      logger.error("Failed to start streaming:", error);
      throw error;
    }
  }

  /**
   * Add chunk to streaming response
   */
  async addChunk(chunk: string): Promise<void> {
    this.buffer += chunk;

    // Update Telegram periodically (avoid rate limiting)
    const now = new Date();
    if (now.getTime() - this.lastUpdate.getTime() >= this.options.updateInterval) {
      await this.update();
    }
  }

  /**
   * Update the message with current buffer
   */
  private async update(): Promise<void> {
    if (!this.messageId || this.buffer.length === 0) {
      return;
    }

    try {
      // Limit to 4096 chars (Telegram max)
      const displayText = this.buffer.substring(0, 4096);
      const indicator = this.buffer.length > 4096 ? "\n\n⏳ *Continues...*" : "\n\n⏳ *Processing...*";

      await this.telegramBot.editMessageText(displayText + indicator, {
        chat_id: this.options.chatId,
        message_id: this.messageId,
        parse_mode: "Markdown",
      });

      this.lastUpdate = new Date();
    } catch (error) {
      // Silently fail on edit errors (e.g., message unchanged)
      if (!(error instanceof Error && error.message.includes("message is not modified"))) {
        logger.debug("Update skipped:", error);
      }
    }
  }

  /**
   * Finish streaming and finalize response
   */
  async finish(): Promise<void> {
    if (!this.messageId) {
      return;
    }

    try {
      // Final update with complete response
      const displayText = this.buffer.substring(0, 4096);
      
      await this.telegramBot.editMessageText(displayText, {
        chat_id: this.options.chatId,
        message_id: this.messageId,
        parse_mode: "Markdown",
      });

      logger.info("Streaming finished", {
        messageId: this.messageId,
        totalLength: this.buffer.length,
      });

      // If response was truncated, send continuation in next message
      if (this.buffer.length > 4096) {
        const remaining = this.buffer.substring(4096);
        const parts = remaining.match(/.{1,4096}/g) || [];
        for (const part of parts) {
          await this.telegramBot.sendMessage(this.options.chatId, part, {
            parse_mode: "Markdown",
            message_thread_id: this.options.messageThreadId,
          });
        }
      }
    } catch (error) {
      logger.error("Failed to finalize streaming:", error);
    }
  }

  /**
   * Get full buffer
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer = "";
    this.messageId = undefined;
  }
}
