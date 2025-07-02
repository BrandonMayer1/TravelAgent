import { Injectable } from '@nestjs/common';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { Ollama } from '@langchain/community/llms/ollama';
import { FileUploadService } from 'src/file-upload.service';
import { zodToJsonSchema } from "zod-to-json-schema";

@Injectable()
export class FlightValidatorTool extends StructuredTool {
  private inputSchema = z.string().describe("The outputed string of the Flight Finder")
  private flightSchema = z.string().describe("A string output of flights that were checked to be real")

  name = 'flight-validator';
  description = 'Checks the output of the flight finder to make sure all the flights match the database and returns a string of accurate flights';
  
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
    console.log("__________________________FLIGHT VALIDATOR___________________________")
    const flights = this.extractNumberedFlights(input.parameters);
    const DBFlights: string[] = []
    for (let i = 0; i < flights.length; i++){
        DBFlights.push(await this.fileUploadService.queryWithMessage(flights[i],3));
    }


      const prompt = `You are a flight validator tasked with checking if these 5 flights are real
      REQUEST: "${input.parameters}". If they are all real I want you to return the five flights in the exact same format.
      However if they are not real based on the database please remove only the fake flight from the database. Keeping the list format intact.
      Here is the database. ${DBFlights}`;

      const rawResponse = await this.llm.invoke(prompt);
      
      // Validate against schema
      console.log("Validated flights:", rawResponse);
      return rawResponse;
    }

    extractNumberedFlights(listing: string): string[] {
        // Match lines starting with 1. through 5.
        const regex = /^[1-5]\.\s(.+)$/gm;
        const matches = listing.matchAll(regex);
        
    return Array.from(matches, m => m[1].trim()).filter(flight => flight.length > 0);
    }
}