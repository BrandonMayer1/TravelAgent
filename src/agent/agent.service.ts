import { Injectable } from '@nestjs/common';
import { OllamaService } from '../ollama/ollama.service';
import { AgentExecutor, initializeAgentExecutor } from 'langchain/agents';
import { FlightExtractorTool } from './tools/flight-extracter';
import { FlightFinderTool } from './tools/flight-finder';
import { FileUploadService } from '../file-upload.service';

@Injectable()
export class AgentService {
  private agentExecutor: AgentExecutor;

  constructor(
    private readonly ollamaService: OllamaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async setupAgent() {
    const tools = [
      new FlightExtractorTool(),
      new FlightFinderTool(this.fileUploadService),
    ];

    // Workaround: Modify the LLM's invoke method
    const originalInvoke = this.ollamaService['llm'].invoke;
    this.ollamaService['llm'].invoke = async (prompt: string) => {
      const formattedPrompt = `Respond STRICTLY in this format:
      Thought: [analyze request]
      Action: {tool_names}
      Action Input: [JSON if needed]
      
      Current conversation: {chat_history}
      User query: ${prompt}`;
      
      return originalInvoke.call(this.ollamaService['llm'], formattedPrompt);
    };

    this.agentExecutor = await initializeAgentExecutor(
      tools,
      this.ollamaService['llm'],
      'chat-conversational-react-description',
    );
  }

  async runAgent({ input, chat_history }: { input: string; chat_history: any[] }): Promise<string> {
    if (!this.agentExecutor) {
      await this.setupAgent();
    }
    const result = await this.agentExecutor.invoke({ input, chat_history });
    return result.output;
  }
}