import { POST } from '../route';
import { streamText } from 'ai';

// Mock the AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => jest.fn()),
}));

describe('Chat API Route', () => {
  const mockStreamText = streamText as jest.MockedFunction<typeof streamText>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('POST handler', () => {
    it('should return error when OpenAI API key is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('OpenAI API key is not configured');
    });

    it('should handle text-only messages with gpt-4 model', async () => {
      const mockToDataStreamResponse = jest.fn().mockReturnValue(new Response());
      mockStreamText.mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse,
      } as any);

      const messages = [
        { role: 'user', content: 'Hello, how are you?' },
      ];

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('<thinking>'),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Hello, how are you?',
            }),
          ]),
          maxTokens: 4000,
          temperature: 0.7,
        })
      );
    });

    it('should handle messages with image attachments using gpt-4o model', async () => {
      const mockToDataStreamResponse = jest.fn().mockReturnValue(new Response());
      mockStreamText.mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse,
      } as any);

      const messages = [
        {
          role: 'user',
          content: 'What is in this image?',
          experimental_attachments: [
            {
              contentType: 'image/png',
              url: 'data:image/png;base64,iVBORw0KGg...',
            },
          ],
        },
      ];

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                { type: 'text', text: 'What is in this image?' },
                { type: 'image', image: 'data:image/png;base64,iVBORw0KGg...' },
              ]),
            }),
          ]),
        })
      );
    });

    it('should handle multiple messages in conversation', async () => {
      const mockToDataStreamResponse = jest.fn().mockReturnValue(new Response());
      mockStreamText.mockResolvedValue({
        toDataStreamResponse: mockToDataStreamResponse,
      } as any);

      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How can you help me?' },
      ];

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'How can you help me?' },
          ]),
        })
      );
    });

    it('should handle API key related errors', async () => {
      mockStreamText.mockRejectedValue(new Error('Invalid API key'));

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid or missing OpenAI API key');
    });

    it('should handle quota exceeded errors', async () => {
      mockStreamText.mockRejectedValue(new Error('quota exceeded'));

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('OpenAI API quota exceeded');
    });

    it('should handle rate limit errors', async () => {
      mockStreamText.mockRejectedValue(new Error('rate limit exceeded'));

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('OpenAI API rate limit exceeded');
    });

    it('should handle generic errors', async () => {
      mockStreamText.mockRejectedValue(new Error('Something went wrong'));

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Something went wrong');
    });

    it('should handle non-Error objects thrown', async () => {
      mockStreamText.mockRejectedValue('String error');

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('An unexpected error occurred');
    });

    it('should call onFinish callback with result', async () => {
      const onFinishCallback = jest.fn();
      mockStreamText.mockImplementation(async (options: any) => {
        if (options.onFinish) {
          options.onFinish({
            text: 'AI response text',
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          });
        }
        return {
          toDataStreamResponse: jest.fn().mockReturnValue(new Response()),
        } as any;
      });

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalled();
    });

    it('should call onError callback when stream error occurs', async () => {
      const onErrorCallback = jest.fn();
      mockStreamText.mockImplementation(async (options: any) => {
        if (options.onError) {
          options.onError(new Error('Stream error'));
        }
        return {
          toDataStreamResponse: jest.fn().mockReturnValue(new Response()),
        } as any;
      });

      const request = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalled();
    });
  });
});