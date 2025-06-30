import { Injectable } from '@nestjs/common';
import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Ollama } from '@langchain/community/llms/ollama';
import { FileUploadService } from 'src/file-upload.service';

@Injectable()
export class FlightFinderTool extends Tool {
  name = 'flight-finder';
  description = 'Based on the given flight parameters searches database for similar flights.';
  
  private llm = new Ollama({ model: 'llama3.1:latest' });


  constructor( private readonly fileUploadService: FileUploadService){
    super();
  }

  async _call(userQuery: string): Promise<string> {
    console.log("Searching For Flights");
    const foundFlgihts = this.fileUploadService.queryWithMessage(userQuery);
    const prompt = `You are an AI Agent Tasked with returning 5 most similar flights to this request ${userQuery}.
    YOU ARE TO RESPOND IN ONLY JSON FORMAT. NOTHING ELSE BUT JSON FORMAT. Here are your flights: ${foundFlgihts}`;

    const response = await this.llm.invoke(prompt);
    console.log(response);
    return response;
  }
}