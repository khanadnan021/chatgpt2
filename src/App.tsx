import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { VoiceModal } from './components/VoiceModal';
import { Conversation, Message, Attachment } from './types';

export default function App() {
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('chatgpt_user_name') || 'adnan';
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('chatgpt_conversations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved conversations', e);
      }
    }
    return [];
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModel, setActiveModel] = useState('chatgpt-flash');
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Suggested actions states
  const [suggestedThink, setSuggestedThink] = useState(false);
  const [suggestedWebSearch, setSuggestedWebSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save conversations to localStorage
  useEffect(() => {
    if (!isTemporaryChat) {
      localStorage.setItem('chatgpt_conversations', JSON.stringify(conversations));
    }
  }, [conversations, isTemporaryChat]);

  // Save user name
  useEffect(() => {
    localStorage.setItem('chatgpt_user_name', userName);
  }, [userName]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  // Scroll to bottom on message updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleNewChat = () => {
    setActiveId(null);
    setSuggestedThink(false);
    setSuggestedWebSearch(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Check if prompt is an image generation request
  const isImageRequest = (prompt: string): boolean => {
    const lower = prompt.toLowerCase().trim();
    return (
      lower.startsWith('create an image') ||
      lower.startsWith('generate an image') ||
      lower.startsWith('draw ') ||
      lower.startsWith('make an image') ||
      lower.startsWith('paint ') ||
      lower.includes('create a sticker') ||
      lower.includes('generate a sticker')
    );
  };

  const handleSendMessage = async (
    text: string,
    attachments: Attachment[] = [],
    think: boolean = false,
    webSearch: boolean = false
  ) => {
    if (!text && attachments.length === 0) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      attachments,
      timestamp: Date.now(),
    };

    let targetConvId = activeId;

    if (!targetConvId) {
      // Create new conversation
      targetConvId = Math.random().toString(36).substring(2, 9);
      const newTitle = text.slice(0, 32) || 'New conversation';
      const newConv: Conversation = {
        id: targetConvId,
        title: newTitle,
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(targetConvId);
    } else {
      // Append to active conversation
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: [...c.messages, userMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );
    }

    // Determine assistant message parameters
    const useThink = think || activeModel === 'chatgpt-think';
    const useWeb = webSearch || activeModel === 'chatgpt-web';

    const assistantMsgId = Math.random().toString(36).substring(2, 9);
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      isThinking: useThink,
      thought: useThink ? 'Analyzing request and organizing steps...' : undefined,
    };

    // Append blank assistant message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              messages: [...c.messages, initialAssistantMsg],
            }
          : c
      )
    );

    setIsStreaming(true);

    // If it's an image generation request
    if (isImageRequest(text)) {
      try {
        const imageRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text, aspectRatio: '1:1' }),
        });

        const imageData = await imageRes.json();

        if (imageData.imageUrl) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetConvId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMsgId
                        ? {
                            ...m,
                            content: `Here is the image you requested based on: "${text}"`,
                            imageUrl: imageData.imageUrl,
                            imagePrompt: text,
                            isStreaming: false,
                          }
                        : m
                    ),
                  }
                : c
            )
          );
        } else {
          throw new Error(imageData.error || 'Failed to generate image');
        }
      } catch (err: any) {
        console.error('Image generation error:', err);
        // Fallback to text response explaining
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: `I attempted to generate an image for "${text}", but encountered an issue: ${err.message}. Let me know if you would like me to describe or try again!`,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // Streaming SSE chat request
    try {
      const conv = conversations.find((c) => c.id === targetConvId);
      const history = conv ? [...conv.messages, userMessage] : [userMessage];

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          think: useThink,
          webSearch: useWeb,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let thoughtDuration = useThink ? Math.floor(Math.random() * 3) + 2 : 0;

      if (!reader) {
        throw new Error('Unable to read stream response');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          let eventType = 'chunk';
          let dataStr = '';

          const lineParts = line.split('\n');
          for (const lp of lineParts) {
            if (lp.startsWith('event: ')) {
              eventType = lp.replace('event: ', '').trim();
            } else if (lp.startsWith('data: ')) {
              dataStr = lp.replace('data: ', '').trim();
            }
          }

          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);

              if (eventType === 'chunk' && parsed.text) {
                streamedContent += parsed.text;

                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === targetConvId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === assistantMsgId
                              ? {
                                  ...m,
                                  content: streamedContent,
                                  isStreaming: true,
                                  isThinking: false,
                                  thoughtDuration,
                                  thought: useThink
                                    ? `Identified key requirements.\nSynthesized answer structure with code and clear explanations.\nFormulated final output.`
                                    : undefined,
                                }
                              : m
                          ),
                        }
                      : c
                  )
                );
              } else if (eventType === 'done') {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === targetConvId
                      ? {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === assistantMsgId
                              ? {
                                  ...m,
                                  content: parsed.fullText || streamedContent,
                                  searchInfo: parsed.searchInfo || undefined,
                                  isStreaming: false,
                                  isThinking: false,
                                  thoughtDuration,
                                }
                              : m
                          ),
                        }
                      : c
                  )
                );
              } else if (eventType === 'error') {
                throw new Error(parsed.message || 'Stream generation failed');
              }
            } catch (err) {
              console.error('Error parsing SSE event data:', err);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream request aborted by user');
      } else {
        console.error('Chat error:', err);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            "I'm sorry, I encountered an issue processing your request. Please try again.",
                          error: err.message,
                          isStreaming: false,
                          isThinking: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const handleRegenerate = () => {
    if (!activeConversation) return;
    const messages = activeConversation.messages;
    if (messages.length < 2) return;

    // Get the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Remove the last assistant message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              messages: c.messages.filter((_, idx) => idx !== c.messages.length - 1),
            }
          : c
      )
    );

    // Resend message
    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments, false, false);
  };

  // Voice Mode direct interaction
  const handleVoiceMessage = async (userText: string): Promise<string> => {
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userText }],
          think: false,
          webSearch: false,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      if (!reader) return 'I could not process that.';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.includes('event: chunk') || line.includes('event: done')) {
            const dataMatch = line.match(/data: (.*)/);
            if (dataMatch) {
              try {
                const parsed = JSON.parse(dataMatch[1]);
                if (parsed.text) fullText += parsed.text;
                if (parsed.fullText) fullText = parsed.fullText;
              } catch (e) {}
            }
          }
        }
      }

      return fullText || 'How can I assist you today?';
    } catch (e: any) {
      return `Sorry, I had trouble connecting: ${e.message}`;
    }
  };

  // Suggested actions clicks
  const handleSelectAction = (actionType: 'image' | 'write' | 'search') => {
    if (actionType === 'image') {
      handleSendMessage(
        'Create an image or sticker of a cute robotic companion exploring a crystal cave'
      );
    } else if (actionType === 'write') {
      handleSendMessage(
        'Write or edit: A clear, engaging announcement email introducing an exciting new feature to our community.'
      );
    } else if (actionType === 'search') {
      setSuggestedWebSearch(true);
      handleSendMessage('What are the most notable recent advancements in AI technology today?', [], false, true);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec]">
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePin={handleTogglePin}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
        userName={userName}
        onUpdateUserName={setUserName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onNewChat={handleNewChat}
          activeModel={activeModel}
          onSelectModel={setActiveModel}
          isTemporaryChat={isTemporaryChat}
          onToggleTemporaryChat={() => setIsTemporaryChat((prev) => !prev)}
          chatTitle={activeConversation?.title}
        />

        {/* Content View: Welcome Screen (Empty) OR Active Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <WelcomeScreen
              userName={userName}
              onSendMessage={handleSendMessage}
              onOpenVoice={() => setIsVoiceOpen(true)}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              onSelectAction={handleSelectAction}
              initialThink={suggestedThink}
              initialWebSearch={suggestedWebSearch}
            />
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              {/* Message History */}
              <div className="py-4 space-y-2">
                {activeConversation.messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    userName={userName}
                    onRegenerate={
                      msg.role === 'assistant' &&
                      msg.id ===
                        activeConversation.messages[activeConversation.messages.length - 1].id
                        ? handleRegenerate
                        : undefined
                    }
                  />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Bottom Sticky Input for Active Chat */}
              <div className="sticky bottom-0 bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent pt-4 pb-4">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  onOpenVoice={() => setIsVoiceOpen(true)}
                  isStreaming={isStreaming}
                  onStopStreaming={handleStopStreaming}
                />
                <div className="text-center mt-2">
                  <p className="text-[11px] text-zinc-500">
                    ChatGPT can make mistakes. Verify important information.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Voice Mode Overlay */}
      <VoiceModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onNewMessage={handleVoiceMessage}
      />
    </div>
  );
}
