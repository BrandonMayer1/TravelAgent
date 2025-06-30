import { Injectable } from '@nestjs/common';
import { FlightAgentService } from './agent/agent.service';

@Injectable()
export class AppService {
  constructor(private readonly agent: FlightAgentService) {}

  async startChat(message: string){
    return await this.agent.invokeAgent(message);
  }
}
