import { Injectable } from '@nestjs/common';
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { FlightFinderTool } from './tools/flight-finder';
import { FlightExtractorTool } from './tools/flight-extracter';
import { ConfigService } from '@nestjs/config';
import { FlightBookingTool } from './tools/flight-book';
import {FlightValidatorTool} from './tools/flight-validator';
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
    private readonly flightValidatorTool: FlightValidatorTool,

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
      tools: [this.flightExtractorTool, this.flightFinderTool, this.flightBookingTool, this.flightValidatorTool],
      prompt: `You are a flight booking assistant. Today is ${Date()} When showing flight results:
      1. ALWAYS display specific flights in a numbered list
      2. Make it human readable
      3. Do not book a flight unless the user Explicity asks to book
      4. You do not need to fill in all information when using tools.
      5. AFTER YOU USE FLIGHT FINDER YOU MUST USE FLIGHT VALIDATOR TO CHECK ACCURACCY OF RESPONSE
      `
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