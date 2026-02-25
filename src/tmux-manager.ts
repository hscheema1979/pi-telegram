/**
 * Tmux Session Manager
 * 
 * Manages persistent pi instances in tmux for each Telegram thread
 */

import { execSync, spawn } from "child_process";
import { logger } from "./logger.js";

export class TmuxManager {
  private sessions: Set<string> = new Set();

  /**
   * Get session name for a chat/thread
   */
  getSessionName(chatId: number, threadId?: number): string {
    return threadId ? `pi-tg-${chatId}-${threadId}` : `pi-tg-${chatId}`;
  }

  /**
   * Check if session exists
   */
  sessionExists(sessionName: string): boolean {
    try {
      execSync(`tmux has-session -t ${sessionName}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create and start pi in tmux session
   */
  createSession(sessionName: string): void {
    if (this.sessionExists(sessionName)) {
      logger.debug("Session already exists", { sessionName });
      return;
    }

    try {
      logger.info("Creating tmux session for pi", { sessionName });

      // Create new session with pi running
      execSync(`tmux new-session -d -s ${sessionName} -c ~ 'pi'`);

      // Give pi time to start
      execSync("sleep 1");

      this.sessions.add(sessionName);
      logger.info("✅ Session created", { sessionName });
    } catch (error) {
      logger.error("Failed to create session:", error, { sessionName });
      throw error;
    }
  }

  /**
   * Send message to pi in session
   */
  sendMessage(sessionName: string, message: string): void {
    try {
      // Escape special characters for tmux
      const escaped = message.replace(/"/g, '\\"').replace(/\$/g, "\\$");

      // Send to tmux
      execSync(`tmux send-keys -t ${sessionName} "${escaped}" Enter`);

      logger.debug("Message sent", { sessionName, length: message.length });
    } catch (error) {
      logger.error("Failed to send message:", error, { sessionName });
      throw error;
    }
  }

  /**
   * Read output from pi session
   */
  readOutput(sessionName: string, lines: number = 50): string {
    try {
      // Get last N lines from pane
      const output = execSync(
        `tmux capture-pane -t ${sessionName} -p -S -${lines}`,
        { encoding: "utf-8" }
      );

      // Strip ANSI color codes
      const clean = output.replace(/\x1B\[[0-9;]*m/g, "").trim();

      return clean;
    } catch (error) {
      logger.error("Failed to read output:", error, { sessionName });
      return "";
    }
  }

  /**
   * Wait for pi prompt (indicates ready for next input)
   */
  async waitForPrompt(sessionName: string, timeout: number = 10000): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const output = this.readOutput(sessionName, 5);

      // Pi shows "> " prompt when ready
      if (output.includes(">")) {
        return;
      }

      // Wait 100ms and retry
      await new Promise((r) => setTimeout(r, 100));
    }

    logger.warn("Timeout waiting for prompt", { sessionName });
  }

  /**
   * Kill session
   */
  killSession(sessionName: string): void {
    try {
      execSync(`tmux kill-session -t ${sessionName}`, { stdio: "ignore" });
      this.sessions.delete(sessionName);
      logger.info("Session killed", { sessionName });
    } catch (error) {
      logger.debug("Error killing session (might not exist):", {
        sessionName,
      });
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions);
  }

  /**
   * Cleanup all sessions
   */
  cleanupAll(): void {
    for (const session of this.sessions) {
      this.killSession(session);
    }
    logger.info("All sessions cleaned up");
  }
}
