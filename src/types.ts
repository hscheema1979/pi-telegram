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
    };
    date: number;
    text?: string;
    message_thread_id?: number;
  }

  export default class TelegramBot {
    constructor(token: string, options?: any);
    stopPolling(): Promise<void>;
    on(event: string, handler: (msg: any) => any): void;
    onText(regexp: RegExp, handler: (msg: Message) => any): void;
    sendMessage(chatId: number, text: string, options?: any): Promise<any>;
    sendChatAction(
      chatId: number,
      action: string,
      options?: any
    ): Promise<void>;
  }
}
