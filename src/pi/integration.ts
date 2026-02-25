/**
 * Pi SDK Integration
 * 
 * Bridges Telegram bot to pi agent using pi's SDK for
 * real agentic conversations with OMC orchestration
 */

import {
  createAgentSession,
  AuthStorage,
  SessionManager as PiSessionManager,
  ModelRegistry,
} from "@mariozechner/pi-coding-agent";
import { logger } from "../utils/logger.js";
import { Config } from "../config/settings.js";

export interface PiSession {
  sessionId: string;
  session: any; // Pi session object
  workingDirectory: string;
}

export interface PiResponse {
  content: string;
  isStreaming: boolean;
  tools: Array<{
    name: string;
    status: "pending" | "completed" | "error";
  }>;
}

/**
 * Manages pi agent sessions for each Telegram user/conversation
 */
export class PiIntegration {
  private sessions: Map<string, PiSession> = new Map();
  private config: Config;
  private authStorage: AuthStorage;
  private modelRegistry: ModelRegistry;

  constructor(config: Config) {
    this.config = config;
    this.authStorage = new AuthStorage();
    this.modelRegistry = new ModelRegistry(this.authStorage);
  }

  /**
   * Initialize pi integration
   */
  async initialize(): Promise<void> {
    try {
      logger.info("🔌 Initializing pi integration...");

      // Pi will use existing authentication (ANTHROPIC_API_KEY or /login)
      // No additional setup needed here

      logger.info("✅ Pi integration ready");
    } catch (error) {
      logger.error("Failed to initialize pi integration:", error);
      throw error;
    }
  }

  /**
   * Get or create a pi session for a user
   */
  async getOrCreateSession(
    userId: number,
    threadId?: number
  ): Promise<PiSession> {
    const sessionKey = threadId ? `${userId}-${threadId}` : `${userId}`;

    // Return existing session
    if (this.sessions.has(sessionKey)) {
      return this.sessions.get(sessionKey)!;
    }

    try {
      logger.info("Creating new pi session", { userId, threadId, sessionKey });

      // Create new pi session
      const { session } = await createAgentSession({
        sessionManager: PiSessionManager.inMemory(),
        authStorage: this.authStorage,
        modelRegistry: this.modelRegistry,
      });

      const piSession: PiSession = {
        sessionId: sessionKey,
        session,
        workingDirectory: this.config.piWorkingDirectory,
      };

      this.sessions.set(sessionKey, piSession);
      logger.info("✅ Pi session created", { sessionKey });

      return piSession;
    } catch (error) {
      logger.error("Failed to create pi session:", error);
      throw error;
    }
  }

  /**
   * Send a prompt to pi and get a response
   * This maintains full agentic conversation with tool usage
   */
  async sendPrompt(
    sessionKey: string,
    prompt: string
  ): Promise<PiResponse> {
    const piSession = this.sessions.get(sessionKey);
    if (!piSession) {
      throw new Error(`Session not found: ${sessionKey}`);
    }

    try {
      logger.info("📨 Sending prompt to pi", {
        sessionKey,
        promptLength: prompt.length,
      });

      // Send prompt to pi using SDK
      // This will invoke the agent with all tools available (including pi-agent-teams OMC commands)
      const response = await piSession.session.prompt(prompt);

      const piResponse: PiResponse = {
        content: response.text || response.toString() || "",
        isStreaming: false,
        tools: [],
      };

      logger.info("✅ Pi response received", {
        sessionKey,
        responseLength: piResponse.content.length,
      });

      return piResponse;
    } catch (error) {
      logger.error("Failed to get pi response:", error);
      throw error;
    }
  }

  /**
   * Close a session
   */
  closeSession(sessionKey: string): void {
    this.sessions.delete(sessionKey);
    logger.info("Session closed", { sessionKey });
  }

  /**
   * Close all sessions
   */
  closeAllSessions(): void {
    logger.info("Closing all sessions", {
      count: this.sessions.size,
    });
    this.sessions.clear();
  }

  /**
   * Get session count (for monitoring)
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}
