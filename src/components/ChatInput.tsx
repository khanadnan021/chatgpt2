import React, { useRef, useEffect, useState } from 'react';
import { Plus, ArrowUp, Mic, MicOff, Square, Globe, Image as ImageIcon, Sparkles, X, FileText } from 'lucide-react';
import { BrainIcon, VoiceWavesIcon } from './Icons';
import { Attachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[], think: boolean, webSearch: boolean) => void;
  onOpenVoice: () => void;
  isStreaming: boolean;
  onStopStreaming?: () => void;
  initialThink?: boolean;
  initialWebSearch?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onOpenVoice,
  isStreaming,
  onStopStreaming,
  initialThink = false,
  initialWebSearch = false,
}) => {
  const [text, setText] = useState('');
  const [think, setThink] = useState(initialThink);
  const [webSearch, setWebSearch] = useState(initialWebSearch);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setThink(initialThink);
  }, [initialThink]);

  useEffect(() => {
    setWebSearch(initialWebSearch);
  }, [initialWebSearch]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) {
      if (onStopStreaming) onStopStreaming();
      return;
    }

    if (!text.trim() && attachments.length === 0) return;

    onSendMessage(text.trim(), attachments, think, webSearch);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            data: result,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowPlusMenu(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Speech to text toggle
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsRecording(false);
    }
  };

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto relative px-3">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group bg-[#2a2a2a] border border-[#3d3d3d] rounded-xl p-2 flex items-center gap-2 max-w-xs shadow-md"
            >
              {att.mimeType.startsWith('image/') ? (
                <img src={att.data} alt={att.name} className="w-12 h-12 object-cover rounded-lg" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#383838] flex items-center justify-center text-zinc-300">
                  <FileText className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs font-medium text-white truncate">{att.name}</p>
                <p className="text-[10px] text-zinc-400">
                  {att.size ? `${(att.size / 1024).toFixed(0)} KB` : 'File'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#444444] hover:bg-[#555555] text-white rounded-full flex items-center justify-center text-xs shadow transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input container matching screenshot */}
      <div className="relative rounded-[28px] bg-[#2f2f2f] hover:bg-[#333333] transition-colors border border-[#3e3e3e] shadow-xl focus-within:border-[#525252] px-3.5 py-2.5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {/* Plus button menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPlusMenu((prev) => !prev)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#b4b4b4] hover:text-white hover:bg-[#424242] transition-colors"
              title="Add attachment or action"
            >
              <Plus className="w-5 h-5" />
            </button>

            {showPlusMenu && (
              <div className="absolute bottom-10 left-0 w-56 bg-[#212121] border border-[#3a3a3a] rounded-2xl shadow-2xl p-1.5 z-50 text-sm text-[#e0e0e0] flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowPlusMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#2f2f2f] text-left transition-colors"
                >
                  <Plus className="w-4 h-4 text-zinc-400" />
                  <span>Upload from computer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWebSearch((prev) => !prev);
                    setShowPlusMenu(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#2f2f2f] text-left transition-colors ${
                    webSearch ? 'text-sky-400 bg-[#2a2a2a]' : ''
                  }`}
                >
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span>Web search ({webSearch ? 'On' : 'Off'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThink((prev) => !prev);
                    setShowPlusMenu(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#2f2f2f] text-left transition-colors ${
                    think ? 'text-purple-400 bg-[#2a2a2a]' : ''
                  }`}
                >
                  <BrainIcon className="w-4 h-4 text-zinc-400" />
                  <span>Think mode ({think ? 'On' : 'Off'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText((prev) => (prev ? prev : 'Create an image of '));
                    setShowPlusMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#2f2f2f] text-left transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-zinc-400" />
                  <span>Create an image</span>
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,text/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Text input area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask ChatGPT"
            rows={1}
            className="flex-1 bg-transparent text-[#ececec] placeholder-[#8e8e8e] outline-none resize-none text-[15px] leading-relaxed py-1.5 px-1 max-h-44"
          />

          {/* Action pills & buttons on the right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Think button */}
            <button
              type="button"
              onClick={() => setThink((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors border ${
                think
                  ? 'bg-[#3b3b3b] text-sky-300 border-sky-500/50 shadow-sm'
                  : 'bg-transparent text-[#b4b4b4] hover:text-white border-[#444444] hover:bg-[#383838]'
              }`}
              title="Toggle deep reasoning mode"
            >
              <BrainIcon className={`w-3.5 h-3.5 ${think ? 'text-sky-400' : 'text-[#a0a0a0]'}`} />
              <span className="font-medium">Think</span>
            </button>

            {/* Mic button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'text-[#b4b4b4] hover:text-white hover:bg-[#424242]'
              }`}
              title={isRecording ? 'Stop voice recording' : 'Dictate with voice'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Voice mode or Send button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : hasContent ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenVoice}
                className="w-8 h-8 rounded-full bg-[#1b73e8] hover:bg-[#1557b0] text-white flex items-center justify-center transition-colors shadow-sm"
                title="Start ChatGPT Voice Mode"
              >
                <VoiceWavesIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active badges row if Web Search or other features are active */}
        {webSearch && (
          <div className="flex items-center gap-1.5 px-1 pt-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-sky-950/70 border border-sky-800/60 text-sky-300">
              <Globe className="w-3 h-3" />
              Search the web active
              <button
                type="button"
                onClick={() => setWebSearch(false)}
                className="hover:text-white ml-0.5"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
