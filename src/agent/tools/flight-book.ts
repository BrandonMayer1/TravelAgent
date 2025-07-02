import { Injectable } from '@nestjs/common';
import { Tool } from '@langchain/core/tools';

@Injectable()
export class FlightBookingTool extends Tool {
  name = 'flight-booker';
  description = 'Use this tool when the user explicitly asks to book a specific flight from the list.';
  
  async _call(userQuery: string): Promise<string> {
    console.log("BOOKING FLIGHT");
    return (`Flight Booked`);
  }
}