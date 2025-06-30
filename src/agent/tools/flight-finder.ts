import { Tool } from 'langchain/tools';
import { Ollama } from '@langchain/community/llms/ollama';
import { FileUploadService } from '../../file-upload.service';

export class FlightFinderTool extends Tool {
  name = 'flight_finder';
  description = 'Finds flights based on what the user requests';

  private llm = new Ollama({ model: 'llama3.1:latest' });

  constructor(private readonly fileUpload: FileUploadService) {
    super();
  }

  async _call(userQuery: string): Promise<string> {
    console.log("Extracting Flight Parameters from Request");
    const context = await this.fileUpload.queryWithMessage(userQuery);
    const prompt = `You are a flight search assistant. Extract flight parameters and generate 5 realistic flight options in STRICT JSON FORMAT.

    RULES:
    1. Output MUST be valid JSON - NO COMMENTS, NO TRAILING COMMAS
    2. For dates:
       - "tomorrow" → current date + 1 day (YYYY-MM-DD)
       - "next week" → current date + 7 days
       - Unspecified → empty string ("")
    3. For cities:
       - NY → JFK (primary), EWR, LGA
       - PA → PHL (primary), PIT
    4. Flight details must include:
       - Real airline names
       - Valid flight numbers (AA/DL/UA 100-9999)
       - Realistic prices and durations
       - Actual departure/arrival times
    
    RESPONSE FORMAT:
    {
      "parameters": {
        "origin": "AIRPORT_CODE",
        "destination": "AIRPORT_CODE",
        "date": "YYYY-MM-DD"
      },
      "flights": [
        {
          "airline": "Full Name",
          "flightNumber": "XX1234",
          "departure": {
            "time": "HH:MM AM/PM",
            "airport": "CODE"
          },
          "arrival": {
            "time": "HH:MM AM/PM",
            "airport": "CODE"
          },
          "duration": "Xh Ym",
          "price": "$XXX.XX",
          "stops": 0
        }
      ]
    }
    
    EXAMPLE 1:
    User: "flights from NY to PA tomorrow"
    Output:
    {
      "parameters": {
        "origin": "JFK",
        "destination": "PHL",
        "date": "2025-07-01"
      },
      "flights": [
        {
          "airline": "American Airlines",
          "flightNumber": "AA1234",
          "departure": {
            "time": "08:00 AM",
            "airport": "JFK"
          },
          "arrival": {
            "time": "09:15 AM",
            "airport": "PHL"
          },
          "duration": "1h 15m",
          "price": "$129.00",
          "stops": 0
        },
        {
          "airline": "Delta",
          "flightNumber": "DL5678",
          "departure": {
            "time": "10:30 AM",
            "airport": "JFK"
          },
          "arrival": {
            "time": "11:45 AM",
            "airport": "PHL"
          },
          "duration": "1h 15m",
          "price": "$139.00",
          "stops": 0
        }
      ]
    }
    
    EXAMPLE 2:
    User: "cheap flights from Philadelphia to NYC"
    Output:
    {
      "parameters": {
        "origin": "PHL",
        "destination": "JFK",
        "date": ""
      },
      "flights": [
        {
          "airline": "Frontier",
          "flightNumber": "F9123",
          "departure": {
            "time": "06:15 AM",
            "airport": "PHL"
          },
          "arrival": {
            "time": "07:30 AM",
            "airport": "JFK"
          },
          "duration": "1h 15m",
          "price": "$79.00",
          "stops": 0
        },
        {
          "airline": "Spirit",
          "flightNumber": "NK456",
          "departure": {
            "time": "03:45 PM",
            "airport": "PHL"
          },
          "arrival": {
            "time": "05:00 PM",
            "airport": "JFK"
          },
          "duration": "1h 15m",
          "price": "$85.00",
          "stops": 0
        }
      ]
    }
    
    NOW PROCESS:
    User: "${userQuery}"
    Context: ${context}
    Output:`;

    const response = await this.llm.invoke(prompt);
    return response;
  }
}