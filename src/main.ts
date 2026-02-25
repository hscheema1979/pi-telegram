#!/usr/bin/env node

/**
 * Pi Telegram Bot
 * 
 * Telegram bot integration for pi coding agent
 * Provides real agentic conversations with full OMC orchestration
 */

import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import { loadConfig } from "./config/settings.js";
import { PiTelegramBot } from "./bot/core.js";

// Load environment variables
dotenv.config({ path: ".env.telegram" });

async function main() {
  try {
    logger.info("🤖 Pi Telegram Bot starting...");

    // Load configuration
    const config = loadConfig();
    logger.info("✅ Configuration loaded", {
      bot_name: config.botUsername,
      api_debug: config.apiDebug,
    });

    // Create and start bot
    const bot = new PiTelegramBot(config);
    await bot.initialize();

    logger.info("🚀 Bot is ready!");
    logger.info("📱 Find bot at: @" + config.botUsername);
    logger.info("💬 Send /help to see commands");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutdown signal received");
      await bot.shutdown();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received");
      await bot.shutdown();
      process.exit(0);
    });

    // Start polling
    await bot.start();
  } catch (error) {
    logger.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
