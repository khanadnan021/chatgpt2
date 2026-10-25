import React, { useState } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronRight,
  Globe,
  ExternalLink,
  Download,
  Sparkles,
} from 'lucide-react';
import { ChatGPTIcon, BrainIcon } from './Icons';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  userName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  userName = 'adnan',
}) => {
  const [copied, setCopied] = useState(false);
  const [thumbs, setThumbs] = useState<'up' | 'down' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showThoughts, setShowThoughts] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (message.role === 'user') {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-4 flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end gap-2">
          {/* User attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end mb-1">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="rounded-xl overflow-hidden border border-[#3e3e3e] bg-[#2a2a2a] max-w-xs"
                >
                  {att.mimeType.startsWith('image/') ? (
                    <img
                      src={att.data}
                      alt={att.name}
                      className="max-h-56 max-w-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="p-3 text-xs text-zinc-300 font-mono">{att.name}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* User message bubble */}
          <div className="bg-[#2f2f2f] text-[#ececec] rounded-[22px] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-5">
      <div className="flex gap-4 items-start">
        {/* ChatGPT spiral avatar */}
        <div className="w-8 h-8 rounded-full border border-[#3c3c3c] bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <ChatGPTIcon className="w-5 h-5 text-white" />
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Think mode drop-down */}
          {message.thought && (
            <div className="rounded-xl border border-[#383838] bg-[#1a1a1a] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowThoughts((prev) => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-[#a0a0a0] hover:text-[#ececec] hover:bg-[#242424] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BrainIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-medium text-sky-300">
                    {message.isThinking
                      ? 'Thinking...'
                      : `Thought for ${message.thoughtDuration || 3} seconds`}
                  </span>
                </div>
                {showThoughts ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
              {showThoughts && (
                <div className="px-3.5 pb-3 pt-1 border-t border-[#2e2e2e] text-xs text-[#8e8e8e] leading-relaxed font-mono whitespace-pre-wrap">
                  {message.thought}
                </div>
              )}
            </div>
          )}

          {/* Web search sources */}
          {message.searchInfo && message.searchInfo.sources.length > 0 && (
            <div className="rounded-xl border border-[#383838] bg-[#1c1c1c] p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Searched the web</span>
                {message.searchInfo.queries.length > 0 && (
                  <span className="text-zinc-500 text-[11px]">
                    ({message.searchInfo.queries.join(', ')})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {message.searchInfo.sources.slice(0, 4).map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#282828] hover:bg-[#333333] border border-[#3a3a3a] text-xs text-zinc-300 hover:text-white transition-colors"
                  >
                    <span className="truncate max-w-[150px]">{source.title}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Generated Image display if present */}
          {message.imageUrl && (
            <div className="my-3 rounded-2xl overflow-hidden border border-[#383838] bg-[#1a1a1a] max-w-md group relative">
              <img
                src={message.imageUrl}
                alt={message.imagePrompt || 'Generated artwork'}
                className="w-full h-auto object-cover max-h-96"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={message.imageUrl}
                  download="chatgpt-image.png"
                  className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs backdrop-blur-sm shadow flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </a>
              </div>
              {message.imagePrompt && (
                <div className="p-2.5 bg-[#202020] border-t border-[#333333] text-xs text-zinc-400">
                  <span className="font-medium text-zinc-300">Prompt:</span> {message.imagePrompt}
                </div>
              )}
            </div>
          )}

          {/* Content / Markdown body */}
          <div className="text-[15px] leading-relaxed text-[#ececec]">
            <MarkdownRenderer content={message.content} />
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse" />
            )}
          </div>

          {/* Error notice if any */}
          {message.error && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
              {message.error}
            </div>
          )}

          {/* Action toolbar */}
          {!message.isStreaming && (
            <div className="flex items-center gap-1 pt-1 text-[#8e8e8e]">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:text-white hover:bg-[#2f2f2f] transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={handleSpeak}
                className={`p-1.5 rounded-md hover:text-white hover:bg-[#2f2f2f] transition-colors ${
                  isSpeaking ? 'text-sky-400 bg-[#2f2f2f]' : ''
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setThumbs(thumbs === 'up' ? null : 'up')}
                className={`p-1.5 rounded-md hover:text-white hover:bg-[#2f2f2f] transition-colors ${
                  thumbs === 'up' ? 'text-emerald-400 bg-[#2f2f2f]' : ''
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setThumbs(thumbs === 'down' ? null : 'down')}
                className={`p-1.5 rounded-md hover:text-white hover:bg-[#2f2f2f] transition-colors ${
                  thumbs === 'down' ? 'text-rose-400 bg-[#2f2f2f]' : ''
                }`}
                title="Bad response"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>

              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="p-1.5 rounded-md hover:text-white hover:bg-[#2f2f2f] transition-colors"
                  title="Regenerate response"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
