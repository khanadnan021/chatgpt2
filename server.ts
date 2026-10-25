import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize GoogleGenAI
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Healthcheck endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', hasKey: !!process.env.GEMINI_API_KEY });
});

// SSE Streaming chat endpoint
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  };

  try {
    const { messages, think, webSearch } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      sendEvent('error', { message: 'Messages array is required' });
      res.end();
      return;
    }

    const ai = getAI();
    // Using gemini-3-flash-preview for fast, rich reasoning
    const model = 'gemini-3-flash-preview';

    // System instruction to emulate the friendly, concise, intelligent ChatGPT persona
    let systemInstruction =
      'You are ChatGPT, a large language model trained by OpenAI. You provide clear, concise, accurate, and insightful answers. Format code blocks with language tags, use clean Markdown formatting, and maintain a friendly, engaging tone. When asked who you are, answer as ChatGPT.';

    if (think) {
      systemInstruction +=
        ' You are operating in Deep Think reasoning mode. Provide structured, thorough, and highly reasoned explanations.';
    }

    // Build history
    const contents: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [];

      // Add attachments if any (images, files)
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.data && att.mimeType) {
            const base64Data = att.data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: att.mimeType,
              },
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        // Ensure alternating role format if consecutive
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts.push(...parts);
        } else {
          contents.push({ role, parts });
        }
      }
    }

    // Ensure contents starts with a user turn
    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const config: any = {
      systemInstruction,
    };

    if (think) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    }

    if (webSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });

    let fullText = '';
    let hasGrounding = false;
    let searchQueries: string[] = [];
    let searchSources: Array<{ title: string; url: string }> = [];

    for await (const chunk of responseStream) {
      // Check grounding / search metadata
      const candidate = chunk.candidates?.[0];
      const groundingMeta = candidate?.groundingMetadata;
      if (groundingMeta) {
        hasGrounding = true;
        if (groundingMeta.webSearchQueries) {
          searchQueries = groundingMeta.webSearchQueries;
        }
        if (groundingMeta.groundingChunks) {
          searchSources = groundingMeta.groundingChunks
            .filter((c: any) => c.web?.uri && c.web?.title)
            .map((c: any) => ({
              title: c.web.title,
              url: c.web.uri,
            }));
        }
      }

      const text = chunk.text;
      if (text) {
        fullText += text;
        sendEvent('chunk', { text });
      }
    }

    sendEvent('done', {
      fullText,
      searchInfo: hasGrounding ? { queries: searchQueries, sources: searchSources } : null,
    });
    res.end();
  } catch (error: any) {
    console.error('Error generating streaming response:', error);
    sendEvent('error', { message: error.message || 'Failed to generate response' });
    res.end();
  }
});

// Image generation endpoint with fallback
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const ai = getAI();

    try {
      // Try gemini-2.5-flash-image / gemini-3.1-flash-lite-image
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
      });

      let imageUrl = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        res.json({ imageUrl });
        return;
      }
    } catch (modelErr: any) {
      console.warn('Primary image generation encountered quota/tier notice:', modelErr.message);
    }

    // High quality artwork generation fallback
    const encoded = encodeURIComponent(prompt);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`;
    res.json({ imageUrl: fallbackUrl });
  } catch (error: any) {
    console.error('Error in generate-image:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`ChatGPT server listening on port ${PORT}`);
  });
}

startServer();
