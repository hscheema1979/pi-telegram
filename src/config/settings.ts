/**
 * Configuration management for pi-telegram
 */

import { logger } from "../utils/logger.js";

export interface Config {
  // Telegram
  telegramBotToken: string;
  botUsername: string;

  // Pi Agent
  piWorkingDirectory: string;

  // Database
  databaseUrl: string;

  // API
  apiDebug: boolean;
  apiPort: number;

  // Security
  allowedUsers?: number[];
  enableRateLimit: boolean;
  rateLimitPerMinute: number;

  // Features
  enableSessionPersistence: boolean;
  enableConversationHistory: boolean;
  maxConversationHistory: number;

  // Development
  isDevelopment: boolean;
  logLevel: string;
}

export function loadConfig(): Config {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramBotToken) {
    throw new Error("❌ TELEGRAM_BOT_TOKEN not set in environment");
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    throw new Error("❌ TELEGRAM_BOT_USERNAME not set in environment");
  }

  const piWorkingDirectory = process.env.PI_WORKING_DIRECTORY || process.cwd();

  const config: Config = {
    telegramBotToken,
    botUsername,
    piWorkingDirectory,
    databaseUrl: process.env.DATABASE_URL || "sqlite:///pi-telegram.db",
    apiDebug: process.env.API_DEBUG === "true",
    apiPort: parseInt(process.env.API_PORT || "8080"),
    allowedUsers: process.env.ALLOWED_USERS
      ? process.env.ALLOWED_USERS.split(",").map(Number)
      : undefined,
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== "false",
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || "30"),
    enableSessionPersistence: process.env.ENABLE_SESSION_PERSISTENCE !== "false",
    enableConversationHistory: process.env.ENABLE_CONVERSATION_HISTORY !== "false",
    maxConversationHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY || "50"),
    isDevelopment: process.env.NODE_ENV !== "production",
    logLevel: process.env.LOG_LEVEL || "info",
  };

  logger.info("Configuration loaded", {
    environment: config.isDevelopment ? "development" : "production",
    bot: config.botUsername,
    workingDirectory: config.piWorkingDirectory,
  });

  return config;
}
