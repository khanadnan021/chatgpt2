import React, { useState } from 'react';
import {
  ChevronDown,
  SquarePen,
  Share2,
  Sparkles,
  Zap,
  Brain,
  Globe,
  Clock,
  Check,
} from 'lucide-react';
import { SidebarCollapseIcon, ChatGPTIcon } from './Icons';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  activeModel: string;
  onSelectModel: (model: string) => void;
  isTemporaryChat: boolean;
  onToggleTemporaryChat: () => void;
  chatTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  onNewChat,
  activeModel,
  onSelectModel,
  isTemporaryChat,
  onToggleTemporaryChat,
  chatTitle,
}) => {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const models = [
    {
      id: 'chatgpt-flash',
      name: 'ChatGPT',
      tagline: 'Great for everyday tasks & quick answers',
      icon: Sparkles,
      badge: 'Default',
    },
    {
      id: 'chatgpt-think',
      name: 'ChatGPT Think',
      tagline: 'Uses deep reasoning for coding & complex math',
      icon: Brain,
      badge: 'Reasoning',
    },
    {
      id: 'chatgpt-web',
      name: 'ChatGPT Search',
      tagline: 'Grounded with real-time web search results',
      icon: Globe,
      badge: 'Browse',
    },
  ];

  return (
    <header className="h-14 px-3 flex items-center justify-between border-b border-[#262626] bg-[#212121]/80 backdrop-blur-md sticky top-0 z-10 select-none">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-[#8e8e8e] hover:text-white hover:bg-[#2e2e2e] transition-colors"
            title="Open sidebar"
          >
            <SidebarCollapseIcon className="w-5 h-5" />
          </button>
        )}

        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModelDropdown((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#2c2c2c] transition-colors text-base font-semibold text-[#f0f0f0] group"
          >
            <span>{chatTitle ? (chatTitle.length > 25 ? chatTitle.slice(0, 25) + '...' : chatTitle) : 'ChatGPT'}</span>
            <ChevronDown className="w-4 h-4 text-[#8e8e8e] group-hover:text-white transition-colors" />
          </button>

          {showModelDropdown && (
            <div className="absolute top-11 left-0 w-72 bg-[#212121] border border-[#383838] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Model Selection
              </div>
              {models.map((m) => {
                const Icon = m.icon;
                const isSelected = activeModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-[#2c2c2c] text-white'
                        : 'hover:bg-[#282828] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-[#333333] mt-0.5 shrink-0 text-white">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#383838] text-zinc-400">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{m.tagline}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        {/* Temporary chat indicator */}
        <button
          type="button"
          onClick={onToggleTemporaryChat}
          className={`p-2 rounded-xl text-xs transition-colors flex items-center gap-1 ${
            isTemporaryChat
              ? 'bg-amber-950/50 text-amber-300 border border-amber-800/60'
              : 'text-[#8e8e8e] hover:text-white hover:bg-[#2c2c2c]'
          }`}
          title={isTemporaryChat ? 'Temporary chat active (not saved to history)' : 'Start temporary chat'}
        >
          <Clock className="w-4 h-4" />
          {isTemporaryChat && <span className="text-[11px]">Temporary</span>}
        </button>

        {/* Share button */}
        <button
          type="button"
          onClick={handleShare}
          className="p-2 rounded-xl text-[#8e8e8e] hover:text-white hover:bg-[#2c2c2c] transition-colors"
          title="Share link"
        >
          {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
        </button>

        {/* New chat icon */}
        <button
          type="button"
          onClick={onNewChat}
          className="p-2 rounded-xl text-[#8e8e8e] hover:text-white hover:bg-[#2c2c2c] transition-colors"
          title="New chat"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
