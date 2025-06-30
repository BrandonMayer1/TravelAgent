import { Injectable } from '@nestjs/common';
import { AgentService } from './agent/agent.service';

@Injectable()
export class AppService {
  constructor(private readonly agent: AgentService) {}

  async startChat(
    message: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<string> {
    return await this.agent.runAgent({ input: message, chat_history: chatHistory });
  }
}
