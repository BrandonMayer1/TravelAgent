import { Module } from '@nestjs/common';
import { FlightAgentService } from './agent.service';
import { FileUploadService } from '../file-upload.service';
import { OllamaModule } from '../ollama/ollama.module';
import { HttpModule } from '@nestjs/axios';
import { FlightFinderTool } from './tools/flight-finder';
import { FlightExtractorTool } from './tools/flight-extracter';
import { ConfigModule } from '@nestjs/config';
import { FlightBookingTool } from './tools/flight-book';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env'
  }), HttpModule, OllamaModule],
  providers: [FlightAgentService, FileUploadService,FlightFinderTool,FlightExtractorTool, FlightBookingTool],
  exports: [FlightAgentService],
})
export class AgentModule {}
