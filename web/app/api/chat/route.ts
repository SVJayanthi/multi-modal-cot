import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return Response.json(
        { error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    // Check if any message contains attachments (images)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasImages = messages.some((message: any) => 
      message.experimental_attachments && message.experimental_attachments.length > 0
    );

    // Use vision model if images are present
    const model = hasImages ? openai('gpt-4o') : openai('gpt-4');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedMessages = messages.map((message: any) => {
      if (message.experimental_attachments && message.experimental_attachments.length > 0) {
        return {
          role: message.role,
          content: [
            { type: 'text', text: message.content },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...message.experimental_attachments.map((attachment: any) => ({
              type: 'image',
              image: attachment.url,
            })),
          ],
        };
      }
      return {
        role: message.role,
        content: message.content,
      };
    });

    const systemPrompt = `You are a helpful AI assistant. For complex questions, show your reasoning process step by step before providing your final answer. 

Format your response like this:
<thinking>
Step 1: [Brief title]
[Detailed reasoning for this step]

Step 2: [Brief title]
[Detailed reasoning for this step]

[Continue with more steps as needed]
</thinking>

[Your final answer here]

Always include the <thinking> tags when showing your reasoning process.`

    // Extract user message text for logging
    const userMessage = processedMessages[processedMessages.length - 1];
    const userText = typeof userMessage.content === 'string' 
      ? userMessage.content 
      : userMessage.content.find((c: any) => c.type === 'text')?.text || 'Image message';

    console.log('System Prompt:', systemPrompt);
    console.log('User Message:', userText);

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: processedMessages,
      maxTokens: 4000, // Add token limit
      temperature: 0.7, // Add temperature for consistency
      onFinish: (result) => {
        console.log('AI Response:', result.text);
        console.log('Usage:', result.usage);
      },
      onError: (error) => {
        console.error('Stream error:', error);
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid or missing OpenAI API key';
      } else if (error.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'OpenAI API rate limit exceeded';
      } else {
        errorMessage = error.message;
      }
    }
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}