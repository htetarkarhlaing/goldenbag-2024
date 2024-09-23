import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID as string;

  async sendMessage(message: string) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const body = {
      chat_id: this.chatId,
      text: message,
    };

    try {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = response.data;

      if (!data.ok) {
        this.logger.error('Failed to send message', data);
      }
    } catch (error) {
      this.logger.error('Error sending message', error);
    }
  }
}
