import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { FileUploadService } from './file-upload.service';
import { FlightAgentModule } from './flight-agent/flight-agent.module';

@Module({
  imports: [HttpModule, FlightAgentModule],
  controllers: [AppController],
  providers: [AppService, FileUploadService],
})
export class AppModule {}
