import React from 'react';
import { Image as ImageIcon, PenLine, Globe } from 'lucide-react';
import { ChatInput } from './ChatInput';
import { Attachment } from '../types';

interface WelcomeScreenProps {
  userName?: string;
  onSendMessage: (text: string, attachments: Attachment[], think: boolean, webSearch: boolean) => void;
  onOpenVoice: () => void;
  isStreaming: boolean;
  onStopStreaming?: () => void;
  onSelectAction: (actionType: 'image' | 'write' | 'search') => void;
  initialThink?: boolean;
  initialWebSearch?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName = 'adnan',
  onSendMessage,
  onOpenVoice,
  isStreaming,
  onStopStreaming,
  onSelectAction,
  initialThink,
  initialWebSearch,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4 pb-12 select-none">
      {/* Title greeting: Good to see you, adnan. */}
      <div className="mb-7 text-center">
        <h1 className="text-2xl sm:text-[30px] font-normal tracking-tight text-[#f3f3f3]">
          Good to see you, {userName}.
        </h1>
      </div>

      {/* Center Input Bar */}
      <div className="w-full max-w-3xl mb-5">
        <ChatInput
          onSendMessage={onSendMessage}
          onOpenVoice={onOpenVoice}
          isStreaming={isStreaming}
          onStopStreaming={onStopStreaming}
          initialThink={initialThink}
          initialWebSearch={initialWebSearch}
        />
      </div>

      {/* Suggested action buttons matching screenshot */}
      <div className="w-full max-w-3xl flex flex-col items-start gap-1 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectAction('image')}
          className="flex items-center gap-3 py-2 px-2.5 rounded-lg text-[#b4b4b4] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors text-sm group"
        >
          <ImageIcon className="w-4 h-4 text-[#8e8e8e] group-hover:text-white transition-colors" />
          <span>Create an image or sticker</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectAction('write')}
          className="flex items-center gap-3 py-2 px-2.5 rounded-lg text-[#b4b4b4] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors text-sm group"
        >
          <PenLine className="w-4 h-4 text-[#8e8e8e] group-hover:text-white transition-colors" />
          <span>Write or edit</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectAction('search')}
          className="flex items-center gap-3 py-2 px-2.5 rounded-lg text-[#b4b4b4] hover:text-[#ececec] hover:bg-[#2a2a2a] transition-colors text-sm group"
        >
          <Globe className="w-4 h-4 text-[#8e8e8e] group-hover:text-white transition-colors" />
          <span>Search the web</span>
        </button>
      </div>
    </div>
  );
};
