import { Injectable } from '@nestjs/common';
import { StructuredTool } from '@langchain/core/tools';
import { Ollama } from '@langchain/community/llms/ollama';
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

@Injectable()
export class FlightExtractorTool extends StructuredTool {
  private inputSchema = z.string().describe("Raw user flight request (e.g., 'flight from Philly to NYC July 5th')");

  private outputType = z.string().describe(
    "Standardized natural language flight request with airport codes. " +
    "Format: 'Flight from [City] (CODE) to [City] (CODE) [date] [budget]'. " +
    "Example: 'Flight from Philadelphia (PHL) to New York (JFK) on 2025-07-05 with $500 USD budget'"
  );

  name = 'flight-extractor';
  description = 'Converts informal flight requests into standardized natural language format with airport codes for the flight finder tool';
  
  schema = zodToJsonSchema(
    z.object({
      parameters: this.inputSchema,
      response: this.outputType
    })
  );

  private llm = new Ollama({ model: 'llama3.1:latest' });

  async _call(input: { parameters: string }): Promise<string> {
    const currentDate = new Date().toISOString().split('T')[0];
    console.log(input);
    const prompt = `Transform this flight request into a standardized natural language summary:

    USER REQUEST: "${input.parameters}"
    CURRENT DATE: ${currentDate}

    FORMATTING RULES:
    1. Always include:
       - Departure city with airport code (e.g., "Philadelphia (PHL)")
       - Arrival city with airport code
    2. Optional elements if mentioned:
       - Date (format as YYYY-MM-DD)
       - Budget (format as "$XXX USD")
       - Travel class (economy/business/first)
    3. Never include:
       - Additional commentary
       - Questions
       - Suggestions
       -Only respond with what the user responds no aditional comments OR YOU WILL DIE

    CITY TO AIRPORT CODE MAPPING:
    - New York → JFK
    - Philadelphia → PHL
    - Miami → MIA
    - Chicago → ORD
    - Los Angeles → LAX

    DATE HANDLING:
    - "next Tuesday" → calculate actual date
    - "July 20th" → 2025-07-20
    - "tomorrow" → calculate actual date

    EXAMPLES:
    Input: "I need to fly from Philly to NYC"
    Output: "Flight from Philadelphia (PHL) to New York (JFK)"

    Input: "Book me a flight to Miami with $500 budget for July 15th"
    Output: "Flight to Miami (MIA) with $500 USD budget on 2025-07-15"

    Input: "Flights from Boston to Chicago business class next Friday"
    Output: "Flight from Boston (BOS) to Chicago (ORD) in business class on 2025-07-19"

    Input: "${input.parameters}"
    Output:`;

    const response = await this.llm.invoke(prompt);
    console.log("__________________________FLIGHT EXTRACTOR___________________________")
    console.log(response);
    return response;
  }
}