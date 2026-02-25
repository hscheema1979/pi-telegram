#!/usr/bin/env node

/**
 * Pi Telegram Bot
 * 
 * Simple bridge: Telegram threads ↔ Persistent Pi sessions (tmux)
 * 
 * Architecture:
 * - One Telegram bot
 * - Each thread gets a tmux+pi session
 * - Messages flow: Telegram → tmux stdin → pi → tmux stdout → Telegram
 */

import dotenv from "dotenv";
import { Bot } from "./bot.js";
import { logger } from "./logger.js";

dotenv.config({ path: ".env.telegram" });

async function main() {
  try {
    logger.info("🤖 Pi Telegram Bot starting...");

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN not set in .env.telegram");
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      throw new Error("TELEGRAM_BOT_USERNAME not set in .env.telegram");
    }

    logger.info("✅ Configuration loaded", { botUsername });

    const bot = new Bot(token);
    await bot.start();

    logger.info("🚀 Bot is ready!");
    logger.info(`📱 Find bot at: @${botUsername}`);
    logger.info("💬 Send /help for commands");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down...");
      await bot.shutdown();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down...");
      await bot.shutdown();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
