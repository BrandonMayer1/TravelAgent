import { Injectable } from '@nestjs/common';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Ollama } from '@langchain/community/llms/ollama';
import { FileUploadService } from 'src/file-upload.service';
import { zodToJsonSchema } from "zod-to-json-schema";

@Injectable()
export class FlightFinderTool extends StructuredTool {
  private inputSchema = z.string().describe("A string request from the user that has been formated by the Flight Extracter.")
  

  private flightSchema = z.string().describe("A string of the output of the found flights by the tool")

  name = 'flight-finder';
  description = 'Searches flight database and returns up to 5 matching flights in structured string format';
  
  schema = zodToJsonSchema(
    z.object({
      parameters: this.inputSchema,
      response: this.flightSchema,
    })
  );

  private llm = new Ollama({ 
    model: 'llama3.1:latest',
    temperature: 0.3 
  });

  constructor(private readonly fileUploadService: FileUploadService) {
    super();
  }

  async _call(input: { parameters: string }): Promise<String> {
    console.log("Searching for flights matching:", input.parameters);
      const foundFlights = this.fileUploadService.queryWithMessage(input.parameters,8);
      
      const prompt = `Find the 5 best flights that best match this request:
      
      REQUEST: "${input.parameters}"
      
      FLIGHT DATA:
      ${foundFlights}

      
      RULES:
      1. Only include flights matching the request
      2. Strictly validate airport codes
      3. Format times as 24-hour (e.g., "14:30")
      4. Return maximum 5 best matches 
      5. Sort by:
         - Best match to request first
         - Then by price (lowest first)
      6. You are an AI tool you cannot use code
      EXAMPLE OUTPUT:"
      1. American Airlines: 8:00 AM departure, 9:30 AM arrival, $440
      2. Delta Air Lines: 9:15 AM departure, 10:45 AM arrival, $460
      3. United Airlines: 10:00 AM departure, 11:30 AM arrival, $480
      4. JetBlue Airways: 11:30 AM departure, 1:00 PM arrival, $490
      5. Spirit Airlines: 12:45 PM departure, 2:15 PM arrival, $520
      "
      OUTPUT:`;

      const rawResponse = await this.llm.invoke(prompt);
      
      // Validate against schema
      console.log("__________________________FLIGHT FINDER___________________________")
      console.log("Found flights:", rawResponse);
      return rawResponse;
    }
}