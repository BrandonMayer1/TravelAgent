import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  constructor(private readonly httpService: HttpService) {}
  private chatHistory: Array<{ role: string; content: string }> = [];

  async chat(message: string): Promise<string> {
    this.chatHistory.push({
      role: 'user',
      content: `${message}`,
    });

    const payload = {
      model: 'deepseek-v2:latest',
      messages: this.chatHistory,
      stream: false,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post('http://localhost:11434/api/chat', payload, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      const aiMessage = response.data.message;
      this.chatHistory.push(aiMessage);
      return aiMessage.content;
    } catch (error) {
      console.error('AI Service Error:', error.message);
      throw new Error('Failed to get AI response');
    }
  }
}