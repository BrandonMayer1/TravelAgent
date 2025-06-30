import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { FileUploadService } from '../file-upload.service';
import { OllamaModule } from '../ollama/ollama.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, OllamaModule],
  providers: [AgentService, FileUploadService],
  exports: [AgentService],
})
export class AgentModule {}
