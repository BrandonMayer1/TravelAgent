import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { AgentState } from '../flight-agent/interface';
import { FileUploadService } from '../file-upload.service';

@Injectable()
export class FlightAgentService {
    constructor(private readonly aiService: AiService, private fileUpload: FileUploadService) {}

    async runAgent(userQuery: string) {
        let state: AgentState = { 
            userQuery,
            extractedParams: '',
            foundFlights: ''
        };
        state = await this.parseCheckReply(state);
        
        // If not flight-related, return early
        if (state.error) {
            return state;
        }
        //Continue on
        state = await this.extractUserRequest(state);
        state = await this.searchFlights(state);
        return state;
    }

    private async parseCheckReply(state: AgentState): Promise<AgentState> {
        const prompt = `
        You are a flight booking assistant. Analyze this message:
        
        "${state.userQuery}"
        
        Respond STRICTLY in this format:
        [YES] - if it's a flight search request
        [NO] [helpful rejection message] - if unrelated
        
        Flight requests must include:
        - Departure location (city/airport)
        - Destination (city/airport)
        AND/OR
        - Clear flight intent ("flight", "fly", "ticket") with travel dates
        
        If rejecting, provide a POLITE, HELPFUL message guiding the user. Examples:
        
        Good [NO] responses:
        [NO] I specialize in flights. Please ask something like "Find me flights from Chicago to Miami"
        [NO] I can't help with hotels. Try "Flights to Paris on June 10th"
        [NO] Need departure and destination. Example: "Flights from NYC to London"
        
        Bad responses:
        "Not a flight request" (too vague)
        "NO" (no guidance)
        "Sorry" (not helpful)
        
        Your response (ONLY in the specified format):`.trim();
        
        const response = await this.aiService.chat(prompt);
        console.log('Check reply response:', response);
        
        const {isYes, reason} = this.parseSimpleResponse(response);
        if (!isYes) {
            return {
                ...state,
                error: reason
            };
        }
        
        return state;
    }


    private parseSimpleResponse(response: string): { isYes: boolean, reason: string } {
        const clean = response.replace(/[[\]]/g, '').trim();
        
        if (clean.toUpperCase().startsWith('YES')) {
            return {
                isYes: true,
                reason: clean.substring(3).trim()
            };
        }
        
        return {
            isYes: false,
            reason: clean.substring(2).trim()
        };
    }

    private async extractUserRequest(state: AgentState) {
        console.log('ExtractUserRequest - userQuery:', state.userQuery);
        
        const prompt = `
        You are a flight details extractor. Your job is to extract specific flight information from user requests.
        
        User request: "${state.userQuery}"
        
        IMPORTANT: This is a flight request that has already been confirmed. Your job is ONLY to extract the details.
        DO NOT reject the request. DO NOT say [NO]. DO NOT provide guidance.
        
        Extract and format the flight details as follows:
        
        Departure: [city name with airport code in parentheses]
        Arrival: [city name with airport code in parentheses]
        Date: [YYYY-MM-DD format, or "not specified" if no date mentioned]
        Budget: [amount with currency, or "not specified" if no budget mentioned]
        
        Examples:
        Input: "I want to fly from NYC to London on June 15th"
        Output:
        Departure: New York (JFK)
        Arrival: London (LHR)
        Date: 2024-06-15
        Budget: not specified
        
        Input: "philly to new york"
        Output:
        Departure: Philadelphia (PHL)
        Arrival: New York (JFK)
        Date: not specified
        Budget: not specified
        
        Now extract details from: "${state.userQuery}"
        
        Your response (only the formatted details):`.trim();
      
      const llmResponse = await this.aiService.chat(prompt);
      console.log('ExtractUserRequest - raw AI response:', llmResponse);

      return { 
        ...state, 
        extractedParams: llmResponse
      };
    }

    private async searchFlights(state: AgentState){
        console.log('SearchFlights - extractedParams:', state.extractedParams);
        
        const params = state.extractedParams;
        if (!params || params.trim() === '') {
            return {
                ...state,
                error: 'No flight parameters extracted. Please provide clear departure and destination information.'
            };
        }
        
        // Check if the extracted params look like a rejection message
        if (params.toLowerCase().includes('can\'t help') || params.toLowerCase().includes('please ask')) {
            return {
                ...state,
                error: 'Failed to extract flight details. Please provide clear departure and destination information.'
            };
        }
        
        const context = await this.fileUpload.queryWithMessage(params);
        console.log('SearchFlights - context:', context);
        
        const promptContext = `You are a flight AI Agent who helps users find flights based on their requests.
        A user wants a flight with these details: ${params}
        
        Find and list similar flights ranked on how well they match their request.
        Here are some flights to pick from: ${context}
        
        Provide a helpful response with flight recommendations.`;
        
        const llmResponse = await this.aiService.chat(promptContext);
        console.log('SearchFlights - AI response:', llmResponse);

        return {...state, foundFlights: llmResponse};
    }

}