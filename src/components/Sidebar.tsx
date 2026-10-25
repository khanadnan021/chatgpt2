import React, { useState } from 'react';
import {
  SquarePen,
  Search,
  Pin,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  MoreHorizontal,
  Settings,
  Sparkles,
} from 'lucide-react';
import { ChatGPTIcon, SidebarCollapseIcon } from './Icons';
import { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePin,
  isOpen,
  onToggleOpen,
  userName,
  onUpdateUserName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // Group conversations by time
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.isPinned);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const todayChats = unpinnedConversations.filter((c) => now - c.updatedAt < oneDay);
  const yesterdayChats = unpinnedConversations.filter(
    (c) => now - c.updatedAt >= oneDay && now - c.updatedAt < 2 * oneDay
  );
  const previousChats = unpinnedConversations.filter((c) => now - c.updatedAt >= 2 * oneDay);

  const handleStartRename = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleSaveSettings = () => {
    if (tempName.trim()) {
      onUpdateUserName(tempName.trim());
    }
    setShowSettings(false);
  };

  return (
    <>
      {/* Collapsed Left Icon Rail (as seen in screenshot) */}
      {!isOpen && (
        <aside className="w-13 h-screen bg-[#171717] border-r border-[#262626] flex flex-col items-center py-3.5 justify-between shrink-0 select-none z-20">
          <div className="flex flex-col items-center gap-3">
            {/* ChatGPT Logo */}
            <button
              type="button"
              onClick={onNewChat}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-[#282828] transition-colors"
              title="ChatGPT"
            >
              <ChatGPTIcon className="w-5 h-5 text-white" />
            </button>

            {/* New chat button */}
            <button
              type="button"
              onClick={onNewChat}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#b4b4b4] hover:text-white hover:bg-[#282828] transition-colors"
              title="New chat"
            >
              <SquarePen className="w-5 h-5" />
            </button>

            {/* Search button */}
            <button
              type="button"
              onClick={onToggleOpen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#b4b4b4] hover:text-white hover:bg-[#282828] transition-colors"
              title="Search chats"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Pinned / Library */}
            <button
              type="button"
              onClick={onToggleOpen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#b4b4b4] hover:text-white hover:bg-[#282828] transition-colors"
              title="Pinned chats"
            >
              <Pin className="w-5 h-5" />
            </button>

            {/* Chat bubble icon */}
            <button
              type="button"
              onClick={onToggleOpen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#b4b4b4] hover:text-white hover:bg-[#282828] transition-colors"
              title="Chat history"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Expand sidebar toggle */}
            <button
              type="button"
              onClick={onToggleOpen}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8e8e8e] hover:text-white hover:bg-[#282828] transition-colors"
              title="Expand sidebar"
            >
              <SidebarCollapseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* User avatar circle at bottom: green with 'AD' */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
            title={`Account: ${userName}`}
          >
            {userName ? userName.slice(0, 2).toUpperCase() : 'AD'}
          </button>
        </aside>
      )}

      {/* Expanded Sidebar Drawer */}
      {isOpen && (
        <aside className="w-64 h-screen bg-[#171717] border-r border-[#262626] flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-200">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header with New chat & Collapse */}
            <div className="p-3 flex items-center justify-between border-b border-[#262626]">
              <button
                type="button"
                onClick={onNewChat}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333333] text-sm text-[#ececec] transition-colors flex-1 mr-2"
              >
                <SquarePen className="w-4 h-4 text-zinc-400" />
                <span className="font-medium">New chat</span>
              </button>

              <button
                type="button"
                onClick={onToggleOpen}
                className="p-2 rounded-xl text-[#8e8e8e] hover:text-white hover:bg-[#262626] transition-colors"
                title="Collapse sidebar"
              >
                <SidebarCollapseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-3 pt-2 pb-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#212121] border border-[#303030] text-xs text-zinc-400 focus-within:border-zinc-500">
                <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="bg-transparent text-[#ececec] placeholder-zinc-500 outline-none w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 text-xs">
              {/* Pinned section */}
              {pinnedConversations.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </div>
                  <div className="space-y-0.5">
                    {pinnedConversations.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {/* Today */}
              {todayChats.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[11px] font-semibold text-zinc-500 tracking-wider">
                    Today
                  </div>
                  <div className="space-y-0.5">
                    {todayChats.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {/* Yesterday */}
              {yesterdayChats.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[11px] font-semibold text-zinc-500 tracking-wider">
                    Yesterday
                  </div>
                  <div className="space-y-0.5">
                    {yesterdayChats.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {/* Previous */}
              {previousChats.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[11px] font-semibold text-zinc-500 tracking-wider">
                    Previous 7 Days
                  </div>
                  <div className="space-y-0.5">
                    {previousChats.map((c) => renderConversationItem(c))}
                  </div>
                </div>
              )}

              {conversations.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No conversations yet. Start a new chat!
                </div>
              )}
            </div>
          </div>

          {/* User profile section at bottom */}
          <div className="p-2.5 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#242424] transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {userName ? userName.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{userName}</p>
                  <p className="text-[10px] text-zinc-400 truncate">Free Plan</p>
                </div>
              </div>
              <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
            </button>
          </div>
        </aside>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#212121] border border-[#383838] rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <h2 className="text-base font-semibold text-white">Settings & Profile</h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#333333]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Your Display Name (Greeting)
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-xl px-3 py-2 text-white outline-none focus:border-zinc-400 text-sm"
                  placeholder="e.g. adnan"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  This customizes the greeting on your home screen: "Good to see you, {tempName}."
                </p>
              </div>

              <div className="pt-2 border-t border-[#333333]">
                <p className="text-xs text-zinc-400 mb-1">Active AI Model</p>
                <div className="p-3 rounded-xl bg-[#2a2a2a] border border-[#383838] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChatGPTIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-white">ChatGPT (Gemini 3.8 Flash)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    High Speed
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#333333]">
                <p className="text-xs text-zinc-400 mb-2">Data & Storage</p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all chat history?')) {
                      localStorage.removeItem('chatgpt_conversations');
                      window.location.reload();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 text-red-300 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all chat history</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#333333]">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-[#333333] text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-1.5 rounded-xl bg-white text-black font-medium text-xs hover:bg-zinc-200 transition-colors shadow"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  function renderConversationItem(c: Conversation) {
    const isActive = c.id === activeId;
    const isEditing = c.id === editingId;

    if (isEditing) {
      return (
        <div key={c.id} className="flex items-center gap-1 px-2 py-1.5 bg-[#262626] rounded-lg">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(c.id);
              if (e.key === 'Escape') setEditingId(null);
            }}
            autoFocus
            className="flex-1 bg-transparent text-white text-xs outline-none"
          />
          <button
            onClick={() => handleSaveRename(c.id)}
            className="p-1 hover:text-emerald-400 text-zinc-400"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="p-1 hover:text-red-400 text-zinc-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={c.id}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-xs transition-colors ${
          isActive
            ? 'bg-[#262626] text-white font-medium'
            : 'text-zinc-300 hover:bg-[#212121] hover:text-white'
        }`}
        onClick={() => onSelectConversation(c.id)}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 pr-1">
          {c.isPinned && <Pin className="w-3 h-3 text-zinc-400 shrink-0" />}
          <span className="truncate">{c.title}</span>
        </div>

        {/* Action button menu on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(c.id);
            }}
            className="p-1 hover:text-white text-zinc-500 rounded hover:bg-[#333333]"
            title={c.isPinned ? 'Unpin chat' : 'Pin chat'}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStartRename(c);
            }}
            className="p-1 hover:text-white text-zinc-500 rounded hover:bg-[#333333]"
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(c.id);
            }}
            className="p-1 hover:text-red-400 text-zinc-500 rounded hover:bg-[#333333]"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
};
