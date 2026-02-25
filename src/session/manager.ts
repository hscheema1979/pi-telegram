/**
 * Session Manager
 * 
 * Manages conversation history and session state for each user/thread
 */

import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger.js";
import { Config } from "../config/settings.js";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  chatId: number;
  threadId?: number;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory session manager with optional persistence
 * For now, we'll use in-memory storage; can be extended to SQLite
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Initialize session manager
   */
  async initialize(): Promise<void> {
    logger.info("Initializing session manager");
    // TODO: Load sessions from database if persistence is enabled
  }

  /**
   * Shutdown session manager
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down session manager", { sessionCount: this.sessions.size });
    // TODO: Save sessions to database if persistence is enabled
  }

  /**
   * Get session key
   */
  private getSessionKey(chatId: number, threadId?: number): string {
    return threadId ? `${chatId}-${threadId}` : `${chatId}`;
  }

  /**
   * Get or create session
   */
  private getOrCreateSession(chatId: number, threadId?: number): Session {
    const key = this.getSessionKey(chatId, threadId);

    if (this.sessions.has(key)) {
      return this.sessions.get(key)!;
    }

    const session: Session = {
      id: uuidv4(),
      chatId,
      threadId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(key, session);
    logger.info("Session created", { sessionKey: key, sessionId: session.id });

    return session;
  }

  /**
   * Add message to conversation history
   */
  async addMessage(
    chatId: number,
    threadId: number | undefined,
    role: "user" | "assistant",
    content: string
  ): Promise<void> {
    const session = this.getOrCreateSession(chatId, threadId);

    const message: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
    };

    session.messages.push(message);
    session.updatedAt = new Date();

    // Trim old messages if exceeding max history
    if (session.messages.length > this.config.maxConversationHistory) {
      const toRemove = session.messages.length - this.config.maxConversationHistory;
      session.messages.splice(0, toRemove);
      logger.info("Old messages trimmed", { sessionKey: this.getSessionKey(chatId, threadId), removed: toRemove });
    }

    logger.debug("Message added", {
      sessionKey: this.getSessionKey(chatId, threadId),
      role,
      length: content.length,
    });
  }

  /**
   * Get conversation history
   */
  getHistory(chatId: number, threadId?: number): Message[] {
    const key = this.getSessionKey(chatId, threadId);
    return this.sessions.get(key)?.messages || [];
  }

  /**
   * Get full session
   */
  getSession(chatId: number, threadId?: number): Session | undefined {
    const key = this.getSessionKey(chatId, threadId);
    return this.sessions.get(key);
  }

  /**
   * Clear conversation history
   */
  async clearHistory(chatId: number, threadId?: number): Promise<void> {
    const key = this.getSessionKey(chatId, threadId);
    this.sessions.delete(key);
    logger.info("History cleared", { sessionKey: key });
  }

  /**
   * Clear all sessions
   */
  async clearAll(): Promise<void> {
    const count = this.sessions.size;
    this.sessions.clear();
    logger.info("All sessions cleared", { count });
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}
