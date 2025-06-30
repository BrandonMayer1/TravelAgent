import { Injectable } from '@nestjs/common';
import { Tool } from '@langchain/core/tools';
import { Ollama } from '@langchain/community/llms/ollama';

@Injectable()
export class FlightExtractorTool extends Tool {
  name = 'flight-extractor';
  description = 'Extracts flight parameters from user requests including departure/arrival cities, airport codes, and budget information. Returns structured JSON data.';
  
  private llm = new Ollama({ model: 'llama3.1:latest' });

  async _call(userQuery: string): Promise<string> {
    console.log("Extracting Flight Parameters from Request");
    const prompt = `Extract flight details and respond with VALID JSON. Follow these rules:
      1. RESPONSE FORMAT (must use this exact structure):
      {
        "departure": {"city": "CityName", "code": "AIRPORT"},
        "arrival": {"city": "CityName", "code": "AIRPORT"}, 
        "budget": {"amount": number, "currency": "USD"} || null
      }

            2. Airport Codes (use these exact codes):
            - New York → JFK
            - Los Angeles → LAX  
            - Chicago → ORD
            - Philadelphia → PHL
            - Miami → MIA
            - Boston → BOS
            - San Francisco → SFO
            - Dallas → DFW

            3. Budgets:
            - Always return amount as number (500 not $500)
            - Always use USD as currency
            - If no budget specified, return null

            Examples:
            Input: "Fly from Boston to Chicago with $500 budget"
            Output: 
            {
            "departure": {"city": "Boston", "code": "BOS"},
            "arrival": {"city": "Chicago", "code": "ORD"},
            "budget": {"amount": 500, "currency": "USD"}
            }

            Input: "philly to nyc"
            Output:
            {
            "departure": {"city": "Philadelphia", "code": "PHL"},
            "arrival": {"city": "New York", "code": "JFK"}, 
            "budget": null
            }

            Input: "flights to miami under 300 dollars"  
            Output:
            {
            "departure": null,
            "arrival": {"city": "Miami", "code": "MIA"},
            "budget": {"amount": 300, "currency": "USD"}
            }

            Input: "${userQuery}"
            Output:`;

    const response = await this.llm.invoke(prompt);
    console.log(response);
    return response;
  }
}