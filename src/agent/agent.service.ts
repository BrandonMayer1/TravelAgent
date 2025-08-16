import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {tools} from './tools';

@Injectable()
export class FlightAgentService {
  private chatHistory: Array<{role: string, content: string}> = [];

  constructor(
    private readonly httpService: HttpService,
  ) {}


  async invokeAgent(query: string) {
    //ADD TOOLs
    try {
      let topicMessage = [
        ...this.chatHistory,
        {
          role: 'system',
          content: `
        You are a helpful, conversational and history aware flight travel agent assistant.
        
        TOOLS AVAILABLE:
        - filterFlights: Filters flights by departure/arrival IATA code, flight, airline, and limit (do not exceed 20).
        
        TODAY'S DATE: ${new Date().toISOString().split('T')[0]}
        
        TOOL USAGE RULES:
        - If the user asks for comparisons, filtering, or ranking of flights, call "filterFlights" again using the last known parameters unless they give new ones.
        - Always resolve city names to nearest IATA code before calling the tool.
        - Never make up flights — only use actual tool results.
        - If tool results exist from earlier in the conversation and are still relevant, you may use them directly.
  
        `
        },
        {
          role: 'user', 
          content: `${query}`
        }
      ];

      const toolSchema = tools.map(({ name, description, parameters }) => ({
        type: "function",
        function: { name, description, parameters }
      }));

      let payload: any = {
        model: 'llama3.1',
        messages: topicMessage,
        stream: false,
        tools: toolSchema
      }

      let response = await firstValueFrom(
        this.httpService.post('http://localhost:11434/api/chat', payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      console.log("FULL tool_calls response:");
      console.log(JSON.stringify(response.data.message.tool_calls, null, 2));
      const toolMessages: any[] = [];

      const toolCalls = response.data?.message?.tool_calls || [];
      for (const toolCall of toolCalls) {
        const { name, arguments: rawArgs } = toolCall.function;
        const tool = tools.find(t => t.name === name);
        if (!tool) continue;

        const parsedParams = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
        const toolResult = await tool.func(parsedParams);
        toolMessages.push({
          role:'system',
          content: `TOOL RESULT from "${tool.name}":\n${JSON.stringify(toolResult, null, 2)}`
          
        })
      }
        topicMessage = [
        ...this.chatHistory,
        {
          role: 'system',
          content: `
        You are a flight travel agent advisor.
        Analyze the TOOL RESULTS provided below and respond informatively to the user's question.
        Rules:
        - Base your answer strictly on the provided flights data.
        - Do not fabricate flight details or times.
        - If the user asks for shortest/longest/cheapest, sort and return the relevant flights.
        - Keep your answer clear, concise, and conversational.
        - Please read the history to understand context of the user request.
        `
        },
        ...toolMessages,
        {
          role: 'user', 
          content: `${query}`
        }
      ];

      const secondPayload = {
        model: 'deepseek-v2',
        messages: topicMessage,
        stream: false,
      }

      response = await firstValueFrom(
        this.httpService.post('http://localhost:11434/api/chat', secondPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      this.chatHistory.push({
          role: 'user', 
          content: `${query}`
      });
      this.chatHistory.push({
          role: 'assistant', 
          content: `${response.data.message}`
      });
      
      console.log(response.data.message);
      return response.data.message.content;

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