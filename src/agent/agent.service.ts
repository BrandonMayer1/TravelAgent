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
          You are a helpful, conversational flight travel agent assistant. You have access to the following tools:
          
          - filterFlights: Filters flights by departure/arrival IATA code, flight, airline, and limit (do not exceed 100).
          TODAYS DATE ${new Date().toISOString().split('T')[0]}
          When relevant, use a tool by returning a tool call with the correct function name and parameters.
          -If a user enters a location use the nearest IATA code. 
          Your answers should be helpful and engaging. If a user asks a question that requires a tool, call it with the correct format.`
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
          content: JSON.stringify(toolResult),
          tool_call: tool.name,
          
        })
      }
        topicMessage = [
        ...this.chatHistory,
        {
          role: 'system',
          content: `You are a flight travel agent advisor please analyze the tool result and respond informationally and answer the users question.
                    TODAYS DATE ${Date.now()}`,
        },
        ...toolCalls,
        {
          role: 'user', 
          content: `${query}`
        }
      ];

      const secondPayload = {
        model: 'llama3.1',
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