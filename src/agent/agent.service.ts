import { Injectable } from '@nestjs/common';
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { FlightFinderTool } from './tools/flight-finder';
import { FlightExtractorTool } from './tools/flight-extracter';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from 'src/ollama/ollama.service';
import { FlightBookingTool } from './tools/flight-book';

@Injectable()
export class FlightAgentService {
  private agent: any;
  private readonly model: ChatGoogleGenerativeAI;
  private chatHistory: Array<{role: string, content: string}> = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly flightExtractorTool: FlightExtractorTool,
    private readonly flightFinderTool: FlightFinderTool,
    private readonly flightBookingTool: FlightBookingTool,

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
      tools: [this.flightExtractorTool, this.flightFinderTool, this.flightBookingTool],
      prompt: `You are a flight booking assistant. When showing flight results:
      1. ALWAYS display specific flights in a numbered list
      2. Include airline, flight number, times, and price
      3. Never summarize or say "range from X to Y"
      4. Make it human readable
      5. Do not book a flight unless the user Explicity asks to book`
    });
  }

  async invokeAgent(query: string) {
    try {
      const result = await this.agent.invoke({
        messages: [
          ...this.chatHistory,
          {
          role: "user",
          content: query,
        }],
      });
      console.log(result.messages);
      this.chatHistory = result.messages;

      //gets last message
      const lastMessage = result.messages[result.messages.length - 1].content;
      const finalResponse = Array.isArray(lastMessage) 
        ? lastMessage.join('\n') 
        : lastMessage;

      //return messages
      return {
        success: true,
        response: finalResponse,
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