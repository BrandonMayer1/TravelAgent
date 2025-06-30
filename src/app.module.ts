import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { FileUploadService } from './file-upload.service';
import { OllamaService } from './ollama/ollama.service';
import { AgentModule } from './agent/agent.module';
import { OllamaModule } from './ollama/ollama.module';

@Module({
  imports: [HttpModule, AgentModule, OllamaModule],
  controllers: [AppController],
  providers: [AppService, FileUploadService, OllamaService],
})
export class AppModule {}
