export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64 data url
  size?: number;
}

export interface SearchSource {
  title: string;
  url: string;
}

export interface SearchInfo {
  queries: string[];
  sources: SearchSource[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  thought?: string;
  thoughtDuration?: number;
  isThinking?: boolean;
  searchInfo?: SearchInfo;
  imageUrl?: string;
  imagePrompt?: string;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

export type ModelType = 'chatgpt' | 'think' | 'search';
