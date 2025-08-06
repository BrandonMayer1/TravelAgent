import { Module } from '@nestjs/common';
import { FlightAgentService } from './agent.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [FlightAgentService],
  exports: [FlightAgentService],
})
export class AgentModule {}
