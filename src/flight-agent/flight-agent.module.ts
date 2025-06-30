import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FlightAgentService } from './flight-agent.service';
import { AiService } from '../ai/ai.service';
import { FileUploadService } from '../file-upload.service';

@Module({
  imports: [HttpModule],
  providers: [FlightAgentService, AiService, FileUploadService],
  exports: [FlightAgentService],
})
export class FlightAgentModule {}