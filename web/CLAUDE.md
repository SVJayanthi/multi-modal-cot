# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- **Development server**: `npm run dev` - Runs Next.js with Turbopack at http://localhost:3000
- **Build**: `npm run build` - Creates production build
- **Production server**: `npm run start` - Runs production build
- **Linting**: `npm run lint` - Runs Next.js ESLint configuration

### Environment Setup
- Requires `OPENAI_API_KEY` environment variable for chat functionality
- Create `.env.local` file with: `OPENAI_API_KEY=your_key_here`

## Architecture Overview

This is a Next.js 15 application with App Router that implements a multimodal AI chat interface with Chain-of-Thought reasoning visualization.

### Core Architecture

**Frontend Flow**:
- `app/page.tsx`: Main chat interface using Vercel AI SDK's `useChat` hook
- Supports text and image uploads (multimodal)
- Parses and displays thinking steps from AI responses in collapsible UI
- File uploads converted to base64 and sent as experimental_attachments

**Backend API**:
- `app/api/chat/route.ts`: POST endpoint for streaming AI responses
- Automatically switches between GPT-4 (text) and GPT-4o (vision) models based on message content
- Implements structured reasoning with `<thinking>` tags and step-by-step formatting
- Uses Vercel AI SDK's `streamText` for real-time streaming

### Key Dependencies
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`): Streaming chat interface and OpenAI integration
- **Radix UI**: Headless UI components (scroll area, slots)
- **Tailwind CSS**: Styling with animations
- **react-dropzone**: File upload functionality

### Component Structure
- `components/ui/`: Reusable UI components following shadcn/ui patterns
  - `thinking.tsx`: Collapsible reasoning steps display
  - `file-uploader.tsx`: Drag-and-drop file upload
  - Standard UI components (button, card, input, scroll-area)

### Response Format
The AI system prompts responses to include Chain-of-Thought reasoning in this format:
```
<thinking>
Step 1: [Title]
[Reasoning]

Step 2: [Title]  
[Reasoning]
</thinking>

[Final answer]
```

The frontend parses this format to display reasoning steps in an expandable UI component.