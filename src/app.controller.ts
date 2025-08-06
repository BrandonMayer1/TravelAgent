import {
  Controller,
  Get,
  Post,
  Body,
} from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}
  private UserChats: string[] = [];
  private AiChats: string[] = [];

  @Get()
  Homepage() {
    let chatHistory =
      '<div class="bubble ai">AI: Hello I am an AI agent here to help you book flights. Where from and to do you want to go?</div>';
    for (let i = 0; i < this.UserChats.length; i++) {
      chatHistory += `<div class="bubble user">You: ${this.UserChats[i]}</div>`;
      if (this.AiChats[i] != null) {
        chatHistory += `<div class="bubble ai">AI: ${this.AiChats[i]}</div>`;
      }
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ChatBot</title>
          <style>
            body {
              font-family: sans-serif;
              padding: 20px;
              background-color: #f4f4f4;
            }
  
            .chat-box {
              display: flex;
              flex-direction: column;
              border: 1px solid #ccc;
              background: #fff;
              padding: 10px;
              height: 300px;
              overflow-y: auto;
              margin-bottom: 20px;
            }

            .bubble {
              display: block;
              padding: 10px;
              margin: 6px 0;
              border-radius: 15px;
              max-width: 80%;
              word-wrap: break-word;
              white-space: pre-wrap;
              font-family: inherit;
            }

            .user {
              background-color: rgb(45, 167, 238);
              color: white;
            }

            .ai {
              background-color: rgb(141, 141, 151);
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="chat-box" id="chatBox">
            ${chatHistory}
          </div>
          <form id="chatForm">
            <input type="text" id="messageInput" required />
            <input type="submit" value="Submit" />
          </form>
          <br />
  
          <script>
            document.getElementById("chatForm").addEventListener('submit', async function(e) {
              e.preventDefault();
              const inputElement = document.getElementById('messageInput');
              const message = inputElement.value;
              const chatBox = document.getElementById('chatBox');
              
              chatBox.innerHTML += '<div class="bubble user">You: ' + message + '</div>';
              inputElement.value = '';

              try {
                const response = await fetch('/submit', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ message: message })
                });

                const data = await response.json();
                // Escape HTML and preserve formatting
                const formattedResponse = data.aiResponse
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
                chatBox.innerHTML += '<div class="bubble ai">AI: ' + formattedResponse + '</div>';
              } catch (error) {
                chatBox.innerHTML += '<div class="bubble ai">Error getting response</div>';
              }
            });
          </script>
        </body>
      </html>
    `;
  }

  @Post('submit')
  async handleSubmit(@Body() body) {
  
    const userMessage = body.message;
    this.UserChats.push(userMessage);
  

    console.log('User message:', userMessage);
  
    // Call your agent with input + chat history
    const result = await this.appService.startChat(userMessage);
    console.log('AI result:', result); 
    const aiResponse = result ?? '';
    this.AiChats.push(aiResponse);
    return { aiResponse };
  }
}
