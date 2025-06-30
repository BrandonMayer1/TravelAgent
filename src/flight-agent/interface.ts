export interface AgentState {
  userQuery: string;
  extractedParams?: string;
  foundFlights?: string;
  selectedFlightId?: string;
  conversationStage?: string; 
  error?: string;
}
