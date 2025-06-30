import { Injectable } from '@nestjs/common';
import { Ollama } from 'ollama';
import { Ollama as OllamaLangchain } from '@langchain/community/llms/ollama';

@Injectable()
export class OllamaService {
  private ollama = new Ollama({ host: 'http://localhost:11434' }); // Default Ollama port
  private llm = new OllamaLangchain({ model: 'llama3.1:latest' }); // LangChain integration

  async chat(message: string): Promise<string> {
    const response = await this.ollama.chat({
      model: 'llama3.1:latest',
      messages: [{ role: 'user', content: message }],
    });
    return response.message.content;
  }

  async invokeAgent(prompt: string): Promise<string> {
    return await this.llm.invoke(prompt);
  }
}