import { Injectable } from '@nestjs/common';
import { FlightAgentService } from './flight-agent/flight-agent.service';
import { AgentState } from './flight-agent/interface';

@Injectable()
export class AppService {
  constructor(
    private readonly flightAgent: FlightAgentService,
  ) {}

  async startChat(message: string): Promise<AgentState> {
    return await this.flightAgent.runAgent(message);
  }
}
