import { Injectable } from '@nestjs/common';
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { FlightFinderTool } from './tools/flight-finder';
import { FlightExtractorTool } from './tools/flight-extracter';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from 'src/ollama/ollama.service';

@Injectable()
export class FlightAgentService {
  private agent: any;
  private readonly model: ChatGoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly flightExtractorTool: FlightExtractorTool,
    private readonly flightFinderTool: FlightFinderTool,
    private readonly ollamaService: OllamaService,
  ) {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash", 
      apiKey: this.configService.get<string>('GOOGLE_API_KEY'),
      maxOutputTokens: 2048,
      temperature: 0.3
    });
    this.initializeAgent();
  }

  private async initializeAgent() {
    this.agent = createReactAgent({
      llm: this.model,
      tools: [this.flightExtractorTool, this.flightFinderTool],
      prompt: `You are a flight booking assistant. When showing flight results:
      1. ALWAYS display specific flights in a numbered list
      2. Include airline, flight number, times, and price
      3. Never summarize or say "range from X to Y"`
    });
  }

  async invokeAgent(query: string) {
    try {
      const result = await this.agent.invoke({
        messages: [{
          role: "user",
          content: query,
        }],
      });
      console.log(result);
      const response = await this.ollamaService.chat(`You are an AI Parser. Please reply with only the message output of this langgraph output and make sure its in a human readable form. ${JSON.stringify(result)}`)

      return {
        success: true,
        response: response,
      };
    } catch (error) {
      console.error('Agent invocation error:', error);
      return {
        success: false,
        error: 'Agent invocation failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
}