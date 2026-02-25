/**
 * Type declarations for node-telegram-bot-api
 * This library doesn't have official types, so we declare them here
 */

declare module "node-telegram-bot-api" {
  export interface Message {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      first_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    message_thread_id?: number;
  }

  export interface Chat {
    id: number;
    type: string;
  }

  export interface User {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  }

  export default class TelegramBot {
    constructor(token: string, options?: any);
    startPolling(): Promise<void>;
    stopPolling(): Promise<void>;
    on(event: string, handler: (msg: any) => any): void;
    onText(regexp: RegExp, handler: (msg: Message, match: RegExpExecArray | null) => any): void;
    sendMessage(chatId: number, text: string, options?: any): Promise<Message>;
    editMessageText(text: string, options?: any): Promise<any>;
    sendChatAction(chatId: number, action: string, options?: any): Promise<void>;
    getMe(): Promise<any>;
  }
}
